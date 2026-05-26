import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";
import { SITE_URL } from "@/lib/seo";
import { TOOL_CATEGORIES } from "@/lib/tool-categories";

export const dynamic = "force-dynamic";

const staticPages: MetadataRoute.Sitemap = [
  { url: SITE_URL,                  lastModified: new Date(), changeFrequency: "hourly",  priority: 1.0 },
  { url: `${SITE_URL}/reviews`,    lastModified: new Date(), changeFrequency: "daily",   priority: 0.95 },
  { url: `${SITE_URL}/ai-tools`,   lastModified: new Date(), changeFrequency: "daily",   priority: 0.9 },
  { url: `${SITE_URL}/compare`,    lastModified: new Date(), changeFrequency: "weekly",  priority: 0.7 },
  { url: `${SITE_URL}/author/zayd`, lastModified: new Date(), changeFrequency: "daily",   priority: 0.8 },
  { url: `${SITE_URL}/author/lina`, lastModified: new Date(), changeFrequency: "daily",   priority: 0.8 },
  { url: `${SITE_URL}/about`,       lastModified: new Date(), changeFrequency: "monthly", priority: 0.4 },
  { url: `${SITE_URL}/contact`,     lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
  { url: `${SITE_URL}/privacy`,     lastModified: new Date(), changeFrequency: "yearly",  priority: 0.2 },
  { url: `${SITE_URL}/terms`,       lastModified: new Date(), changeFrequency: "yearly",  priority: 0.2 },
  { url: `${SITE_URL}/search`,      lastModified: new Date(), changeFrequency: "weekly",  priority: 0.5 },
  // /ai-tools/for/[usecase] — one page per tool category
  ...TOOL_CATEGORIES.map((c) => ({
    url: `${SITE_URL}/ai-tools/for/${c.value}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.75,
  })),
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    const [reviews, categories, aiTools, comparisons] = await Promise.all([
      prisma.review.findMany({
        where: { published: true },
        select: { slug: true, updatedAt: true },
        orderBy: { publishedAt: "desc" },
        take: 2000,
      }),
      prisma.category.findMany({
        select: {
          slug: true,
          updatedAt: true,
          _count: { select: { reviews: true } },
        },
      }),
      prisma.aITool.findMany({
        where: { published: true },
        select: { slug: true, updatedAt: true },
      }),
      prisma.comparison.findMany({
        where: { published: true },
        select: { slug: true, updatedAt: true },
      }),
    ]);

    return [
      ...staticPages,
      ...categories.filter((c) => c._count.reviews > 0).map((c) => ({
        url: `${SITE_URL}/category/${c.slug}`,
        lastModified: c.updatedAt,
        changeFrequency: "daily" as const,
        priority: 0.8,
      })),
      ...reviews.map((r) => ({
        url: `${SITE_URL}/reviews/${r.slug}`,
        lastModified: r.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.85,
      })),
      ...aiTools.map((t) => ({
        url: `${SITE_URL}/ai-tools/${t.slug}`,
        lastModified: t.updatedAt,
        changeFrequency: "monthly" as const,
        priority: 0.8,
      })),
      ...comparisons.map((comparison) => ({
        url: `${SITE_URL}/compare/${comparison.slug}`,
        lastModified: comparison.updatedAt,
        changeFrequency: "monthly" as const,
        priority: 0.7,
      })),
    ];
  } catch {
    return staticPages;
  }
}
