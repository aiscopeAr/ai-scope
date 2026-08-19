/**
 * Auto-publish approved ReviewQueue items.
 * Only runs if autoPublish is enabled. Max 3/day to keep quality high.
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { approveReview, markReviewFailed } from "@/lib/review-queue";
import { generateReviewImage } from "@/lib/images";
import { getSetting, SETTING_KEYS } from "@/lib/settings";
import { categorySlugCandidatesForAuthor } from "@/lib/authors";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

function verifyCronSecret(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dailyPublishLimit = await getSetting(SETTING_KEYS.DAILY_PUBLISH_LIMIT);

  // Count how many reviews published today
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const publishedToday = await prisma.review.count({
    where: { published: true, publishedAt: { gte: todayStart } },
  });

  if (publishedToday >= dailyPublishLimit) {
    return NextResponse.json({
      ok: true,
      message: `Daily limit reached (${publishedToday}/${dailyPublishLimit})`,
    });
  }

  const remaining = dailyPublishLimit - publishedToday;

  // Pick processed items that have a slug (required for auto-publish)
  // "processed" = written by AI, awaiting auto-publish
  // Note: "approved" means admin already manually published them via the queue page
  const items = await prisma.reviewQueue.findMany({
    where: { status: "processed", slug: { not: null } },
    orderBy: { processedAt: "asc" },
    take: remaining,
    include: {
      newsItems: { select: { id: true } },
    },
  });

  if (items.length === 0) {
    return NextResponse.json({ ok: true, message: "No processed reviews ready" });
  }

  // Fallback category if an item's author has no matching Category row
  const fallbackCategory = await prisma.category.findFirst({
    orderBy: { createdAt: "asc" },
  });
  if (!fallbackCategory) {
    return NextResponse.json({ ok: false, error: "No categories found — seed the DB first" });
  }

  const allCategories = await prisma.category.findMany({ select: { id: true, slug: true } });
  const categoryBySlug = new Map(allCategories.map((c) => [c.slug, c.id]));

  const published: string[] = [];
  for (const item of items) {
    try {
      // slug: { not: null } in the query above only excludes NULL — an
      // empty or whitespace-only string still passes that filter and would
      // otherwise reach approveReview() and become a Review with a blank
      // slug (proven to have happened once in production). Guard here,
      // before any side effect — image generation, Review creation,
      // Distribution/SocialPost/Telegram — can occur for this item.
      const normalizedSlug = item.slug?.trim();
      if (!normalizedSlug) {
        console.error(`[publish-review] Skipping queue item ${item.id}: blank/whitespace-only slug.`);
        await markReviewFailed(item.id, "Blank or whitespace-only slug — cannot auto-publish");
        continue;
      }

      // Generate image if missing
      let imageUrl = item.imageUrl ?? undefined;
      if (!imageUrl && item.featuredImagePrompt) {
        imageUrl = await generateReviewImage(item.featuredImagePrompt) ?? undefined;
        if (!imageUrl) {
          console.error(`[publish-review] Image generation returned null for queue item ${item.id}`);
        }
      }

      // Pick the category that matches this item's author/topic instead of always
      // falling back to the first category in the DB (was flattening all auto-published
      // reviews into one bucket regardless of actual subject).
      const candidateSlugs = categorySlugCandidatesForAuthor(item.authorSlug);
      const categoryId =
        candidateSlugs.map((slug) => categoryBySlug.get(slug)).find(Boolean) ?? fallbackCategory.id;

      const reviewId = await approveReview(item.id, {
        categoryId,
        slug: normalizedSlug,
        published: true,
        imageUrl,
      });
      published.push(reviewId);
    } catch (err) {
      console.error("[publish-review] Failed:", err);
    }
  }

  return NextResponse.json({ ok: true, published: published.length, ids: published });
}
