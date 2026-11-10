import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { fetchRssFeed } from "@/lib/rss";
import { enqueueNewsItem } from "@/lib/review-queue";

export const dynamic = "force-dynamic";
// Raised from 60s: 20 sources were fetched sequentially (up to 15s each), so the
// run was killed after ~4 feeds and only the first priority source (OpenAI Blog)
// ever completed — making all news OpenAI-centric. Feeds are now fetched in
// parallel (bounded by the 15s per-feed timeout), but keep headroom.
export const maxDuration = 120;

const ITEMS_PER_SOURCE = 10;
const AI_KEYWORDS = /\b(ai|artificial intelligence|machine learning|llm|gpt|claude|gemini|openai|anthropic|deepmind|mistral|llama|neural|model|chatbot|generative|transformer)\b/i;

function verifyCronSecret(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sources = await prisma.source.findMany({
    where: { enabled: true },
    orderBy: { priority: "desc" },
  });

  const results: Array<{ name: string; added: number; skipped: number; error?: string }> = [];

  // Fetch every feed CONCURRENTLY (each bounded by the 15s per-feed timeout in
  // fetchRssFeed) so total network time ≈ the slowest feed, not the sum. The
  // old sequential loop blew past the function budget and starved all sources
  // after the first few, leaving only OpenAI Blog.
  const feeds = await Promise.allSettled(sources.map((s) => fetchRssFeed(s.rssUrl)));

  for (let i = 0; i < sources.length; i++) {
    const source = sources[i];
    const feed = feeds[i];
    let added = 0;
    let skipped = 0;
    let fetched = 0;
    let errorMsg: string | undefined;

    try {
      if (feed.status === "rejected") {
        throw feed.reason instanceof Error ? feed.reason : new Error(String(feed.reason));
      }
      const items = feed.value;
      fetched = items.length;
      let enqueued = 0;

      for (const item of items) {
        if (enqueued >= ITEMS_PER_SOURCE) break;
        if (!AI_KEYWORDS.test(item.title + " " + item.description)) {
          skipped++;
          continue;
        }
        const id = await enqueueNewsItem({
          sourceUrl: item.link,
          title: item.title,
          content: item.description,
          publishedAt: item.pubDate ? new Date(item.pubDate) : null,
          sourceName: source.name,
          sourceId: source.id,
          imageUrl: item.imageUrl,
        });
        if (id) { added++; enqueued++; }
        else skipped++;
      }

      await prisma.source.update({
        where: { id: source.id },
        data: { lastSyncedAt: new Date() },
      });
    } catch (err) {
      errorMsg = err instanceof Error ? err.message : "Unknown error";
    }

    // Persisted per-source outcome — lastSyncedAt alone can't tell "synced, found
    // nothing usable" from "actually broken", which let several dead feeds go
    // unnoticed for weeks.
    await prisma.sourceRun.create({
      data: { sourceId: source.id, fetched, added, skipped, error: errorMsg },
    }).catch(() => {
      // logging is best-effort; must never block the ingest loop
    });

    results.push({ name: source.name, added, skipped, error: errorMsg });
  }

  return NextResponse.json({
    ok: true,
    totalAdded: results.reduce((s, r) => s + r.added, 0),
    results,
  });
}
