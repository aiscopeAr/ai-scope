import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { processArticleWithAI } from "@/lib/openai";
import { generateArticleImage } from "@/lib/replicate";
import { markProcessing, markProcessed, markFailed } from "@/lib/queue";
import { generateAllCaptions } from "@/lib/social/generate";
import type { SocialPlatform } from "@/lib/social";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_RETRIES = 5;
const DAILY_PUBLISH_LIMIT = 50;
// Process 1 item per call: OpenAI ~8s + Replicate ~20s = ~28s, well under 60s limit
const BATCH_SIZE = 1;

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

  // Only take items that have been AI-processed (have titleAr) but not yet published
  const readyItems = await prisma.articleQueue.findMany({
    where: { status: "processed", titleAr: { not: null } },
    orderBy: { processedAt: "asc" },
    take: remaining,
    include: { source: true },
  });

  let published = 0;

  for (const item of readyItems) {
    try {
      const suggestedSlug = item.suggestedCategory ?? "ai-models";
      const category =
        (await prisma.category.findFirst({ where: { slug: suggestedSlug } })) ??
        (await prisma.category.findFirst());

      if (!category) continue;

      const slug = item.slug ?? item.id;
      const existing = await prisma.article.findUnique({ where: { slug } });
      const finalSlug = existing ? `${slug}-${Date.now()}` : slug;

      // Generate a fresh Replicate image — never use RSS images
      const imagePrompt =
        item.featuredImagePrompt ??
        `${item.titleAr ?? item.rawTitle ?? "artificial intelligence"}, futuristic technology concept`;
      const imageUrl = await generateArticleImage(imagePrompt);

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

      // Queue social posts if any accounts are connected
      try {
        const accounts = await prisma.socialAccount.findMany({ where: { enabled: true } });
        if (accounts.length > 0) {
          const captions = await generateAllCaptions(
            {
              titleAr: item.titleAr ?? item.rawTitle ?? "Untitled",
              excerpt: item.summaryAr,
              contentAr: item.contentAr ?? item.rawContent,
              sourceName: item.sourceName ?? "",
              tags: item.tags ?? [],
            },
            accounts.map((a) => a.platform as SocialPlatform),
          );
          const article = await prisma.article.findUnique({
            where: { slug: finalSlug },
            select: { id: true },
          });
          if (article) {
            await prisma.socialPost.createMany({
              data: accounts.map((account) => ({
                articleId: article.id,
                accountId: account.id,
                platform: account.platform,
                caption: captions[account.platform as SocialPlatform] ?? "",
                status: "approved",
              })),
            });
          }
        }
      } catch (socialErr) {
        console.error(
          `[auto-publish] Social queue failed for ${finalSlug}:`,
          socialErr instanceof Error ? socialErr.message : socialErr,
        );
      }

      published++;
    } catch (err) {
      console.error(
        `[auto-publish] Failed item ${item.id}:`,
        err instanceof Error ? err.message : err,
      );
    }
  }

  return published;
}

export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Reset stale "processing" items older than 5 minutes back to pending
  // Use updatedAt so items don't get stuck permanently
  const staleThreshold = new Date(Date.now() - 5 * 60 * 1000);
  const staleReset = await prisma.articleQueue.updateMany({
    where: { status: "processing", updatedAt: { lt: staleThreshold } },
    data: { status: "pending", failureReason: "Reset from stale processing" },
  });

  // Check daily publish budget
  const publishedToday = await getPublishedTodayCount();
  const canPublish = Math.max(0, DAILY_PUBLISH_LIMIT - publishedToday);

  // Fetch one pending/failed item to process (text-only, fast)
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

  const results: Array<{ id: string; status: "processed" | "failed" | "skipped"; error?: string }> = [];

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

      // Step 1: AI text processing (title, content, tags, slug, image prompt)
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

  // Step 2: Publish one ready item (includes Replicate image generation)
  const autoPublished = await autoPublishReady(canPublish);

  return NextResponse.json({
    ok: true,
    staleReset: staleReset.count,
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
