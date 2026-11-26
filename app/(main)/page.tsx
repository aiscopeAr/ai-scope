import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { unstable_cache } from "next/cache";
import ReviewCard from "@/components/ReviewCard";
import ToolCard from "@/components/ToolCard";
import ToolOfTheWeek from "@/components/ToolOfTheWeek";
import NewsletterInline from "@/components/NewsletterInline";
import AdSlot from "@/components/AdSlot";
import { prisma } from "@/lib/db";
import { SITE_URL, SITE_NAME, SITE_NAME_AR, SITE_DESCRIPTION_AR } from "@/lib/seo";
import { Scale, ArrowLeft, Sparkles } from "lucide-react";
import PromptCard from "@/components/PromptCard";

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

const getData = unstable_cache(
  async () => {
    try {
      const [guides, featuredTools, toolOfWeek, latestComparisons, featuredPrompts, latestNews] = await Promise.all([
        // Evergreen guides/articles (tutorials) — now the homepage stars.
        prisma.review.findMany({
          where: { published: true, category: { slug: "tutorials" } },
          orderBy: { publishedAt: "desc" },
          take: 9,
          include: { category: true },
        }),
        prisma.aITool.findMany({
          where: { published: true },
          orderBy: [{ featured: "desc" }, { viewCount: "desc" }],
          take: 6,
        }),
        prisma.aITool.findFirst({
          where: { published: true, editorPick: true },
          orderBy: { updatedAt: "desc" },
        }),
        prisma.comparison.findMany({
          where: { published: true },
          orderBy: { updatedAt: "desc" },
          take: 3,
          include: {
            sides: {
              include: { tool: { select: { name: true, logoUrl: true, slug: true } } },
            },
          },
        }),
        prisma.prompt.findMany({
          where: { published: true },
          orderBy: [{ featured: "desc" }, { viewCount: "desc" }],
          take: 6,
          select: {
            id: true, slug: true, titleAr: true, description: true,
            category: true, featured: true,
            tool: { select: { name: true, slug: true, logoUrl: true } },
          },
        }),
        // News/reports — reduced and moved lower down the page.
        prisma.review.findMany({
          where: { published: true, category: { slug: { not: "tutorials" } } },
          orderBy: { publishedAt: "desc" },
          take: 4,
          include: { category: true },
        }),
      ]);
      return { guides, featuredTools, toolOfWeek, latestComparisons, featuredPrompts, latestNews };
    } catch (error) {
      // A DB/connection failure must NOT be turned into a synthetic all-empty
      // homepage: unstable_cache would store that empty object as a valid value
      // and serve it to every visitor for the whole revalidate window (a
      // "poisoned cache"). Log and rethrow so nothing is cached and the next
      // request retries. Note: a query that SUCCEEDS but legitimately returns
      // zero rows still returns normally above and is cached — only an actual
      // thrown DB error reaches here.
      console.error("[homepage getData] database query failed — rethrowing so the empty result is not cached:", error);
      throw error;
    }
  },
  ["homepage-data"],
  { revalidate: 3600 },
);

export default async function HomePage() {
  await connection();
  const { guides, featuredTools, toolOfWeek, latestComparisons, featuredPrompts, latestNews } = await getData();
  const featuredGuide = guides[0];
  const restGuides = guides.slice(1);

  return (
    <main className="container mx-auto max-w-6xl px-4 py-10 md:px-6" dir="rtl">
      <h1
        className="mb-6 text-sm font-semibold tracking-wide sm:mb-8"
        style={{ color: "var(--text-muted)" }}
      >
        Lumiq — أخبار وأدوات الذكاء الاصطناعي بالعربية
      </h1>

      <AdSlot position="home-top" className="mb-8" />

      {/* ★ Guides & Articles — the homepage stars (evergreen rich content) */}
      {featuredGuide && (
        <section className="mb-14 md:mb-16">
          <div className="mb-7 flex items-center gap-3">
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
              style={{ backgroundColor: "var(--brand-bg)" }}
            >
              <Sparkles className="h-5 w-5" style={{ color: "var(--brand)" }} />
            </div>
            <div>
              <h2 className="text-2xl font-bold md:text-3xl" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
                مقالات وأدلة الذكاء الاصطناعي
              </h2>
              <p className="mt-0.5 text-sm" style={{ color: "var(--text-muted)" }}>
                شروحات ومقارنات غنية خطوة بخطوة — محتوى يبقى مفيداً دائماً
              </p>
            </div>
          </div>

          {/* Featured guide hero */}
          <div
            className="mb-8 rounded-[14px] border p-5 md:p-8"
            style={{ borderColor: "var(--border-subtle)", background: "var(--bg-surface)" }}
          >
            <ReviewCard review={featuredGuide} featured priority />
          </div>

          {/* Guides grid */}
          {restGuides.length > 0 && (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {restGuides.map((r) => (
                <ReviewCard key={r.id} review={r} />
              ))}
            </div>
          )}

          <div className="mt-7 flex justify-center">
            <Link
              href="/category/tutorials"
              className="inline-flex items-center gap-1.5 rounded-lg px-5 py-3 text-sm font-bold transition hover:opacity-80"
              style={{ backgroundColor: "var(--brand-bg)", color: "var(--brand)" }}
            >
              عرض كل المقالات والأدلة
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </div>
        </section>
      )}

      <AdSlot position="home-mid" className="mb-12" />

      {/* AI Tools */}
      {featuredTools.length > 0 && (
        <section className="mb-14 md:mb-16">
          <div className="mb-7 flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>أدوات الذكاء الاصطناعي</h2>
              <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>دليل لوميك المُحدَّث لأفضل أدوات AI</p>
            </div>
            <Link href="/ai-tools" className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold transition hover:opacity-75 min-h-[44px]" style={{ color: "var(--brand)" }}>
              عرض الكل ←
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featuredTools.map((tool) => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        </section>
      )}

      {/* Tool of the Week */}
      {toolOfWeek && (
        <section className="mb-14 md:mb-16">
          <ToolOfTheWeek tool={toolOfWeek} />
        </section>
      )}

      {/* Prompts Library */}
      {featuredPrompts.length > 0 && (
        <section className="mb-14 md:mb-16">
          <div className="mb-7 flex items-end justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" style={{ color: "var(--accent)" }} />
              <div>
                <h2 className="text-2xl font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
                  مكتبة البرومبتس
                </h2>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>جاهزة للنسخ والاستخدام — مجاناً</p>
              </div>
            </div>
            <Link href="/prompts" className="text-sm font-semibold transition hover:opacity-70" style={{ color: "var(--brand)" }}>
              عرض الكل ←
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featuredPrompts.map((p) => (
              <PromptCard key={p.id} prompt={p} />
            ))}
          </div>
        </section>
      )}

      {/* Comparisons strip */}
      {latestComparisons.length > 0 && (
        <section className="mb-14 md:mb-16">
          <div className="mb-7 flex items-end justify-between">
            <div className="flex items-center gap-2">
              <Scale className="h-5 w-5" style={{ color: "var(--accent)" }} />
              <h2 className="text-2xl font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
                مقارنات الأدوات
              </h2>
            </div>
            <Link href="/compare" className="flex items-center gap-1 text-sm font-semibold transition hover:opacity-70" style={{ color: "var(--brand)" }}>
              عرض الكل <ArrowLeft className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {latestComparisons.map((comp) => (
              <Link
                key={comp.id}
                href={`/compare/${comp.slug}`}
                className="group flex flex-col gap-3 rounded-[10px] border p-4 transition-all duration-200 hover:-translate-y-0.5"
                style={{ borderColor: "var(--border-subtle)", background: "var(--bg-surface)" }}
              >
                {/* Tools row */}
                <div className="flex items-center gap-2">
                  {comp.sides.map((side, i) => (
                    <div key={side.id} className="flex items-center gap-1.5">
                      {i > 0 && (
                        <span className="rounded px-1 py-0.5 text-[10px] font-black"
                          style={{ background: "var(--brand-bg)", color: "var(--brand)" }}>VS</span>
                      )}
                      {side.tool.logoUrl ? (
                        <img src={side.tool.logoUrl} alt={side.tool.name}
                          className="h-7 w-7 rounded-lg object-contain"
                          style={{ background: "#f8fafc", border: "1px solid #e2e8f0", padding: 3 }} />
                      ) : (
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold text-white"
                          style={{ background: "var(--brand)" }}>
                          {side.tool.name[0]}
                        </div>
                      )}
                      <span className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>
                        {side.tool.name}
                      </span>
                    </div>
                  ))}
                </div>
                {/* Title */}
                <p className="text-sm font-bold leading-snug group-hover:opacity-75 transition-opacity line-clamp-2"
                  style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
                  {comp.title}
                </p>
                <span className="mt-auto text-xs font-semibold" style={{ color: "var(--brand)" }}>
                  قرأ المقارنة ←
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Latest news — reduced and moved lower */}
      {latestNews.length > 0 && (
        <section className="mb-14 md:mb-16">
          <div className="mb-7 flex items-end justify-between">
            <h2 className="text-2xl font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>آخر الأخبار</h2>
            <Link href="/reviews" className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold transition hover:opacity-75 min-h-[44px]" style={{ color: "var(--brand)" }}>
              عرض الكل ←
            </Link>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {latestNews.map((r) => (
              <ReviewCard key={r.id} review={r} />
            ))}
          </div>
        </section>
      )}

      {/* Editorial team */}
      <section className="mb-14 md:mb-16">
        <h2 className="mb-7 text-center text-2xl font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>فريق التقارير</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { slug: "zayd",  name: "زيد",   title: "محلل نماذج الذكاء الاصطناعي",    accent: "#6366f1", desc: "يحلل النماذج الكبرى ويقارن قدراتها بعيناً نقدية — لا يصدق الضجيج التسويقي." },
            { slug: "lina",  name: "لينا",  title: "مراسلة شؤون الشركات والسياسات",   accent: "#ec4899", desc: "تقرأ بين سطور قرارات شركات AI وتربط الأحداث بالصورة الاقتصادية الأشمل." },
            { slug: "tariq", name: "طارق",  title: "محلل أدوات الذكاء الاصطناعي",     accent: "#f59e0b", desc: "يحلل أدوات AI الجديدة بأرقام حقيقية — ويكشف من يستحق وقتك فعلاً." },
          ].map((a) => (
            <Link
              key={a.slug}
              href={`/author/${a.slug}`}
              className="flex items-start gap-4 rounded-[10px] border p-5 transition-all duration-200 hover:-translate-y-0.5"
              style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-surface)" }}
            >
              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full" style={{ outline: `2px solid ${a.accent}40`, outlineOffset: "2px" }}>
                <img src={`/images/authors/${a.slug}.svg`} alt={a.name} className="h-full w-full object-cover" />
              </div>
              <div>
                <p className="font-bold" style={{ color: a.accent }}>{a.name}</p>
                <p className="text-xs" style={{ color: "var(--text-secondary)" }}>{a.title}</p>
                <p className="mt-1.5 text-xs leading-relaxed line-clamp-2" style={{ color: "var(--text-muted)" }}>{a.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Newsletter */}
      <NewsletterInline />

      <AdSlot position="home-bottom" className="mb-4" />
    </main>
  );
}
