import type { Metadata } from "next";
import NewsCard from "@/components/NewsCard";
import { prisma } from "@/lib/db";
import { mockArticles } from "@/lib/mock-data";
import { SITE_URL, SITE_NAME, SITE_NAME_AR, SITE_DESCRIPTION_AR } from "@/lib/seo";

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

      {/* Hero */}
      <section className="relative overflow-hidden py-20 text-center" dir="rtl">
        <div className="absolute inset-0 bg-gradient-to-b from-violet-950/20 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-px w-3/4 bg-gradient-to-r from-transparent via-violet-500/30 to-transparent" />
        <div className="container mx-auto px-4 relative">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/5 px-4 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-medium text-slate-400">يتم التحديث يومياً</span>
          </div>
          <h1 className="mb-4 text-5xl font-black leading-tight md:text-6xl">
            <span className="text-white">آخر أخبار</span>
            <br />
            <span className="text-gradient">الذكاء الاصطناعي</span>
          </h1>
          <p className="mx-auto max-w-xl text-lg text-slate-500">
            تغطية شاملة لأحدث التطورات في عالم AI — بالعربية
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 pb-16" dir="rtl">
        {/* Featured */}
        {news[0] && (
          <div className="mb-10">
            <NewsCard article={news[0]} featured />
          </div>
        )}

        {/* Grid */}
        {news.length > 1 && (
          <>
            <div className="mb-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-white/5" />
              <span className="text-xs font-semibold uppercase tracking-widest text-slate-600">أحدث الأخبار</span>
              <div className="h-px flex-1 bg-white/5" />
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {news.slice(1).map((article) => (
                <NewsCard key={article.slug} article={article} />
              ))}
            </div>
          </>
        )}

        {news.length === 0 && (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-500/10 border border-violet-500/20">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgb(167,139,250)" strokeWidth="1.5">
                <circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3"/>
              </svg>
            </div>
            <p className="text-lg font-semibold text-slate-400">لا توجد أخبار بعد</p>
            <p className="mt-1 text-sm text-slate-600">سيتم نشر المحتوى قريباً</p>
          </div>
        )}
      </div>
    </>
  );
}
