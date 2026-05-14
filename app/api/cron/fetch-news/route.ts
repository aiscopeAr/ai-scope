import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { fetchRssFeed } from "@/lib/rss";
import { enqueueItem } from "@/lib/queue";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Take only the freshest article per source per run
const ITEMS_PER_SOURCE = 1;

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

  const results: Array<{
    sourceId: string;
    name: string;
    added: number;
    skipped: number;
    error?: string;
  }> = [];

  for (const source of sources) {
    let added = 0;
    let skipped = 0;
    let errorMsg: string | undefined;

    try {
      const items = await fetchRssFeed(source.rssUrl);

      // Only enqueue the first N fresh items per source
      let enqueued = 0;
      for (const item of items) {
        if (enqueued >= ITEMS_PER_SOURCE) break;
        const queued = await enqueueItem({
          ...item,
          sourceId: source.id,
          sourceName: source.name,
        });
        if (queued) { added++; enqueued++; }
        else skipped++;
      }

      await prisma.source.update({
        where: { id: source.id },
        data: { lastSyncedAt: new Date() },
      });
    } catch (err) {
      errorMsg = err instanceof Error ? err.message : "Unknown error";
      console.error(`[fetch-news] Failed source ${source.name}:`, errorMsg);
    }

    results.push({ sourceId: source.id, name: source.name, added, skipped, error: errorMsg });
  }

  const totalAdded = results.reduce((s, r) => s + r.added, 0);
  const totalFailed = results.filter((r) => r.error).length;

  return NextResponse.json({
    ok: true,
    sources: sources.length,
    totalAdded,
    totalFailed,
    results,
  });
}
