import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { SITE_URL, SITE_NAME, SITE_NAME_AR, SITE_DESCRIPTION_AR } from "@/lib/seo";

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
  let reviews: {
    slug: string;
    titleAr: string;
    summary: string;
    publishedAt: Date | null;
    tags: string[];
    imageUrl: string | null;
    authorSlug: string;
    category: { nameAr: string };
  }[] = [];

  try {
    reviews = await prisma.review.findMany({
      where: { published: true },
      select: {
        slug: true,
        titleAr: true,
        summary: true,
        publishedAt: true,
        tags: true,
        imageUrl: true,
        authorSlug: true,
        category: { select: { nameAr: true } },
      },
      orderBy: { publishedAt: "desc" },
      take: 50,
    });
  } catch {
    // return empty feed on DB error
  }

  const buildDate = new Date().toUTCString();

  const items = reviews
    .filter((r) => r.publishedAt !== null)
    .map((r) => {
      const url = `${SITE_URL}/reviews/${r.slug}`;
      const pubDate = (r.publishedAt as Date).toUTCString();
      const description = escapeXml(r.summary.slice(0, 300));
      const image = r.imageUrl
        ? `<enclosure url="${escapeXml(r.imageUrl)}" type="image/jpeg" length="0"/>`
        : "";
      const categories = r.tags
        .slice(0, 5)
        .map((t) => `      <category>${escapeXml(t)}</category>`)
        .join("\n");

      return `    <item>
      <title>${escapeXml(r.titleAr)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <description>${description}</description>
      <pubDate>${pubDate}</pubDate>
      <dc:creator>${escapeXml(r.authorSlug)}</dc:creator>
      <category>${escapeXml(r.category.nameAr)}</category>
${categories}
      ${image}
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:atom="http://www.w3.org/2005/Atom"
  xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>${escapeXml(SITE_NAME)} — ${escapeXml(SITE_NAME_AR)}</title>
    <link>${SITE_URL}</link>
    <description>${escapeXml(SITE_DESCRIPTION_AR)}</description>
    <language>ar</language>
    <lastBuildDate>${buildDate}</lastBuildDate>
    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml"/>
    <image>
      <url>${SITE_URL}/og-default.png</url>
      <title>${escapeXml(SITE_NAME)}</title>
      <link>${SITE_URL}</link>
    </image>
${items}
  </channel>
</rss>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=1800, s-maxage=1800",
    },
  });
}
