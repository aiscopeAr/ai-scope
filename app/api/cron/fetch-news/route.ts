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

  // Fetch feeds with BOUNDED concurrency. Fully sequential (old code) blew past
  // the 60s budget and left only OpenAI Blog; fully parallel (all 20 at once)
  // OOM'd/timed-out parsing many large feeds together (OpenAI's alone has ~1000
  // items). A small pool is fast (≈ a few waves of the 15s per-feed timeout, well
  // under maxDuration) and memory-safe.
  const FETCH_CONCURRENCY = 4;
  const feeds: PromiseSettledResult<Awaited<ReturnType<typeof fetchRssFeed>>>[] = new Array(sources.length);
  let nextIdx = 0;
  async function worker() {
    while (nextIdx < sources.length) {
      const i = nextIdx++;
      try {
        feeds[i] = { status: "fulfilled", value: await fetchRssFeed(sources[i].rssUrl) };
      } catch (reason) {
        feeds[i] = { status: "rejected", reason };
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(FETCH_CONCURRENCY, sources.length) }, () => worker()));

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
