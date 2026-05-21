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

  const [
    articles,
    tools,
    trendingKeywords,
    categoryStats,
  ] = await Promise.all([
    prisma.article.findMany({
      where: { published: true },
      select: {
        id: true,
        titleAr: true,
        slug: true,
        keywords: true,
        tags: true,
        imageAlt: true,
        viewCount: true,
        publishedAt: true,
        category: { select: { nameAr: true, slug: true } },
      },
      orderBy: { viewCount: "desc" },
      take: 200,
    }),

    prisma.aITool.findMany({
      where: { published: true },
      select: {
        id: true,
        name: true,
        slug: true,
        seoTitle: true,
        seoDescription: true,
        imageAlt: true,
        tags: true,
        relatedTopics: true,
        viewCount: true,
        toolCategory: true,
      },
      orderBy: { viewCount: "desc" },
      take: 100,
    }),

    prisma.trendingKeyword.findMany({
      orderBy: { count: "desc" },
      take: 50,
    }),

    prisma.category.findMany({
      select: {
        nameAr: true,
        slug: true,
        _count: { select: { articles: { where: { published: true } } } },
      },
    }),
  ]);

  // Articles missing SEO fields (Article model has no seoTitle/seoDescription)
  const articlesMissingSeo = articles.filter(
    (a) => !a.imageAlt || a.keywords.length === 0,
  );

  // Tools missing SEO fields
  const toolsMissingSeo = tools.filter(
    (t) => !t.seoTitle || !t.seoDescription || !t.imageAlt,
  );

  // Keyword coverage: trending keywords with no matching article/tool
  const allKeywords = new Set([
    ...articles.flatMap((a) => [...a.keywords, ...a.tags]),
    ...tools.flatMap((t) => t.tags),
  ].map((k) => k.toLowerCase()));

  const uncoveredKeywords = trendingKeywords.filter(
    (tk) => !allKeywords.has(tk.keyword.toLowerCase()),
  );

  // Top keywords across articles (frequency map)
  const keywordFreq: Record<string, number> = {};
  for (const a of articles) {
    for (const k of [...a.keywords, ...a.tags]) {
      keywordFreq[k] = (keywordFreq[k] ?? 0) + 1;
    }
  }
  const topKeywords = Object.entries(keywordFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([keyword, count]) => ({ keyword, count }));

  // Category coverage score: articles per category
  const categoryCoverage = categoryStats.map((c) => ({
    nameAr: c.nameAr,
    slug: c.slug,
    articleCount: c._count.articles,
  }));

  // SEO score summary (0-100)
  const totalArticles = articles.length;
  const totalTools = tools.length;
  const articleSeoScore = totalArticles === 0 ? 100 :
    Math.round(((totalArticles - articlesMissingSeo.length) / totalArticles) * 100);

  const toolSeoScore = totalTools === 0 ? 100 :
    Math.round(((totalTools - toolsMissingSeo.length) / totalTools) * 100);
  const overallScore = Math.round((articleSeoScore + toolSeoScore) / 2);

  return NextResponse.json({
    summary: {
      overallScore,
      articleSeoScore,
      toolSeoScore,
      totalArticles,
      totalTools,
      articlesMissingSeoCount: articlesMissingSeo.length,
      toolsMissingSeoCount: toolsMissingSeo.length,
      uncoveredKeywordsCount: uncoveredKeywords.length,
    },
    articlesMissingSeo: articlesMissingSeo.slice(0, 30).map((a) => ({
      id: a.id,
      titleAr: a.titleAr,
      slug: a.slug,
      viewCount: a.viewCount,
      category: a.category.nameAr,
      missing: [
        ...(!a.imageAlt ? ["imageAlt"] : []),
        ...(a.keywords.length === 0 ? ["keywords"] : []),
      ],
    })),
    toolsMissingSeo: toolsMissingSeo.slice(0, 20).map((t) => ({
      id: t.id,
      name: t.name,
      slug: t.slug,
      viewCount: t.viewCount,
      toolCategory: t.toolCategory,
      missing: [
        ...(!t.seoTitle ? ["seoTitle"] : []),
        ...(!t.seoDescription ? ["seoDescription"] : []),
        ...(!t.imageAlt ? ["imageAlt"] : []),
      ],
    })),
    topKeywords,
    uncoveredKeywords: uncoveredKeywords.slice(0, 20).map((tk) => ({
      keyword: tk.keyword,
      count: tk.count,
      type: tk.type,
    })),
    categoryCoverage,
  });
}
