import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { buildReviewTelegramMessage } from "@/lib/social/telegram-message";
import { buildTrackedArticleUrl } from "@/lib/social/url";

/**
 * Admin preview endpoint — recomputes the Telegram message for a post's
 * underlying Review using the exact same buildReviewTelegramMessage() call
 * the production drafting/send path uses (lib/social/telegram-message.ts).
 * There is no separate formatting logic here: this route's only job is to
 * fetch the Review row and call the one shared formatter, so a preview can
 * never show something different from what actually gets sent. No Telegram
 * API call is made — this never contacts api.telegram.org.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const post = await prisma.socialPost.findUnique({
    where: { id },
    select: { id: true, platform: true, reviewId: true },
  });
  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  const review = await prisma.review.findUnique({
    where: { id: post.reviewId },
    select: {
      titleAr: true,
      summary: true,
      content: true,
      tags: true,
      slug: true,
      imageUrl: true,
      publishedAt: true,
      sources: true,
      category: { select: { slug: true, nameAr: true } },
    },
  });
  if (!review) {
    return NextResponse.json({ error: "Underlying review not found" }, { status: 404 });
  }

  const sources = (() => {
    try {
      const parsed = JSON.parse(review.sources as string) as Array<{ name?: string }>;
      return Array.isArray(parsed) ? parsed.filter((s) => typeof s.name === "string").map((s) => ({ name: s.name as string })) : [];
    } catch {
      return [];
    }
  })();

  if (post.platform !== "telegram") {
    return NextResponse.json({ error: "Preview is currently only implemented for the telegram platform" }, { status: 400 });
  }

  const message = buildReviewTelegramMessage({
    titleAr: review.titleAr,
    summary: review.summary,
    content: review.content,
    tags: review.tags,
    category: review.category,
    publishedAt: review.publishedAt,
    sources,
    slug: review.slug,
  });

  const articleUrl = buildTrackedArticleUrl(review.slug, "telegram");

  return NextResponse.json({
    template: message.template,
    templateLabel: message.templateLabel,
    caption: message.body,
    hashtags: message.hashtags,
    articleUrl,
    imageUrl: review.imageUrl ?? null,
  });
}
