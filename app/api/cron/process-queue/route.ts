import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { processArticleWithAI } from "@/lib/openai";
import { generateArticleImage } from "@/lib/replicate";
import { markProcessing, markProcessed, markFailed } from "@/lib/queue";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_RETRIES = 10;
const BATCH_SIZE = 1;
const DAILY_PUBLISH_LIMIT = 9;

function verifyCronSecret(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

async function getPublishedTodayCount(): Promise<number> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  return prisma.article.count({
    where: { published: true, publishedAt: { gte: startOfDay } },
  });
}

async function autoPublishReady(remaining: number): Promise<number> {
  if (remaining <= 0) return 0;

  const readyItems = await prisma.articleQueue.findMany({
    where: { status: "processed" },
    orderBy: { createdAt: "asc" },
    take: remaining,
    include: { source: true },
  });

  let published = 0;

  for (const item of readyItems) {
    try {
      // Resolve category
      const suggestedSlug = item.suggestedCategory ?? "ai-models";
      const category = await prisma.category.findFirst({
        where: { slug: suggestedSlug },
      }) ?? await prisma.category.findFirst();

      if (!category) continue;

      const slug = item.slug ?? item.id;
      const existing = await prisma.article.findUnique({ where: { slug } });
      const finalSlug = existing ? `${slug}-${Date.now()}` : slug;

      const imageUrl = item.imageUrl ?? `https://picsum.photos/seed/${Math.floor(Math.random() * 100)}/800/450`;

      await prisma.article.create({
        data: {
          title: item.rawTitle ?? item.titleAr ?? "Untitled",
          titleAr: item.titleAr ?? item.rawTitle ?? "Untitled",
          slug: finalSlug,
          content: item.rawContent,
          contentAr: item.contentAr ?? item.rawContent,
          excerpt: item.summaryAr ?? undefined,
          imageUrl,
          sourceUrl: item.sourceUrl,
          sourceName: item.sourceName ?? "",
          tags: item.tags ?? [],
          categoryId: category.id,
          published: true,
          publishedAt: new Date(),
          score: 0,
        },
      });

      await prisma.articleQueue.update({
        where: { id: item.id },
        data: { status: "approved", approvedAt: new Date() },
      });

      published++;
    } catch (err) {
      console.error(`[auto-publish] Failed item ${item.id}:`, err instanceof Error ? err.message : err);
    }
  }

  return published;
}

export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Reset stale "processing" items older than 3 minutes back to pending
  const staleThreshold = new Date(Date.now() - 3 * 60 * 1000);
  await prisma.articleQueue.updateMany({
    where: { status: "processing", createdAt: { lt: staleThreshold } },
    data: { status: "pending", failureReason: "Reset from stale processing" },
  });

  // Check how many articles published today
  const publishedToday = await getPublishedTodayCount();
  const canPublish = Math.max(0, DAILY_PUBLISH_LIMIT - publishedToday);

  // Fetch pending/failed items to process
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

      const processed = await processArticleWithAI(item.rawTitle ?? "Untitled", item.rawContent);

      // Generate image with Replicate if no image from RSS
      let imageUrl = item.imageUrl ?? null;
      if (!imageUrl && processed.featuredImagePrompt) {
        imageUrl = await generateArticleImage(processed.featuredImagePrompt);
      }

      await markProcessed(item.id, processed);

      // Save image to queue item
      if (imageUrl) {
        await prisma.articleQueue.update({
          where: { id: item.id },
          data: { imageUrl },
        });
      }

      results.push({ id: item.id, status: "processed" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "AI processing failed";
      console.error(`[process-queue] Failed item ${item.id}:`, message);
      await markFailed(item.id, message);
      results.push({ id: item.id, status: "failed", error: message });
    }
  }

  // Auto-publish up to daily limit
  const autoPublished = await autoPublishReady(canPublish);

  return NextResponse.json({
    ok: true,
    publishedToday: publishedToday + autoPublished,
    dailyLimit: DAILY_PUBLISH_LIMIT,
    canPublish: Math.max(0, canPublish - autoPublished),
    processed: results.filter((r) => r.status === "processed").length,
    failed: results.filter((r) => r.status === "failed").length,
    skipped: results.filter((r) => r.status === "skipped").length,
    autoPublished,
    results,
  });
}
