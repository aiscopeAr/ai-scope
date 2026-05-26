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

  const SectionHeader = ({ emoji, title, href }: { emoji: string; title: string; href?: string }) => (
    <div className="mb-6 flex items-center gap-3">
      <span className="text-xl">{emoji}</span>
      <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>{title}</h2>
      <div className="h-px flex-1" style={{ backgroundColor: "var(--border-subtle)" }} />
      {href && (
        <Link href={href} className="text-xs hover-opacity transition" style={{ color: "var(--accent)" }}>
          عرض الكل
        </Link>
      )}
    </div>
  );

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareListJsonLd) }} />

      <main className="min-h-screen" dir="rtl">
        {/* Hero */}
        <section className="border-b py-16" style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-subtle)" }}>
          <div className="container mx-auto px-4 text-center">
            <div className="mb-5 inline-flex items-center gap-2 rounded-[3px] border px-5 py-2"
              style={{ borderColor: "var(--accent)", backgroundColor: "var(--accent-bg)", color: "var(--accent)" }}>
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: "var(--accent)" }} />
              <span className="text-sm font-semibold">{totalCount.toLocaleString("ar-EG")} أداة ذكاء اصطناعي</span>
            </div>
            <h1 className="mb-4 text-4xl font-bold md:text-5xl" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
              دليل أدوات الذكاء الاصطناعي
            </h1>
            <p className="mx-auto max-w-2xl text-lg" style={{ color: "var(--text-secondary)" }}>
              اكتشف وقارن أفضل أدوات AI — مراجعات مفصّلة بالعربية مع الأسعار والمميزات والعيوب
            </p>

            {/* Quick category pills */}
            <div className="mt-8 flex flex-wrap justify-center gap-2">
              {TOOL_CATEGORIES.slice(0, 8).map((cat) => (
                <Link
                  key={cat.value}
                  href={`/ai-tools?cat=${cat.value}`}
                  className="pill-hover "
                  style={{ borderColor: "var(--border-medium)", color: "var(--text-secondary)", backgroundColor: "var(--bg-surface)" }}
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
              <SectionHeader emoji="⭐" title="اختيارات المحررين" href="/ai-tools?tab=editor" />
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {editorPicks.map((t) => <ToolCard key={t.id} tool={t} />)}
              </div>
            </section>
          )}

          {/* Trending */}
          {trending.length > 0 && (
            <section className="mb-14">
              <SectionHeader emoji="🔥" title="الأكثر مشاهدة" href="/ai-tools?tab=trending" />
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {trending.map((t) => <ToolCard key={t.id} tool={t} />)}
              </div>
            </section>
          )}

          {/* Newest */}
          {newest.length > 0 && (
            <section className="mb-14">
              <SectionHeader emoji="🆕" title="أحدث الأدوات" href="/ai-tools?tab=newest" />
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {newest.map((t) => <ToolCard key={t.id} tool={t} />)}
              </div>
            </section>
          )}

          <AdSlot position="ai-tools-mid" className="mb-12" />

          {/* Main directory */}
          <section>
            <SectionHeader emoji="🔍" title="جميع الأدوات" />
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
            <SectionHeader emoji="📁" title="تصفح حسب التصنيف" />
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {TOOL_CATEGORIES.filter((c) => c.value !== "other").map((cat) => {
                const count = byCategory[cat.value]?.length ?? 0;
                return (
                  <Link
                    key={cat.value}
                    href={`/ai-tools/for/${cat.value}`}
                    className="card-hover "
                    style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-surface)" }}
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[6px] text-xl" style={{ backgroundColor: "var(--bg-subtle)" }}>{cat.icon}</span>
                    <div className="min-w-0">
                      <p className="font-semibold transition-colors group-hover:opacity-75" style={{ color: "var(--text-primary)" }}>{cat.labelAr}</p>
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>{cat.descAr.slice(0, 45)}…</p>
                    </div>
                    <span className="mr-auto shrink-0 rounded-[3px] px-2 py-0.5 text-xs" style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-muted)" }}>{count}</span>
                  </Link>
                );
              })}
            </div>
          </section>

          {/* Programmatic SEO link blocks */}
          <section className="mt-16 rounded-[6px] border p-6" style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-surface)" }}>
            <h2 className="mb-5 text-lg font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>أدوات AI لكل احتياج</h2>
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
                  className="pill-hover "
                  style={{ borderColor: "var(--border-subtle)", color: "var(--text-secondary)", backgroundColor: "var(--bg-subtle)" }}
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
