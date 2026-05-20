import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

async function requireAdmin() {
  const session = await auth();
  if (!session || session.user?.role !== "admin") return null;
  return session;
}

export async function GET() {
  if (!(await requireAdmin()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [
    totalViews,
    totalArticles,
    publishedArticles,
    articlesLast7d,
    articlesLast30d,
    topArticles,
    byCategory,
    bySource,
    recentByDay,
    queueStats,
  ] = await Promise.all([
    // Total views across all articles
    prisma.article.aggregate({ _sum: { viewCount: true } }),

    // Counts
    prisma.article.count(),
    prisma.article.count({ where: { published: true } }),
    prisma.article.count({ where: { published: true, publishedAt: { gte: sevenDaysAgo } } }),
    prisma.article.count({ where: { published: true, publishedAt: { gte: thirtyDaysAgo } } }),

    // Top 10 by views
    prisma.article.findMany({
      where: { published: true, viewCount: { gt: 0 } },
      orderBy: { viewCount: "desc" },
      take: 10,
      select: { id: true, titleAr: true, slug: true, viewCount: true, sourceName: true, publishedAt: true, category: { select: { nameAr: true } } },
    }),

    // Views + article count grouped by category
    prisma.category.findMany({
      select: {
        id: true,
        nameAr: true,
        slug: true,
        _count: { select: { articles: { where: { published: true } } } },
        articles: {
          where: { published: true },
          select: { viewCount: true },
        },
      },
    }),

    // Articles + views grouped by sourceName
    prisma.article.groupBy({
      by: ["sourceName"],
      where: { published: true },
      _count: { id: true },
      _sum: { viewCount: true },
      orderBy: { _sum: { viewCount: "desc" } },
      take: 15,
    }),

    // Published articles per day for last 30 days
    prisma.article.findMany({
      where: { published: true, publishedAt: { gte: thirtyDaysAgo } },
      select: { publishedAt: true, viewCount: true },
      orderBy: { publishedAt: "asc" },
    }),

    // Queue breakdown
    prisma.articleQueue.groupBy({
      by: ["status"],
      _count: { id: true },
    }),
  ]);

  // Group recentByDay into YYYY-MM-DD buckets
  const dayMap: Record<string, { articles: number; views: number }> = {};
  for (const a of recentByDay) {
    if (!a.publishedAt) continue;
    const day = a.publishedAt.toISOString().slice(0, 10);
    if (!dayMap[day]) dayMap[day] = { articles: 0, views: 0 };
    dayMap[day].articles += 1;
    dayMap[day].views += a.viewCount;
  }

  // Fill in every day in range
  const days: { date: string; articles: number; views: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().slice(0, 10);
    days.push({ date: key, ...(dayMap[key] ?? { articles: 0, views: 0 }) });
  }

  const categoryStats = byCategory
    .map((c) => ({
      id: c.id,
      nameAr: c.nameAr,
      slug: c.slug,
      articleCount: c._count.articles,
      totalViews: c.articles.reduce((s, a) => s + a.viewCount, 0),
    }))
    .sort((a, b) => b.totalViews - a.totalViews);

  const sourceStats = bySource.map((s) => ({
    sourceName: s.sourceName,
    articleCount: s._count.id,
    totalViews: s._sum.viewCount ?? 0,
  }));

  const queueBreakdown = Object.fromEntries(
    queueStats.map((q) => [q.status, q._count.id])
  );

  return NextResponse.json({
    summary: {
      totalViews: totalViews._sum.viewCount ?? 0,
      totalArticles,
      publishedArticles,
      articlesLast7d,
      articlesLast30d,
    },
    days,
    topArticles,
    categoryStats,
    sourceStats,
    queueBreakdown,
  });
}
