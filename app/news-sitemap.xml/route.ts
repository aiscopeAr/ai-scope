import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { SITE_URL, SITE_NAME } from "@/lib/seo";

export const dynamic = "force-dynamic";

// Google News sitemap spec: https://developers.google.com/search/docs/crawling-indexing/sitemaps/news-sitemap
// Only articles published in the last 48 hours qualify for Google News
export async function GET() {
  const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000);

  let articles: { slug: string; titleAr: string; sourceName: string; publishedAt: Date | null; tags: string[] }[] = [];

  try {
    articles = await prisma.article.findMany({
      where: {
        published: true,
        publishedAt: { gte: cutoff },
      },
      select: {
        slug: true,
        titleAr: true,
        sourceName: true,
        publishedAt: true,
        tags: true,
      },
      orderBy: { publishedAt: "desc" },
      take: 1000,
    });
  } catch {
    // Return empty valid sitemap on DB error
  }

  const items = articles
    .filter((a) => a.publishedAt !== null)
    .map((a) => {
      const pubDate = (a.publishedAt as Date).toISOString();
      const keywords = a.tags.slice(0, 10).join(", ");
      return `  <url>
    <loc>${SITE_URL}/news/${escapeXml(a.slug)}</loc>
    <news:news>
      <news:publication>
        <news:name>${escapeXml(SITE_NAME)}</news:name>
        <news:language>ar</news:language>
      </news:publication>
      <news:publication_date>${pubDate}</news:publication_date>
      <news:title>${escapeXml(a.titleAr)}</news:title>${keywords ? `\n      <news:keywords>${escapeXml(keywords)}</news:keywords>` : ""}
    </news:news>
  </url>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${items}
</urlset>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=1800, s-maxage=1800",
    },
  });
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
