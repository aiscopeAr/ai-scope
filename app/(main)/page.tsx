import type { Metadata } from "next";
import Link from "next/link";
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
  const { featuredReview, latestComparisons, tutorialReviews } = await getData();

  return (
    <main className="container mx-auto max-w-6xl px-4 py-10 md:px-6" dir="rtl">
      <h1
        className="mb-6 text-sm font-semibold tracking-wide sm:mb-8"
        style={{ color: "var(--text-muted)" }}
      >
        Lumiq — أخبار وأدوات الذكاء الاصطناعي بالعربية
      </h1>

      {/* DIAGNOSTIC VARIANT D — AdSlot, hero ReviewCard, Latest Reviews grid, AI Tools grid, Tool of the Week replaced with static placeholder. Not for merge. */}
      <div className="mb-14 md:mb-16 h-24 rounded-[10px]" style={{ backgroundColor: "var(--bg-surface)" }} />
      {featuredReview && (
        <section className="mb-14 md:mb-16">
          <h2 className="text-2xl font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>DIAGNOSTIC PLACEHOLDER D1 (hero+grid+tools+totw)</h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="h-56 rounded-[10px]" style={{ backgroundColor: "var(--bg-surface)" }} />
            <div className="h-56 rounded-[10px]" style={{ backgroundColor: "var(--bg-surface)" }} />
            <div className="h-56 rounded-[10px]" style={{ backgroundColor: "var(--bg-surface)" }} />
            <div className="h-56 rounded-[10px]" style={{ backgroundColor: "var(--bg-surface)" }} />
          </div>
        </section>
      )}

      {/* AI Guides */}
      {tutorialReviews.length > 0 && (
        <section className="mb-14 md:mb-16">
          <div className="mb-7 flex items-end justify-between">
            <h2 className="text-2xl font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>أدلة الذكاء الاصطناعي</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {tutorialReviews.map((r) => (
              <Link
                key={r.id}
                href={`/reviews/${r.slug}`}
                className="group flex h-full flex-col rounded-[10px] p-5 transition-all duration-200 hover:-translate-y-0.5"
                style={{ backgroundColor: "var(--brand-bg)" }}
              >
                <h3 className="mb-2 line-clamp-2 text-[15px] font-bold leading-snug transition-opacity group-hover:opacity-80"
                  style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
                  {r.titleAr}
                </h3>
                <p className="mb-4 line-clamp-2 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{r.summary}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Comparisons strip */}
      {latestComparisons.length > 0 && (
        <section className="mb-14 md:mb-16">
          <div className="mb-7 flex items-end justify-between">
            <h2 className="text-2xl font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
              مقارنات الأدوات
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {latestComparisons.map((comp) => (
              <Link
                key={comp.id}
                href={`/compare/${comp.slug}`}
                className="group flex flex-col gap-3 rounded-[10px] border p-4 transition-all duration-200 hover:-translate-y-0.5"
                style={{ borderColor: "var(--border-subtle)", background: "var(--bg-surface)" }}
              >
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
                <p className="text-sm font-bold leading-snug group-hover:opacity-75 transition-opacity line-clamp-2"
                  style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
                  {comp.title}
                </p>
              </Link>
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
