import { prisma } from "@/lib/db";
import type { RssItem } from "@/lib/rss";
import type { AiProcessedArticle } from "@/lib/openai";

export type EnqueueInput = RssItem & {
  sourceId: string;
  sourceName: string;
};

// Picsum photos — stable, free, no API key needed
// Each category gets a curated seed so images are consistent per category
const PICSUM_SEEDS: Record<string, number> = {
  "ai-models": 10,
  "research": 20,
  "companies": 30,
  "tools": 40,
  "policy": 50,
};

function imageFallback(category?: string): string {
  const seed = PICSUM_SEEDS[category ?? ""] ?? 1;
  return `https://picsum.photos/seed/${seed}/800/450`;
}

/** Enqueue a new RSS item. Returns null if it's a duplicate (by sourceUrl). */
export async function enqueueItem(item: EnqueueInput): Promise<string | null> {
  const existing = await prisma.articleQueue.findUnique({
    where: { sourceUrl: item.link },
    select: { id: true },
  });
  if (existing) return null;

  const queued = await prisma.articleQueue.create({
    data: {
      sourceUrl: item.link,
      rawTitle: item.title,
      rawContent: item.description,
      rawPublishedAt: item.pubDate ? new Date(item.pubDate) : null,
      sourceId: item.sourceId,
      sourceName: item.sourceName,
      status: "pending",
      imageUrl: item.imageUrl ?? null,
    },
    select: { id: true },
  });

  return queued.id;
}

/** Mark an item as being processed (prevents concurrent AI calls). */
export async function markProcessing(id: string) {
  await prisma.articleQueue.update({
    where: { id },
    data: { status: "processing" },
  });
}

/** Store AI results and mark done. */
export async function markProcessed(id: string, result: AiProcessedArticle) {
  await prisma.articleQueue.update({
    where: { id },
    data: {
      status: "processed",
      titleAr: result.titleAr,
      summaryAr: result.summaryAr,
      contentAr: result.contentAr,
      tags: result.tags,
      seoTitle: result.seoTitle,
      seoDescription: result.seoDescription,
      suggestedCategory: result.suggestedCategory,
      slug: result.slug,
      featuredImagePrompt: result.featuredImagePrompt,
      processedAt: new Date(),
      failureReason: null,
    },
  });
}

/** Log failure and increment retry counter. */
export async function markFailed(id: string, reason: string) {
  await prisma.articleQueue.update({
    where: { id },
    data: {
      status: "failed",
      failureReason: reason,
      retryCount: { increment: 1 },
    },
  });
}

/** Reset a failed item back to pending so it gets retried. */
export async function resetForRetry(id: string) {
  await prisma.articleQueue.update({
    where: { id },
    data: { status: "pending", failureReason: null },
  });
}

/** Approve: move from queue → Article table. Returns created article id. */
export async function approveQueueItem(
  id: string,
  overrides: {
    categoryId: string;
    categorySlug?: string;
    title: string;
    slug: string;
    published: boolean;
  },
): Promise<string> {
  const item = await prisma.articleQueue.findUniqueOrThrow({
    where: { id },
  });

  const imageUrl =
    item.imageUrl ?? imageFallback(overrides.categorySlug ?? item.suggestedCategory ?? undefined);

  const article = await prisma.article.create({
    data: {
      title: item.rawTitle ?? overrides.title,
      titleAr: item.titleAr ?? overrides.title,
      slug: overrides.slug,
      content: item.rawContent,
      contentAr: item.contentAr ?? item.rawContent,
      excerpt: item.summaryAr ?? undefined,
      imageUrl,
      sourceUrl: item.sourceUrl,
      sourceName: item.sourceName ?? "",
      tags: item.tags ?? [],
      categoryId: overrides.categoryId,
      published: overrides.published,
      publishedAt: overrides.published ? new Date() : null,
      score: 0,
    },
    select: { id: true },
  });

  await prisma.articleQueue.update({
    where: { id },
    data: { status: "approved", approvedAt: new Date() },
  });

  return article.id;
}

/** Reject: mark rejected, content stays in queue for auditing. */
export async function rejectQueueItem(id: string) {
  await prisma.articleQueue.update({
    where: { id },
    data: { status: "rejected" },
  });
}
