import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";
import { SITE_URL } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const revalidate = 3600;

// Programmatic SEO: use-case pages
const USE_CASE_SLUGS = ["students","developers","writers","designers","business","content","research","arabic"];
// Programmatic SEO: topic pages
const TOPIC_SLUGS = ["llm","image-generation","ai-education","generative-ai","ai-coding","openai","anthropic","ai-video"];

const staticPages: MetadataRoute.Sitemap = [
  { url: SITE_URL,                      lastModified: new Date(), changeFrequency: "hourly",  priority: 1.0 },
  { url: `${SITE_URL}/search`,          lastModified: new Date(), changeFrequency: "weekly",  priority: 0.6 },
  { url: `${SITE_URL}/guides`,          lastModified: new Date(), changeFrequency: "daily",   priority: 0.9 },
  { url: `${SITE_URL}/ai-tools`,        lastModified: new Date(), changeFrequency: "daily",   priority: 0.9 },
  { url: `${SITE_URL}/companies`,       lastModified: new Date(), changeFrequency: "weekly",  priority: 0.8 },
  { url: `${SITE_URL}/compare`,         lastModified: new Date(), changeFrequency: "weekly",  priority: 0.8 },
  { url: `${SITE_URL}/tools`,           lastModified: new Date(), changeFrequency: "daily",   priority: 0.7 },
  { url: `${SITE_URL}/about`,           lastModified: new Date(), changeFrequency: "monthly", priority: 0.4 },
  { url: `${SITE_URL}/contact`,         lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
  { url: `${SITE_URL}/privacy`,         lastModified: new Date(), changeFrequency: "yearly",  priority: 0.2 },
  { url: `${SITE_URL}/terms`,           lastModified: new Date(), changeFrequency: "yearly",  priority: 0.2 },
  // Use-case pages
  ...USE_CASE_SLUGS.map((s) => ({ url: `${SITE_URL}/ai-tools/for/${s}`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.85 })),
  // Topic pages
  ...TOPIC_SLUGS.map((s) => ({ url: `${SITE_URL}/topic/${s}`, lastModified: new Date(), changeFrequency: "daily" as const, priority: 0.85 })),
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    const [
      articles,
      categories,
      guides,
      aiTools,
      companies,
      comparisons,
    ] = await Promise.all([
      prisma.article.findMany({
        where: { published: true },
        select: { slug: true, updatedAt: true },
        orderBy: { publishedAt: "desc" },
        take: 2000,
      }),
      prisma.category.findMany({
        select: { slug: true, updatedAt: true },
      }),
      prisma.guide.findMany({
        where: { published: true },
        select: { slug: true, updatedAt: true },
      }),
      prisma.aITool.findMany({
        where: { published: true },
        select: { slug: true, updatedAt: true },
      }),
      prisma.company.findMany({
        where: { published: true },
        select: { slug: true, updatedAt: true },
      }),
      prisma.comparison.findMany({
        where: { published: true },
        select: { slug: true, updatedAt: true },
      }),
    ]);

    const categoryPages: MetadataRoute.Sitemap = categories.map((cat) => ({
      url: `${SITE_URL}/category/${cat.slug}`,
      lastModified: cat.updatedAt,
      changeFrequency: "daily",
      priority: 0.8,
    }));

    const articlePages: MetadataRoute.Sitemap = articles.map((art) => ({
      url: `${SITE_URL}/news/${art.slug}`,
      lastModified: art.updatedAt,
      changeFrequency: "weekly",
      priority: 0.7,
    }));

    const guidePages: MetadataRoute.Sitemap = guides.map((g) => ({
      url: `${SITE_URL}/guides/${g.slug}`,
      lastModified: g.updatedAt,
      changeFrequency: "monthly",
      priority: 0.85,
    }));

    const toolPages: MetadataRoute.Sitemap = aiTools.map((t) => ({
      url: `${SITE_URL}/ai-tools/${t.slug}`,
      lastModified: t.updatedAt,
      changeFrequency: "monthly",
      priority: 0.8,
    }));

    const companyPages: MetadataRoute.Sitemap = companies.map((c) => ({
      url: `${SITE_URL}/companies/${c.slug}`,
      lastModified: c.updatedAt,
      changeFrequency: "monthly",
      priority: 0.75,
    }));

    const comparePages: MetadataRoute.Sitemap = comparisons.map((c) => ({
      url: `${SITE_URL}/compare/${c.slug}`,
      lastModified: c.updatedAt,
      changeFrequency: "monthly",
      priority: 0.8,
    }));

    // Alternatives pages — one per AI tool
    const alternativePages: MetadataRoute.Sitemap = aiTools.map((t) => ({
      url: `${SITE_URL}/alternatives/${t.slug}`,
      lastModified: t.updatedAt,
      changeFrequency: "weekly",
      priority: 0.8,
    }));

    return [
      ...staticPages,
      ...categoryPages,
      ...articlePages,
      ...guidePages,
      ...toolPages,
      ...companyPages,
      ...comparePages,
      ...alternativePages,
    ];
  } catch {
    return staticPages;
  }
}
