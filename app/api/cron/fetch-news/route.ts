import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { fetchRssFeed } from "@/lib/rss";
import { enqueueNewsItem } from "@/lib/review-queue";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

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

  for (const source of sources) {
    let added = 0;
    let skipped = 0;
    let errorMsg: string | undefined;

    try {
      const items = await fetchRssFeed(source.rssUrl);
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

    results.push({ name: source.name, added, skipped, error: errorMsg });
  }

  return NextResponse.json({
    ok: true,
    totalAdded: results.reduce((s, r) => s + r.added, 0),
    results,
  });
}
