import type { Metadata } from "next";
import Link from "next/link";
import ReviewCard from "@/components/ReviewCard";
import ToolCard from "@/components/ToolCard";
import ToolOfTheWeek from "@/components/ToolOfTheWeek";
import NewsletterInline from "@/components/NewsletterInline";
import AdSlot from "@/components/AdSlot";
import { prisma } from "@/lib/db";
import { SITE_URL, SITE_NAME, SITE_NAME_AR, SITE_DESCRIPTION_AR } from "@/lib/seo";
import { ArrowLeft } from "lucide-react";

export const revalidate = 60;

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

async function getData() {
  try {
    const [featuredReview, latestReviews, featuredTools, toolOfWeek, latestComparisons, featuredPrompts, tutorialReviews] = await Promise.all([
      prisma.review.findFirst({
        where: { published: true, category: { slug: { not: "tutorials" } } },
        orderBy: { publishedAt: "desc" },
        include: { category: true },
      }),
      prisma.review.findMany({
        where: { published: true, category: { slug: { not: "tutorials" } } },
        orderBy: { publishedAt: "desc" },
        skip: 1,
        take: 8,
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
      prisma.review.findMany({
        where: { published: true, category: { slug: "tutorials" } },
        orderBy: { publishedAt: "desc" },
        take: 4,
        select: {
          id: true, slug: true, titleAr: true, summary: true,
          imageUrl: true, publishedAt: true, tags: true,
          category: { select: { nameAr: true, slug: true } },
        },
      }),
    ]);
    return { featuredReview, latestReviews, featuredTools, toolOfWeek, latestComparisons, featuredPrompts, tutorialReviews };
  } catch {
    return { featuredReview: null, latestReviews: [], featuredTools: [], toolOfWeek: null, latestComparisons: [], featuredPrompts: [], tutorialReviews: [] };
  }
}

export default async function HomePage() {
  // DIAGNOSTIC BASELINE MARKER — no-op, forces a fresh Preview build. Not merged to main.
  const { featuredReview, latestReviews, featuredTools, toolOfWeek, latestComparisons, featuredPrompts, tutorialReviews } = await getData();

  return (
    <main className="container mx-auto max-w-6xl px-4 py-10 md:px-6" dir="rtl">
      <h1
        className="mb-6 text-sm font-semibold tracking-wide sm:mb-8"
        style={{ color: "var(--text-muted)" }}
      >
        Lumiq — أخبار وأدوات الذكاء الاصطناعي بالعربية
      </h1>

      <AdSlot position="home-top" className="mb-8" />

      {/* Featured review */}
      {featuredReview && (
        <section className="mb-14 md:mb-16">
          <ReviewCard review={featuredReview} featured priority />
        </section>
      )}

      {/* Latest reviews grid */}
      {latestReviews.length > 0 && (
        <section className="mb-14 md:mb-16">
          <div className="mb-7 flex items-end justify-between">
            <h2 className="text-2xl font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>آخر التقارير</h2>
            <Link href="/reviews" className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold transition hover:opacity-75 min-h-[44px]" style={{ color: "var(--brand)" }}>
              عرض الكل ←
            </Link>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {latestReviews.map((r) => (
              <ReviewCard key={r.id} review={r} />
            ))}
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

      {/* DIAGNOSTIC VARIANT C — AI Guides + Prompts Library replaced with static deterministic placeholder. Not for merge. */}
      {(tutorialReviews.length > 0 || featuredPrompts.length > 0) && (
        <section className="mb-14 md:mb-16">
          <div className="mb-7 flex items-end justify-between">
            <h2 className="text-2xl font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>DIAGNOSTIC PLACEHOLDER</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="h-40 rounded-[10px]" style={{ backgroundColor: "var(--brand-bg)" }} />
            <div className="h-40 rounded-[10px]" style={{ backgroundColor: "var(--brand-bg)" }} />
            <div className="h-40 rounded-[10px]" style={{ backgroundColor: "var(--brand-bg)" }} />
            <div className="h-40 rounded-[10px]" style={{ backgroundColor: "var(--brand-bg)" }} />
          </div>
        </section>
      )}

      {/* DIAGNOSTIC VARIANT C — Comparisons strip replaced with static deterministic placeholder (removes cross-origin favicon <img> preloads). Not for merge. */}
      {latestComparisons.length > 0 && (
        <section className="mb-14 md:mb-16">
          <div className="mb-7 flex items-end justify-between">
            <h2 className="text-2xl font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>DIAGNOSTIC PLACEHOLDER 2</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="h-32 rounded-[10px] border" style={{ borderColor: "var(--border-subtle)", background: "var(--bg-surface)" }} />
            <div className="h-32 rounded-[10px] border" style={{ borderColor: "var(--border-subtle)", background: "var(--bg-surface)" }} />
            <div className="h-32 rounded-[10px] border" style={{ borderColor: "var(--border-subtle)", background: "var(--bg-surface)" }} />
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
