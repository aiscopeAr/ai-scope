/**
 * Pick one pending ReviewQueue cluster and write a deep review with OpenAI.
 * Runs every ~30 min. One review per invocation (gpt-4o takes ~20–40s).
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
export const maxDuration = 120;

const MAX_RETRIES = 3;

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

  const item = await prisma.reviewQueue.findFirst({
    where: {
      OR: [
        { status: "pending" },
        { status: "failed", retryCount: { lt: MAX_RETRIES } },
      ],
    },
    orderBy: { createdAt: "asc" },
    include: {
      newsItems: {
        select: { title: true, content: true, sourceUrl: true, sourceName: true },
      },
    },
  });

  if (!item) {
    return NextResponse.json({ ok: true, message: "No pending review clusters" });
  }

  if (item.newsItems.length === 0) {
    await markReviewFailed(item.id, "Cluster has no news items");
    return NextResponse.json({ ok: true, skipped: item.id });
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
      return NextResponse.json({ ok: true, rejected: item.id });
    }

    await markReviewProcessed(item.id, draft);
    return NextResponse.json({ ok: true, processed: item.id, title: draft.titleAr });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    await markReviewFailed(item.id, message);
    return NextResponse.json({ ok: true, failed: item.id, error: message });
  }
}
