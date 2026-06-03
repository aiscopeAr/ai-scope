import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function verifyCronSecret(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Yesterday midnight UTC
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

  // Check if already recorded
  const existing = await prisma.dailyStats.findUnique({ where: { date: yesterday } });
  if (existing) {
    return NextResponse.json({ ok: true, message: "Already recorded for yesterday" });
  }

  const [
    topArticle,
    topPrompt,
    articlesPublished,
    promptsGenerated,
    totalArticleViews,
    totalPromptViews,
  ] = await Promise.all([
    // Top article by views
    prisma.review.findFirst({
      where: { published: true },
      orderBy: { viewCount: "desc" },
      select: { slug: true, viewCount: true },
    }),
    // Top prompt by views
    prisma.prompt.findFirst({
      where: { published: true },
      orderBy: { viewCount: "desc" },
      select: { slug: true, viewCount: true },
    }),
    // Articles published yesterday
    prisma.review.count({
      where: { published: true, publishedAt: { gte: yesterday, lt: today } },
    }),
    // Prompts created yesterday
    prisma.prompt.count({
      where: { published: true, createdAt: { gte: yesterday, lt: today } },
    }),
    // Total article views (running total — diff from previous day later)
    prisma.review.aggregate({ _sum: { viewCount: true } }),
    // Total prompt views
    prisma.prompt.aggregate({ _sum: { viewCount: true } }),
  ]);

  // Calculate page views delta from previous day
  const prevDay = await prisma.dailyStats.findFirst({ orderBy: { date: "desc" } });
  const prevArticleViews = prevDay?.pageViews ?? 0;
  const currentTotal = totalArticleViews._sum.viewCount ?? 0;
  const pageViewsDelta = Math.max(0, currentTotal - prevArticleViews);

  await prisma.dailyStats.create({
    data: {
      date: yesterday,
      pageViews: pageViewsDelta > 0 ? pageViewsDelta : currentTotal,
      uniqueArticles: await prisma.review.count({ where: { published: true } }),
      promptsCopied: totalPromptViews._sum.viewCount ?? 0,
      toolClicks: 0,
      articlesPublished,
      promptsGenerated,
      topArticleSlug: topArticle?.slug ?? null,
      topArticleViews: topArticle?.viewCount ?? 0,
      topPromptSlug: topPrompt?.slug ?? null,
      topPromptViews: topPrompt?.viewCount ?? 0,
    },
  });

  return NextResponse.json({ ok: true, date: yesterday.toISOString(), articlesPublished, promptsGenerated });
}
