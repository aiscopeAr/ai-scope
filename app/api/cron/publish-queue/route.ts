import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateArticleImage } from "@/lib/replicate";
import { generateAllCaptions } from "@/lib/social/generate";
import { pingGoogleNews, pingGoogleSitemap } from "@/lib/ping";
import type { SocialPlatform } from "@/lib/social";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const DAILY_PUBLISH_LIMIT = 5;

function verifyCronSecret(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check daily budget
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const publishedToday = await prisma.article.count({
    where: { published: true, publishedAt: { gte: startOfDay } },
  });

  if (publishedToday >= DAILY_PUBLISH_LIMIT) {
    return NextResponse.json({ ok: true, message: "Daily limit reached", publishedToday });
  }

  // Pick ONE processed item ready to publish
  const item = await prisma.articleQueue.findFirst({
    where: { status: "processed", titleAr: { not: null } },
    orderBy: { processedAt: "asc" },
  });

  if (!item) {
    return NextResponse.json({ ok: true, message: "No processed items ready to publish", publishedToday });
  }

  try {
    const suggestedSlug = item.suggestedCategory ?? "ai-models";
    const category =
      (await prisma.category.findFirst({ where: { slug: suggestedSlug } })) ??
      (await prisma.category.findFirst());

    if (!category) {
      return NextResponse.json({ ok: false, error: "No category found" });
    }

    const slug = item.slug ?? item.id;
    const existing = await prisma.article.findUnique({ where: { slug } });
    const finalSlug = existing ? `${slug}-${Date.now()}` : slug;

    // Generate Replicate image → upload to Cloudinary (~25s)
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
        imageAlt: item.imageAlt ?? item.titleAr ?? undefined,
        sourceUrl: item.sourceUrl,
        sourceName: item.sourceName ?? "",
        tags: item.tags ?? [],
        keywords: item.keywords ?? [],
        faq: item.faq ?? undefined,
        relatedTopics: item.relatedTopics ?? [],
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

    // Queue social posts
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
        const article = await prisma.article.findUnique({ where: { slug: finalSlug }, select: { id: true } });
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
      console.error("[publish-queue] Social failed:", socialErr instanceof Error ? socialErr.message : socialErr);
    }

    // Fire-and-forget — don't await, don't let failures block the response
    void Promise.all([pingGoogleNews(), pingGoogleSitemap()]);

    return NextResponse.json({
      ok: true,
      published: finalSlug,
      imageUrl,
      publishedToday: publishedToday + 1,
    });
  } catch (err) {
    console.error("[publish-queue] Failed:", err instanceof Error ? err.message : err);
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : String(err) });
  }
}
