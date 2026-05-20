import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { absoluteUrl, SITE_NAME_AR } from "@/lib/seo";
import { TOOL_CATEGORIES } from "@/lib/tool-categories";
import AdSlot from "@/components/AdSlot";
import ToolCard from "@/components/ToolCard";
import ToolsDirectory from "@/components/ToolsDirectory";

export const revalidate = 300;

export const metadata: Metadata = {
  title: `أفضل أدوات الذكاء الاصطناعي 2025 — دليل شامل | ${SITE_NAME_AR}`,
  description: "دليل شامل لأكثر من 500 أداة ذكاء اصطناعي مع مراجعات عربية مفصّلة — الأسعار، المميزات، العيوب، ومقارنات بين الأدوات.",
  alternates: { canonical: absoluteUrl("/ai-tools") },
  openGraph: {
    title: `دليل أدوات الذكاء الاصطناعي | ${SITE_NAME_AR}`,
    description: "أفضل أدوات AI مع مراجعات ومقارنات بالعربية",
    locale: "ar_AR",
    type: "website",
    url: absoluteUrl("/ai-tools"),
  },
};

const softwareListJsonLd = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: `دليل أدوات الذكاء الاصطناعي | ${SITE_NAME_AR}`,
  description: "دليل شامل لأفضل أدوات الذكاء الاصطناعي بالعربية",
  url: absoluteUrl("/ai-tools"),
  inLanguage: "ar",
};

async function getData() {
  const [allTools, totalCount] = await Promise.all([
    prisma.aITool.findMany({
      where: { published: true },
      orderBy: [{ featuredAt: { sort: "desc", nulls: "last" } }, { viewCount: "desc" }],
      select: {
        id: true, slug: true, name: true, tagline: true, descriptionAr: true,
        logoUrl: true, toolCategory: true, pricing: true, monthlyPrice: true,
        arabicSupport: true, hasApi: true, tags: true, viewCount: true, likes: true,
        featured: true, editorPick: true, featuredAt: true, createdAt: true,
      },
    }).catch(() => []),
    prisma.aITool.count({ where: { published: true } }).catch(() => 0),
  ]);

  const featured = allTools.filter((t) => t.featured).slice(0, 6);
  const editorPicks = allTools.filter((t) => t.editorPick).slice(0, 6);
  const newest = [...allTools].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 6);
  const trending = [...allTools].sort((a, b) => b.viewCount - a.viewCount).slice(0, 6);

  const byCategory: Record<string, (typeof allTools)[number][]> = {};
  for (const t of allTools) {
    const cat = t.toolCategory || "other";
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(t);
  }

  return { allTools, totalCount, featured, editorPicks, newest, trending, byCategory };
}

export default async function AIToolsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; cat?: string; pricing?: string; tab?: string }>;
}) {
  const sp = await searchParams;
  const { allTools, totalCount, featured, editorPicks, newest, trending, byCategory } = await getData();

  const categoryCounts = TOOL_CATEGORIES.map((cat) => ({
    ...cat,
    count: byCategory[cat.value]?.length ?? 0,
  })).filter((c) => c.count > 0);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareListJsonLd) }} />

      <main className="min-h-screen" dir="rtl">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-white/5 py-16">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -top-20 left-1/4 h-96 w-96 rounded-full bg-fuchsia-600/10 blur-3xl animate-blob" />
            <div className="absolute top-10 right-1/3 h-64 w-64 rounded-full bg-violet-600/8 blur-3xl animate-blob" style={{ animationDelay: "2s" }} />
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-fuchsia-500/40 to-transparent" />
          </div>
          <div className="container mx-auto px-4 text-center relative animate-fade-up">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-fuchsia-500/30 bg-fuchsia-500/10 px-5 py-2">
              <span className="h-1.5 w-1.5 rounded-full bg-fuchsia-400 animate-pulse" />
              <span className="text-sm font-semibold text-fuchsia-300">{totalCount.toLocaleString("ar-EG")} أداة ذكاء اصطناعي</span>
            </div>
            <h1 className="mb-4 text-4xl font-black md:text-6xl">
              دليل <span className="text-gradient">أدوات الذكاء الاصطناعي</span>
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-slate-400">
              اكتشف وقارن أفضل أدوات AI — مراجعات مفصّلة بالعربية مع الأسعار والمميزات والعيوب
            </p>

            {/* Quick category pills */}
            <div className="mt-8 flex flex-wrap justify-center gap-2">
              {TOOL_CATEGORIES.slice(0, 8).map((cat) => (
                <Link
                  key={cat.value}
                  href={`/ai-tools?cat=${cat.value}`}
                  className="flex items-center gap-1.5 rounded-full border border-white/8 bg-white/4 px-3 py-1.5 text-xs text-slate-400 transition hover:border-violet-500/40 hover:text-white"
                >
                  <span>{cat.icon}</span>
                  <span>{cat.labelAr}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <div className="container mx-auto px-4 py-10">
          <AdSlot position="ai-tools-top" className="mb-10" />

          {/* Editor Picks */}
          {editorPicks.length > 0 && (
            <section className="mb-14">
              <div className="mb-6 flex items-center gap-3">
                <span className="text-xl">⭐</span>
                <h2 className="text-xl font-black text-white">اختيارات المحررين</h2>
                <div className="h-px flex-1 bg-white/5" />
                <Link href="/ai-tools?tab=editor" className="text-xs text-violet-400 hover:text-violet-300">عرض الكل</Link>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {editorPicks.map((t) => <ToolCard key={t.id} tool={t} />)}
              </div>
            </section>
          )}

          {/* Trending */}
          {trending.length > 0 && (
            <section className="mb-14">
              <div className="mb-6 flex items-center gap-3">
                <span className="text-xl">🔥</span>
                <h2 className="text-xl font-black text-white">الأكثر مشاهدة</h2>
                <div className="h-px flex-1 bg-white/5" />
                <Link href="/ai-tools?tab=trending" className="text-xs text-violet-400 hover:text-violet-300">عرض الكل</Link>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {trending.map((t) => <ToolCard key={t.id} tool={t} />)}
              </div>
            </section>
          )}

          {/* Newest */}
          {newest.length > 0 && (
            <section className="mb-14">
              <div className="mb-6 flex items-center gap-3">
                <span className="text-xl">🆕</span>
                <h2 className="text-xl font-black text-white">أحدث الأدوات</h2>
                <div className="h-px flex-1 bg-white/5" />
                <Link href="/ai-tools?tab=newest" className="text-xs text-violet-400 hover:text-violet-300">عرض الكل</Link>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {newest.map((t) => <ToolCard key={t.id} tool={t} />)}
              </div>
            </section>
          )}

          <AdSlot position="ai-tools-mid" className="mb-12" />

          {/* Main directory: search + filter + full grid */}
          <section>
            <div className="mb-6 flex items-center gap-3">
              <span className="text-xl">🔍</span>
              <h2 className="text-xl font-black text-white">جميع الأدوات</h2>
              <div className="h-px flex-1 bg-white/5" />
            </div>
            <ToolsDirectory
              allTools={allTools}
              categories={categoryCounts}
              initialQ={sp.q ?? ""}
              initialCat={sp.cat ?? ""}
              initialPricing={sp.pricing ?? ""}
            />
          </section>

          {/* Category deep-dive links */}
          <section className="mt-16">
            <div className="mb-6 flex items-center gap-3">
              <span className="text-xl">📁</span>
              <h2 className="text-xl font-black text-white">تصفح حسب التصنيف</h2>
              <div className="h-px flex-1 bg-white/5" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {TOOL_CATEGORIES.filter((c) => c.value !== "other").map((cat) => {
                const count = byCategory[cat.value]?.length ?? 0;
                return (
                  <Link
                    key={cat.value}
                    href={`/ai-tools/for/${cat.value}`}
                    className="group flex items-center gap-4 rounded-xl border border-white/6 bg-white/3 p-4 transition hover:border-violet-500/30 hover:bg-violet-500/5"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5 text-xl">{cat.icon}</span>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-200 group-hover:text-violet-300 transition-colors">{cat.labelAr}</p>
                      <p className="text-xs text-slate-500">{cat.descAr.slice(0, 45)}…</p>
                    </div>
                    <span className="mr-auto shrink-0 rounded-full bg-white/5 px-2 py-0.5 text-xs text-slate-500">{count}</span>
                  </Link>
                );
              })}
            </div>
          </section>

          {/* Programmatic SEO link blocks */}
          <section className="mt-16 rounded-2xl border border-white/6 bg-white/2 p-6">
            <h2 className="mb-5 text-lg font-black text-white">أدوات AI لكل احتياج</h2>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { href: "/ai-tools/for/students",   label: "أفضل أدوات AI للطلاب",     icon: "🎓" },
                { href: "/ai-tools/for/coding",     label: "أدوات AI للبرمجة",          icon: "💻" },
                { href: "/ai-tools/for/writing",    label: "أدوات AI للكتابة",           icon: "✍️" },
                { href: "/ai-tools/for/marketing",  label: "أدوات AI للتسويق",          icon: "📢" },
                { href: "/ai-tools/for/image",      label: "أدوات توليد الصور",          icon: "🎨" },
                { href: "/ai-tools/for/video",      label: "أدوات AI للفيديو",           icon: "🎬" },
                { href: "/ai-tools/for/no-code",    label: "أدوات بدون برمجة",           icon: "🔧" },
                { href: "/ai-tools/for/startups",   label: "أدوات AI للشركات الناشئة",  icon: "🚀" },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-2 rounded-xl border border-white/5 bg-white/3 px-3 py-2.5 text-sm text-slate-400 transition hover:bg-white/6 hover:text-white"
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
