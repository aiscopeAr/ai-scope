import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { processArticleWithAI } from "@/lib/openai";
import { markProcessing, markProcessed, markFailed } from "@/lib/queue";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_RETRIES = 3;
const BATCH_SIZE = 5;

function verifyCronSecret(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  const auth = request.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch pending items (also retry failed items under retry limit)
  const items = await prisma.articleQueue.findMany({
    where: {
      OR: [
        { status: "pending" },
        { status: "failed", retryCount: { lt: MAX_RETRIES } },
      ],
    },
    orderBy: { createdAt: "asc" },
    take: BATCH_SIZE,
  });

  const results: Array<{
    id: string;
    status: "processed" | "failed" | "skipped";
    error?: string;
  }> = [];

  for (const item of items) {
    // Skip items with empty content
    if (!item.rawContent || item.rawContent.trim().length < 400) {
      await prisma.articleQueue.update({
        where: { id: item.id },
        data: { status: "failed", failureReason: "Content too short (<400 chars)" },
      });
      results.push({ id: item.id, status: "skipped" });
      continue;
    }

    try {
      await markProcessing(item.id);

      const processed = await processArticleWithAI(
        item.rawTitle ?? "Untitled",
        item.rawContent,
      );

      await markProcessed(item.id, processed);
      results.push({ id: item.id, status: "processed" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "AI processing failed";
      console.error(`[process-queue] Failed item ${item.id}:`, message);
      await markFailed(item.id, message);
      results.push({ id: item.id, status: "failed", error: message });
    }
  }

  return NextResponse.json({
    ok: true,
    processed: results.filter((r) => r.status === "processed").length,
    failed: results.filter((r) => r.status === "failed").length,
    skipped: results.filter((r) => r.status === "skipped").length,
    results,
  });
}
