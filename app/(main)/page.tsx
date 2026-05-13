import type { Metadata } from "next";
import NewsCard from "@/components/NewsCard";
import { prisma } from "@/lib/db";
import { mockArticles } from "@/lib/mock-data";
import {
  SITE_URL,
  SITE_NAME,
  SITE_NAME_AR,
  SITE_DESCRIPTION_AR,
} from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `${SITE_NAME} — ${SITE_NAME_AR}`,
  description: SITE_DESCRIPTION_AR,
  alternates: { canonical: SITE_URL },
  openGraph: {
    url: SITE_URL,
    title: `${SITE_NAME} — ${SITE_NAME_AR}`,
    description: SITE_DESCRIPTION_AR,
    type: "website",
  },
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: `${SITE_NAME} — ${SITE_NAME_AR}`,
      description: SITE_DESCRIPTION_AR,
      inLanguage: "ar",
      potentialAction: {
        "@type": "SearchAction",
        target: { "@type": "EntryPoint", urlTemplate: `${SITE_URL}/search?q={search_term_string}` },
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: SITE_NAME,
      url: SITE_URL,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/icon.png`,
        width: 512,
        height: 512,
      },
      sameAs: [],
    },
  ],
};

async function getLatestNews() {
  try {
    return await prisma.article.findMany({
      where: { published: true },
      orderBy: { publishedAt: "desc" },
      take: 12,
      include: { category: true },
    });
  } catch {
    return [...mockArticles];
  }
}

export default async function HomePage() {
  const news = await getLatestNews();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />
      <div className="container mx-auto px-4 py-8" dir="rtl">
        <section className="mb-12 py-12 text-center">
          <h1 className="mb-4 text-5xl font-bold">
            آخر أخبار الذكاء الاصطناعي
            <br />
            <span className="text-gradient">بالعربية</span>
          </h1>
          <p className="mx-auto max-w-2xl text-xl text-gray-600">تغطية شاملة لأحدث التطورات في عالم AI</p>
        </section>

        {news[0] && (
          <div className="mb-12">
            <NewsCard article={news[0]} featured />
          </div>
        )}

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {news.slice(1).map((article) => (
            <NewsCard key={article.slug} article={article} />
          ))}
        </div>
      </div>
    </>
  );
}
