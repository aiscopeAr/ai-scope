import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";

export const revalidate = 3600;

const SITE_URL = "https://ai-scope-sigma.vercel.app";

const staticPages: MetadataRoute.Sitemap = [
  { url: SITE_URL,                    lastModified: new Date(), changeFrequency: "hourly",  priority: 1.0 },
  { url: `${SITE_URL}/search`,        lastModified: new Date(), changeFrequency: "weekly",  priority: 0.6 },
  { url: `${SITE_URL}/about`,         lastModified: new Date(), changeFrequency: "monthly", priority: 0.4 },
  { url: `${SITE_URL}/contact`,       lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
  { url: `${SITE_URL}/privacy`,       lastModified: new Date(), changeFrequency: "yearly",  priority: 0.2 },
  { url: `${SITE_URL}/terms`,         lastModified: new Date(), changeFrequency: "yearly",  priority: 0.2 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    const [articles, categories] = await Promise.all([
      prisma.article.findMany({
        where: { published: true },
        select: { slug: true, updatedAt: true },
        orderBy: { publishedAt: "desc" },
        take: 5000,
      }),
      prisma.category.findMany({
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

    return [...staticPages, ...categoryPages, ...articlePages];
  } catch {
    // DB unavailable — return static pages only so Google gets valid XML
    return staticPages;
  }
}
