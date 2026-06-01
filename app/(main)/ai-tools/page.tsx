import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { absoluteUrl, SITE_NAME_AR } from "@/lib/seo";
import { TOOL_CATEGORIES } from "@/lib/tool-categories";
import AdSlot from "@/components/AdSlot";
import ToolCard from "@/components/ToolCard";
import ToolsDirectory from "@/components/ToolsDirectory";
import ToolCategoryGrid from "@/components/ToolCategoryGrid";

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

  const editorPicks = allTools.filter(t => t.editorPick).slice(0, 5);
  const trending    = [...allTools].sort((a, b) => b.viewCount - a.viewCount).slice(0, 5);
  const newest      = [...allTools].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 5);

  type ToolItem = (typeof allTools)[number];
  const byCategory: Record<string, ToolItem[]> = {};
  for (const t of allTools) {
    const cat = t.toolCategory || "other";
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(t);
  }

  return { allTools, totalCount, editorPicks, trending, newest, byCategory };
}

export default async function AIToolsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; cat?: string; pricing?: string }>;
}) {
  const sp = await searchParams;
  const { allTools, totalCount, editorPicks, trending, newest, byCategory } = await getData();

  const categoryCounts = TOOL_CATEGORIES.map(cat => ({
    ...cat,
    count: byCategory[cat.value]?.length ?? 0,
  })).filter(c => c.count > 0);

  const topCats = [...categoryCounts].sort((a, b) => b.count - a.count).slice(0, 10);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareListJsonLd) }} />

      <main className="min-h-screen" dir="rtl">

        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden border-b py-14" style={{ borderColor: "var(--border-subtle)" }}>
          {/* Decorative blobs — pure CSS, no JS */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
            <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full opacity-[0.06]"
              style={{ background: "radial-gradient(circle, #6366f1, transparent)" }} />
            <div className="absolute -bottom-16 -left-16 h-60 w-60 rounded-full opacity-[0.04]"
              style={{ background: "radial-gradient(circle, #8b5cf6, transparent)" }} />
          </div>

          <div className="container relative mx-auto px-4">
            <div className="mx-auto max-w-2xl text-center">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-semibold"
                style={{ borderColor: "var(--accent)", backgroundColor: "var(--accent-bg)", color: "var(--accent)" }}>
                <span className="h-1.5 w-1.5 animate-pulse rounded-full" style={{ backgroundColor: "var(--accent)" }} />
                {totalCount.toLocaleString("ar-EG")} أداة ذكاء اصطناعي
              </div>

              <h1 className="mb-4 text-4xl font-bold leading-tight md:text-5xl"
                style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
                دليل أدوات<br />
                <span style={{ color: "var(--accent)" }}>الذكاء الاصطناعي</span>
              </h1>
              <p className="mb-8 text-lg leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                اكتشف وقارن أفضل أدوات AI — مراجعات مفصّلة بالعربية مع الأسعار والمميزات
              </p>

              {/* Category pills — pure links, no JS handlers */}
              <div className="flex flex-wrap justify-center gap-2">
                {topCats.map(cat => (
                  <Link
                    key={cat.value}
                    href={`/ai-tools?cat=${cat.value}`}
                    className="flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-opacity hover:opacity-75"
                    style={{ borderColor: "var(--border-medium)", color: "var(--text-secondary)", backgroundColor: "var(--bg-surface)" }}
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.labelAr}</span>
                    <span className="rounded-full px-1.5 text-[10px]"
                      style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-muted)" }}>
                      {cat.count}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        <div className="container mx-auto max-w-5xl px-4 py-10">
          <AdSlot position="ai-tools-top" className="mb-10" />

          {/* ── Editor Picks ──────────────────────────────────────────── */}
          {editorPicks.length > 0 && (
            <section className="mb-12">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">⭐</span>
                  <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
                    اختيارات المحررين
                  </h2>
                </div>
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>أفضل أدوات اختارها فريق لوميك</span>
              </div>
              <div className="overflow-hidden rounded-[12px] border divide-y" style={{ borderColor: "var(--border-subtle)" }}>
                {editorPicks.map(t => (
                  <ToolCard key={t.id} tool={t} />
                ))}
              </div>
            </section>
          )}

          {/* ── Trending + Newest ─────────────────────────────────────── */}
          <div className="mb-12 grid gap-6 md:grid-cols-2">
            {trending.length > 0 && (
              <section>
                <div className="mb-4 flex items-center gap-2">
                  <span className="text-lg">🔥</span>
                  <h2 className="text-base font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>الأكثر مشاهدة</h2>
                </div>
                <div className="overflow-hidden rounded-[12px] border divide-y" style={{ borderColor: "var(--border-subtle)" }}>
                  {trending.map((t, i) => (
                    <Link key={t.id} href={`/ai-tools/${t.slug}`}
                      className="flex items-center gap-3 p-3.5 transition-opacity hover:opacity-75"
                      style={{ backgroundColor: "var(--bg-surface)" }}>
                      <span className="w-5 shrink-0 text-center text-sm font-black"
                        style={{ color: i < 3 ? "var(--accent)" : "var(--text-muted)" }}>
                        {i + 1}
                      </span>
                      <div className="h-9 w-9 shrink-0 overflow-hidden rounded-[6px] border flex items-center justify-center"
                        style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-subtle)" }}>
                        {t.logoUrl
                          ? <img src={t.logoUrl} alt={t.name} width={32} height={32} className="h-7 w-7 object-contain" />
                          : <span className="text-sm font-black" style={{ color: "var(--accent)" }}>{t.name[0]}</span>
                        }
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{t.name}</p>
                        <p className="truncate text-xs" style={{ color: "var(--text-muted)" }}>{t.tagline ?? t.descriptionAr.slice(0, 40)}</p>
                      </div>
                      <span className="shrink-0 text-xs" style={{ color: "var(--text-muted)" }}>👁 {t.viewCount}</span>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {newest.length > 0 && (
              <section>
                <div className="mb-4 flex items-center gap-2">
                  <span className="text-lg">🆕</span>
                  <h2 className="text-base font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>أحدث الأدوات</h2>
                </div>
                <div className="overflow-hidden rounded-[12px] border divide-y" style={{ borderColor: "var(--border-subtle)" }}>
                  {newest.map(t => (
                    <Link key={t.id} href={`/ai-tools/${t.slug}`}
                      className="flex items-center gap-3 p-3.5 transition-opacity hover:opacity-75"
                      style={{ backgroundColor: "var(--bg-surface)" }}>
                      <div className="h-9 w-9 shrink-0 overflow-hidden rounded-[6px] border flex items-center justify-center"
                        style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-subtle)" }}>
                        {t.logoUrl
                          ? <img src={t.logoUrl} alt={t.name} width={32} height={32} className="h-7 w-7 object-contain" />
                          : <span className="text-sm font-black" style={{ color: "var(--accent)" }}>{t.name[0]}</span>
                        }
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{t.name}</p>
                        <p className="truncate text-xs" style={{ color: "var(--text-muted)" }}>{t.tagline ?? t.descriptionAr.slice(0, 40)}</p>
                      </div>
                      <span className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                        style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-muted)" }}>جديد</span>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* ── Category Grid (client component for hover) ─────────────── */}
          <section className="mb-12">
            <div className="mb-4 flex items-center gap-2">
              <span className="text-lg">📁</span>
              <h2 className="text-base font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
                تصفح حسب التصنيف
              </h2>
            </div>
            <ToolCategoryGrid categories={categoryCounts} byCategory={byCategory} />
          </section>

          <AdSlot position="ai-tools-mid" className="mb-12" />

          {/* ── All tools directory ───────────────────────────────────── */}
          <section>
            <div className="mb-4 flex items-center gap-2">
              <span className="text-lg">🔍</span>
              <h2 className="text-base font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
                جميع الأدوات
              </h2>
            </div>
            <ToolsDirectory
              allTools={allTools}
              categories={categoryCounts}
              initialQ={sp.q ?? ""}
              initialCat={sp.cat ?? ""}
              initialPricing={sp.pricing ?? ""}
            />
          </section>

          {/* ── SEO links ─────────────────────────────────────────────── */}
          <section className="mt-14 rounded-[12px] border p-6" style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-subtle)" }}>
            <h2 className="mb-4 text-sm font-bold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
              أدوات AI لكل احتياج
            </h2>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { href: "/ai-tools/for/students",  label: "للطلاب",           icon: "🎓" },
                { href: "/ai-tools/for/coding",    label: "للبرمجة",          icon: "💻" },
                { href: "/ai-tools/for/writing",   label: "للكتابة",          icon: "✍️" },
                { href: "/ai-tools/for/marketing", label: "للتسويق",          icon: "📢" },
                { href: "/ai-tools/for/image",     label: "لتوليد الصور",     icon: "🎨" },
                { href: "/ai-tools/for/video",     label: "للفيديو",          icon: "🎬" },
                { href: "/ai-tools/for/no-code",   label: "بدون برمجة",       icon: "🔧" },
                { href: "/ai-tools/for/startups",  label: "للشركات الناشئة", icon: "🚀" },
              ].map(item => (
                <Link key={item.href} href={item.href}
                  className="flex items-center gap-2 rounded-[8px] border px-3 py-2.5 text-sm font-medium transition-opacity hover:opacity-75"
                  style={{ borderColor: "var(--border-medium)", color: "var(--text-secondary)", backgroundColor: "var(--bg-surface)" }}>
                  <span>{item.icon}</span>
                  <span>أفضل أدوات AI {item.label}</span>
                </Link>
              ))}
            </div>
          </section>

        </div>
      </main>
    </>
  );
}
