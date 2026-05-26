/**
 * Pick pending ReviewQueue clusters and write deep reviews with OpenAI.
 * Runs once daily (Vercel Hobby). Processes up to MAX_PER_RUN items per invocation
 * so the backlog doesn't pile up.
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { writeReview } from "@/lib/review-openai";
import {
  markReviewProcessing,
  markReviewProcessed,
  markReviewFailed,
} from "@/lib/review-queue";
import type { AuthorSlug } from "@/lib/authors";

export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 min — up to 3 reviews × ~60s each

const MAX_RETRIES = 3;
const MAX_PER_RUN = 3; // process up to 3 items per cron run to clear backlog

function verifyCronSecret(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Reset stale processing items
  const staleThreshold = new Date(Date.now() - 10 * 60 * 1000);
  await prisma.reviewQueue.updateMany({
    where: { status: "processing", updatedAt: { lt: staleThreshold } },
    data: { status: "pending", failureReason: "Reset from stale processing" },
  });

  const items = await prisma.reviewQueue.findMany({
    where: {
      OR: [
        { status: "pending" },
        { status: "failed", retryCount: { lt: MAX_RETRIES } },
      ],
    },
    orderBy: { createdAt: "asc" },
    take: MAX_PER_RUN,
    include: {
      newsItems: {
        select: { title: true, content: true, sourceUrl: true, sourceName: true },
      },
    },
  });

  if (items.length === 0) {
    return NextResponse.json({ ok: true, message: "No pending review clusters" });
  }

  const results: Array<{ id: string; status: "processed" | "rejected" | "failed"; title?: string; error?: string }> = [];

  for (const item of items) {
    if (item.newsItems.length === 0) {
      await markReviewFailed(item.id, "Cluster has no news items");
      results.push({ id: item.id, status: "failed", error: "No news items" });
      continue;
    }

    try {
      await markReviewProcessing(item.id);

      const sources = item.newsItems.map((n) => ({
        title: n.title,
        content: n.content,
        url: n.sourceUrl,
        name: n.sourceName,
      }));

      const draft = await writeReview(item.topic, sources, item.authorSlug as AuthorSlug);

      if (!draft.isAiRelated) {
        await prisma.reviewQueue.update({
          where: { id: item.id },
          data: { status: "rejected", failureReason: "Not AI-related per AI classifier" },
        });
        results.push({ id: item.id, status: "rejected" });
        continue;
      }

      await markReviewProcessed(item.id, draft);
      results.push({ id: item.id, status: "processed", title: draft.titleAr });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      await markReviewFailed(item.id, message);
      results.push({ id: item.id, status: "failed", error: message });
    }
  }

  return NextResponse.json({
    ok: true,
    total: items.length,
    processed: results.filter((r) => r.status === "processed").length,
    rejected: results.filter((r) => r.status === "rejected").length,
    failed: results.filter((r) => r.status === "failed").length,
    results,
  });
}
