import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { processArticleWithAI } from "@/lib/openai";
import { markProcessing, markProcessed, markFailed } from "@/lib/queue";
import { isAiRelated } from "@/lib/classifier";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_RETRIES = 5;

function verifyCronSecret(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Reset stale "processing" items older than 5 minutes
  const staleThreshold = new Date(Date.now() - 5 * 60 * 1000);
  const staleReset = await prisma.articleQueue.updateMany({
    where: { status: "processing", updatedAt: { lt: staleThreshold } },
    data: { status: "pending", failureReason: "Reset from stale processing" },
  });

  // Pick ONE pending item — OpenAI text only (~8s, well under 60s)
  const item = await prisma.articleQueue.findFirst({
    where: {
      OR: [
        { status: "pending" },
        { status: "failed", retryCount: { lt: MAX_RETRIES } },
      ],
    },
    orderBy: { createdAt: "asc" },
  });

  if (!item) {
    return NextResponse.json({ ok: true, staleReset: staleReset.count, message: "No pending items" });
  }

  if (!item.rawContent || item.rawContent.trim().length < 400) {
    await prisma.articleQueue.update({
      where: { id: item.id },
      data: { status: "failed", failureReason: "Content too short (<400 chars)" },
    });
    return NextResponse.json({ ok: true, staleReset: staleReset.count, skipped: item.id });
  }

  // Layer 1 — fast keyword classifier (no OpenAI cost)
  if (!isAiRelated(item.rawTitle ?? "", item.rawContent)) {
    await prisma.articleQueue.update({
      where: { id: item.id },
      data: { status: "rejected", failureReason: "Not AI-related content" },
    });
    return NextResponse.json({ ok: true, staleReset: staleReset.count, rejected: item.id, reason: "Not AI-related" });
  }

  try {
    await markProcessing(item.id);
    const processed = await processArticleWithAI(item.rawTitle ?? "Untitled", item.rawContent);

    // Layer 2 — AI model's own judgment (catches edge cases that sneak past keywords)
    if (!processed.isAiRelated) {
      await prisma.articleQueue.update({
        where: { id: item.id },
        data: { status: "rejected", failureReason: "Rejected by AI classifier: not AI-related" },
      });
      return NextResponse.json({ ok: true, staleReset: staleReset.count, rejected: item.id, reason: "AI classifier: not AI-related" });
    }

    await markProcessed(item.id, processed);
    return NextResponse.json({ ok: true, staleReset: staleReset.count, processed: item.id, title: processed.titleAr });
  } catch (err) {
    const message = err instanceof Error ? err.message : "AI processing failed";
    await markFailed(item.id, message);
    return NextResponse.json({ ok: true, staleReset: staleReset.count, failed: item.id, error: message });
  }
}
