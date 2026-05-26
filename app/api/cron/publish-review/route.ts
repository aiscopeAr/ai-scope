/**
 * Auto-publish approved ReviewQueue items.
 * Only runs if autoPublish is enabled. Max 3/day to keep quality high.
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { approveReview } from "@/lib/review-queue";
import { generateReviewImage } from "@/lib/images";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const DAILY_PUBLISH_LIMIT = 3;

function verifyCronSecret(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Count how many reviews published today
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const publishedToday = await prisma.review.count({
    where: { published: true, publishedAt: { gte: todayStart } },
  });

  if (publishedToday >= DAILY_PUBLISH_LIMIT) {
    return NextResponse.json({
      ok: true,
      message: `Daily limit reached (${publishedToday}/${DAILY_PUBLISH_LIMIT})`,
    });
  }

  const remaining = DAILY_PUBLISH_LIMIT - publishedToday;

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

  // Need a default category — get first available
  const defaultCategory = await prisma.category.findFirst({
    orderBy: { createdAt: "asc" },
  });
  if (!defaultCategory) {
    return NextResponse.json({ ok: false, error: "No categories found — seed the DB first" });
  }

  const published: string[] = [];
  for (const item of items) {
    try {
      // Generate image if missing
      let imageUrl = item.imageUrl ?? undefined;
      if (!imageUrl && item.featuredImagePrompt) {
        imageUrl = await generateReviewImage(item.featuredImagePrompt) ?? undefined;
        if (!imageUrl) {
          console.error(`[publish-review] Image generation returned null for queue item ${item.id}`);
        }
      }

      const reviewId = await approveReview(item.id, {
        categoryId: defaultCategory.id,
        slug: item.slug!,
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
