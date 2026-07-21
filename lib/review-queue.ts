import { prisma } from "@/lib/db";
import type { ReviewDraft } from "@/lib/review-openai";
import type { AuthorSlug } from "@/lib/authors";
import { embedReview } from "@/lib/embeddings";
import { extractMemoryFromReview } from "@/lib/author-memory";
import { syndicateReviewToWordPress } from "@/lib/wordpress";

// ─── NewsItem queue ────────────────────────────────────────────────────────

export interface NewsItemInput {
  sourceUrl: string;
  title: string;
  content: string;
  publishedAt?: Date | null;
  sourceName: string;
  sourceId?: string;
  imageUrl?: string;
}

/** Enqueue a raw RSS item. Returns null if duplicate. */
export async function enqueueNewsItem(item: NewsItemInput): Promise<string | null> {
  const existing = await prisma.newsItem.findUnique({
    where: { sourceUrl: item.sourceUrl },
    select: { id: true },
  });
  if (existing) return null;

  const created = await prisma.newsItem.create({
    data: {
      sourceUrl: item.sourceUrl,
      title: item.title,
      content: item.content,
      publishedAt: item.publishedAt ?? null,
      sourceName: item.sourceName,
      sourceId: item.sourceId ?? null,
      imageUrl: item.imageUrl ?? null,
      status: "pending",
    },
    select: { id: true },
  });
  return created.id;
}

// ─── ReviewQueue state machine ────────────────────────────────────────────

/** Create a ReviewQueue cluster from a set of NewsItem ids. */
export async function createReviewCluster(
  topic: string,
  authorSlug: AuthorSlug,
  newsItemIds: string[],
): Promise<string> {
  const cluster = await prisma.reviewQueue.create({
    data: {
      topic,
      authorSlug,
      status: "pending",
      newsItems: { connect: newsItemIds.map((id) => ({ id })) },
    },
    select: { id: true },
  });

  // Mark news items as clustered
  await prisma.newsItem.updateMany({
    where: { id: { in: newsItemIds } },
    data: { status: "clustered", clusterId: cluster.id },
  });

  return cluster.id;
}

export async function markReviewProcessing(id: string) {
  await prisma.reviewQueue.update({
    where: { id },
    data: { status: "processing" },
  });
}

export async function markReviewProcessed(id: string, draft: ReviewDraft) {
  await prisma.reviewQueue.update({
    where: { id },
    data: {
      status: "processed",
      titleAr: draft.titleAr,
      summaryAr: draft.summaryAr,
      contentAr: draft.contentAr,
      tags: draft.tags,
      keywords: draft.keywords,
      faq: draft.faq.length > 0 ? draft.faq : undefined,
      imageAlt: draft.imageAlt,
      seoTitle: draft.seoTitle,
      seoDescription: draft.seoDescription,
      slug: draft.slug,
      featuredImagePrompt: draft.featuredImagePrompt,
      processedAt: new Date(),
      failureReason: null,
    },
  });
}

export async function markReviewFailed(id: string, reason: string) {
  await prisma.reviewQueue.update({
    where: { id },
    data: {
      status: "failed",
      failureReason: reason,
      retryCount: { increment: 1 },
    },
  });
}

export async function resetReviewForRetry(id: string) {
  await prisma.reviewQueue.update({
    where: { id },
    data: { status: "pending", failureReason: null },
  });
}

// ─── Approve: queue → Review ──────────────────────────────────────────────

export async function approveReview(
  queueId: string,
  overrides: {
    categoryId: string;
    slug: string;
    published: boolean;
    imageUrl?: string;
  },
): Promise<string> {
  const item = await prisma.reviewQueue.findUniqueOrThrow({
    where: { id: queueId },
    include: {
      newsItems: { select: { sourceUrl: true, sourceName: true, title: true } },
    },
  });

  const sources = item.newsItems.map((n) => ({
    title: n.title,
    url: n.sourceUrl,
    name: n.sourceName,
  }));

  const review = await prisma.review.create({
    data: {
      title: item.titleAr ?? item.topic,
      titleAr: item.titleAr ?? item.topic,
      slug: overrides.slug,
      summary: item.summaryAr ?? "",
      content: item.contentAr ?? "",
      authorSlug: item.authorSlug as AuthorSlug,
      categoryId: overrides.categoryId,
      tags: item.tags ?? [],
      keywords: (item as { keywords?: string[] }).keywords ?? [],
      faq: (item as { faq?: unknown }).faq ?? undefined,
      imageUrl: overrides.imageUrl ?? null,
      imageAlt: (item as { imageAlt?: string | null }).imageAlt ?? item.titleAr ?? undefined,
      seoTitle: (item as { seoTitle?: string | null }).seoTitle ?? undefined,
      seoDescription: (item as { seoDescription?: string | null }).seoDescription ?? undefined,
      sources: JSON.stringify(sources),
      published: overrides.published,
      publishedAt: overrides.published ? new Date() : null,
    },
    select: { id: true },
  });

  await prisma.reviewQueue.update({
    where: { id: queueId },
    data: { status: "approved", approvedAt: new Date() },
  });

  // Generate embedding + extract memory in background (non-blocking)
  if (overrides.published) {
    embedReview(review.id).catch(() => {
      // embedding is best-effort; doesn't block publish
    });

    // חלץ זיכרון מהכתבה החדשה — ישפר את הכתיבה הבאה
    extractMemoryFromReview(review.id).catch(() => {
      // memory extraction is best-effort
    });

    // Cross-post to partner WordPress site (no-op if not configured yet)
    syndicateReviewToWordPress(review.id).catch(() => {
      // syndication is best-effort; failures are recorded in SyndicationPost.status
    });

    // Auto-draft social posts
    try {
      const accounts = await prisma.socialAccount.findMany({ where: { enabled: true } });
      if (accounts.length > 0) {
        const articleUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://ai-news-ar.vercel.app"}/reviews/${overrides.slug}`;
        await prisma.socialPost.createMany({
          data: accounts.map((acc) => ({
            reviewId: review.id,
            accountId: acc.id,
            platform: acc.platform,
            caption: buildCaption(
              acc.platform,
              item.titleAr ?? item.topic,
              (item.summaryAr ?? "").slice(0, 200),
              articleUrl,
            ),
            status: "approved",  // auto-approve so the cron sends them immediately
          })),
        });
      }
    } catch {
      // social drafting is best-effort
    }
  }

  return review.id;
}

export async function rejectReview(id: string) {
  await prisma.reviewQueue.update({
    where: { id },
    data: { status: "rejected" },
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function buildCaption(platform: string, title: string, summary: string, url: string): string {
  if (platform === "twitter") {
    return `${title}\n\n${url}\n\n#ذكاء_اصطناعي #AI`.slice(0, 280);
  }
  if (platform === "telegram") {
    return `📰 *${title}*\n\n${summary}\n\n🔗 ${url}`;
  }
  return `${title}\n\n${summary}\n\n${url}\n\n#ذكاء_اصطناعي #AI #أخبار`;
}
