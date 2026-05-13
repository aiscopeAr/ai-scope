import { prisma } from "@/lib/db";
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION_AR } from "@/lib/seo";

export const dynamic = "force-dynamic";

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const articles = await prisma.article.findMany({
    where: { published: true },
    orderBy: { publishedAt: "desc" },
    take: 50,
    include: { category: true },
  });

  const items = articles
    .map((article) => {
      const url = `${SITE_URL}/news/${article.slug}`;
      const pubDate = article.publishedAt
        ? new Date(article.publishedAt).toUTCString()
        : new Date(article.createdAt).toUTCString();
      const description = article.excerpt
        ? escapeXml(article.excerpt)
        : escapeXml(article.contentAr.slice(0, 300));

      return `    <item>
      <title>${escapeXml(article.titleAr)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <description>${description}</description>
      <category>${escapeXml(article.category.nameAr)}</category>
      <source url="${escapeXml(article.sourceUrl)}">${escapeXml(article.sourceName)}</source>
      <pubDate>${pubDate}</pubDate>
      ${article.imageUrl ? `<enclosure url="${escapeXml(article.imageUrl)}" type="image/jpeg" length="0"/>` : ""}
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:atom="http://www.w3.org/2005/Atom"
  xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>${escapeXml(SITE_NAME)} — أخبار الذكاء الاصطناعي بالعربية</title>
    <link>${SITE_URL}</link>
    <description>${escapeXml(SITE_DESCRIPTION_AR)}</description>
    <language>ar</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml"/>
    <ttl>60</ttl>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
