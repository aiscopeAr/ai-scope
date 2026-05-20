import type { Metadata } from "next";
import Link from "next/link";
import NewsCard from "@/components/NewsCard";
import LiveFeed from "@/components/LiveFeed";
import ToolCard from "@/components/ToolCard";
import { prisma } from "@/lib/db";
import { mockArticles } from "@/lib/mock-data";
import { SITE_URL, SITE_NAME, SITE_NAME_AR, SITE_DESCRIPTION_AR } from "@/lib/seo";
import AdSlot from "@/components/AdSlot";

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

async function getHomeData() {
  try {
    const [latest, trending, mostRead, categories, totalArticles, featuredTools] = await Promise.all([
      prisma.article.findMany({
        where: { published: true },
        orderBy: { publishedAt: "desc" },
        take: 13,
        include: { category: true },
      }),
      // Trending = high viewCount published in last 7 days
      prisma.article.findMany({
        where: {
          published: true,
          publishedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
        orderBy: { viewCount: "desc" },
        take: 5,
        select: { id: true, slug: true, titleAr: true, viewCount: true, category: { select: { nameAr: true, slug: true } } },
      }),
      // Most read all-time
      prisma.article.findMany({
        where: { published: true, viewCount: { gt: 0 } },
        orderBy: { viewCount: "desc" },
        take: 6,
        select: { id: true, slug: true, titleAr: true, viewCount: true, publishedAt: true },
      }),
      prisma.category.findMany({ select: { id: true, slug: true, nameAr: true, _count: { select: { articles: { where: { published: true } } } } } }),
      prisma.article.count({ where: { published: true } }),
      prisma.aITool.findMany({
        where: { published: true },
        orderBy: [{ editorPick: "desc" }, { featured: "desc" }, { viewCount: "desc" }],
        take: 6,
        select: {
          id: true, slug: true, name: true, tagline: true, descriptionAr: true,
          logoUrl: true, toolCategory: true, pricing: true, monthlyPrice: true,
          arabicSupport: true, hasApi: true, tags: true, viewCount: true, likes: true,
          featured: true, editorPick: true,
        },
      }).catch(() => []),
    ]);
    return { latest, trending, mostRead, categories, totalArticles, featuredTools };
  } catch {
    return {
      latest: [...mockArticles],
      trending: [],
      mostRead: [],
      categories: [],
      totalArticles: 0,
      featuredTools: [],
    };
  }
}

export default async function HomePage() {
  const { latest, trending, mostRead, categories, totalArticles, featuredTools } = await getHomeData();

  const featured = latest[0];
  const grid = latest.slice(1, 7);
  const secondary = latest.slice(7, 13);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }} />

      {/* Hero */}
      <section className="relative overflow-hidden py-20 text-center" dir="rtl">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 left-1/4 h-96 w-96 rounded-full bg-violet-600/10 blur-3xl animate-blob" />
          <div className="absolute -top-12 right-1/4 h-80 w-80 rounded-full bg-blue-600/10 blur-3xl animate-blob" style={{ animationDelay: "3s" }} />
          <div className="absolute top-32 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-fuchsia-600/8 blur-3xl animate-blob" style={{ animationDelay: "6s" }} />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-b from-violet-950/25 via-transparent to-transparent" />
        </div>

        <div className="container mx-auto px-4 relative animate-fade-up">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-500/25 bg-violet-500/8 px-4 py-2 glass">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            <span className="text-xs font-semibold text-slate-300">
              {totalArticles > 0 ? `${totalArticles.toLocaleString("ar-EG")} خبر منشور` : "يتم التحديث يومياً"}
            </span>
          </div>

          <h1 className="mb-5 text-5xl font-black leading-tight md:text-6xl lg:text-7xl">
            <span className="text-white">آخر أخبار</span>
            <br />
            <span className="text-gradient">الذكاء الاصطناعي</span>
          </h1>
          <p className="mx-auto max-w-xl text-lg text-slate-400">
            تغطية شاملة لأحدث التطورات في عالم AI — بالعربية
          </p>

          <div className="mt-10 flex justify-center gap-6 flex-wrap">
            {[
              { label: "تحديث يومي", icon: "📡" },
              { label: "مترجم بالذكاء الاصطناعي", icon: "🤖" },
              { label: "مصادر عالمية", icon: "🌐" },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-2 rounded-full border border-white/8 bg-white/4 px-4 py-2 text-sm text-slate-400 glass">
                <span>{s.icon}</span>
                <span>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* LiveFeed renders category tabs + filtered grid client-side */}

      <AdSlot position="homepage-top" className="container mx-auto px-4 pt-4" />

      <div className="container mx-auto px-4 pb-16" dir="rtl">

        {/* Featured AI Tools strip */}
        {featuredTools.length > 0 && (
          <section className="mb-10 mt-6">
            <div className="flex items-center gap-3 mb-5">
              <span className="text-lg">🔧</span>
              <h2 className="font-black text-white">اكتشف أدوات الذكاء الاصطناعي</h2>
              <div className="h-px flex-1 bg-white/5" />
              <Link href="/ai-tools" className="text-xs text-violet-400 hover:text-violet-300 transition">عرض الكل ←</Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {featuredTools.map((t) => <ToolCard key={t.id} tool={t} />)}
            </div>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {[
                { href: "/ai-tools/for/writing",   label: "كتابة", icon: "✍️" },
                { href: "/ai-tools/for/coding",    label: "برمجة", icon: "💻" },
                { href: "/ai-tools/for/image",     label: "صور",   icon: "🎨" },
                { href: "/ai-tools/for/marketing", label: "تسويق", icon: "📢" },
                { href: "/ai-tools/for/students",  label: "طلاب",  icon: "🎓" },
                { href: "/ai-tools/for/no-code",   label: "بدون كود", icon: "🔧" },
              ].map((item) => (
                <Link key={item.href} href={item.href} className="flex items-center gap-1.5 rounded-full border border-white/8 bg-white/4 px-3 py-1.5 text-xs text-slate-400 transition hover:border-violet-500/30 hover:text-white">
                  <span>{item.icon}</span><span>{item.label}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Trending strip */}
        {trending.length > 0 && (
          <section className="mb-10 mt-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-lg">🔥</span>
              <h2 className="font-black text-white">الأكثر تداولاً هذا الأسبوع</h2>
              <div className="h-px flex-1 bg-white/5" />
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
              {trending.map((art, i) => (
                <Link
                  key={art.id}
                  href={`/news/${art.slug}`}
                  className="group flex shrink-0 items-start gap-3 rounded-xl border border-white/6 bg-white/3 p-4 hover:border-violet-500/30 hover:bg-violet-500/5 transition w-64"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-500/15 text-xs font-black text-violet-400">
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-violet-400 mb-1">{art.category.nameAr}</p>
                    <p className="text-sm font-bold text-slate-200 group-hover:text-violet-300 transition line-clamp-2 leading-snug">
                      {art.titleAr}
                    </p>
                    {art.viewCount > 0 && (
                      <p className="mt-1.5 text-xs text-slate-600">👁 {art.viewCount.toLocaleString("ar-EG")}</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Featured */}
        {featured && (
          <div className="mb-10 animate-fade-up" style={{ animationDelay: "0.1s" }}>
            <NewsCard article={featured} featured />
          </div>
        )}

        <AdSlot position="homepage-mid" className="mb-8" />

        {/* Main grid + sidebar */}
        {(grid.length > 0 || mostRead.length > 0) && (
          <div className="grid gap-10 lg:grid-cols-[1fr_300px]">

            {/* Article grid — LiveFeed handles tabs + filtering + live timestamps */}
            <div>
              <div className="mb-6 flex items-center gap-4">
                <div className="h-px flex-1 bg-white/5" />
                <div className="flex items-center gap-2 rounded-full border border-white/8 bg-white/3 px-4 py-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-pulse" />
                  <span className="text-xs font-semibold text-slate-500">أحدث الأخبار</span>
                </div>
                <div className="h-px flex-1 bg-white/5" />
              </div>
              <LiveFeed
                initialArticles={[...grid, ...secondary].map((a) => ({
                  ...a,
                  viewCount: (a as { viewCount?: number }).viewCount ?? 0,
                  publishedAt: a.publishedAt ? a.publishedAt.toISOString() : null,
                }))}
                categories={categories}
                featured={featured ? {
                  ...featured,
                  viewCount: (featured as { viewCount?: number }).viewCount ?? 0,
                  publishedAt: featured.publishedAt ? featured.publishedAt.toISOString() : null,
                } : null}
              />
            </div>

            {/* Sidebar */}
            <aside className="space-y-6">
              {/* Most read */}
              {mostRead.length > 0 && (
                <div className="rounded-2xl border border-white/6 bg-white/3 p-5">
                  <div className="mb-4 flex items-center gap-2">
                    <span className="text-base">📈</span>
                    <h3 className="font-black text-white text-sm">الأكثر قراءة</h3>
                  </div>
                  <ol className="space-y-3">
                    {mostRead.map((art, i) => (
                      <li key={art.id}>
                        <Link
                          href={`/news/${art.slug}`}
                          className="group flex items-start gap-3"
                        >
                          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet-500/15 text-[11px] font-black text-violet-400">
                            {i + 1}
                          </span>
                          <p className="text-sm text-slate-400 group-hover:text-violet-300 transition line-clamp-2 leading-snug">
                            {art.titleAr}
                          </p>
                        </Link>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Evergreen section links */}
              <div className="rounded-2xl border border-white/6 bg-white/3 p-5">
                <h3 className="mb-4 font-black text-white text-sm">استكشف المزيد</h3>
                <div className="space-y-2">
                  {[
                    { href: "/guides", icon: "📚", label: "أدلة ومقالات تعليمية" },
                    { href: "/ai-tools", icon: "🔧", label: "أدوات الذكاء الاصطناعي" },
                    { href: "/ai-tools/for/students", icon: "🎓", label: "أدوات AI للطلاب" },
                    { href: "/ai-tools/for/developers", icon: "💻", label: "أدوات AI للمطورين" },
                    { href: "/topic/llm", icon: "🧠", label: "نماذج اللغة الكبيرة" },
                    { href: "/companies", icon: "🏢", label: "شركات AI الكبرى" },
                    { href: "/compare", icon: "⚖️", label: "مقارنات الأدوات" },
                    { href: "/tools", icon: "✨", label: "مكتبة Prompts" },
                  ].map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-400 transition hover:bg-white/5 hover:text-white"
                    >
                      <span>{item.icon}</span>
                      <span>{item.label}</span>
                      <span className="mr-auto text-slate-600 text-xs">←</span>
                    </Link>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        )}

        {latest.length === 0 && (
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
