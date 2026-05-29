import type { Metadata } from "next";
import Link from "next/link";
import ReviewCard from "@/components/ReviewCard";
import ToolCard from "@/components/ToolCard";
import ToolOfTheWeek from "@/components/ToolOfTheWeek";
import NewsletterInline from "@/components/NewsletterInline";
import AdSlot from "@/components/AdSlot";
import { prisma } from "@/lib/db";
import { SITE_URL, SITE_NAME, SITE_NAME_AR, SITE_DESCRIPTION_AR } from "@/lib/seo";
import { Scale, ArrowLeft } from "lucide-react";

export const revalidate = 300; // ISR — revalidate every 5 minutes

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
    const [featuredReview, latestReviews, featuredTools, toolOfWeek, latestComparisons] = await Promise.all([
      prisma.review.findFirst({
        where: { published: true },
        orderBy: { publishedAt: "desc" },
        include: { category: true },
      }),
      prisma.review.findMany({
        where: { published: true },
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
    ]);
    return { featuredReview, latestReviews, featuredTools, toolOfWeek, latestComparisons };
  } catch {
    return { featuredReview: null, latestReviews: [], featuredTools: [], toolOfWeek: null, latestComparisons: [] };
  }
}

export default async function HomePage() {
  const { featuredReview, latestReviews, featuredTools, toolOfWeek, latestComparisons } = await getData();

  return (
    <main className="container mx-auto max-w-6xl px-4 py-8" dir="rtl">
      <AdSlot position="home-top" className="mb-8" />

      {/* Featured review */}
      {featuredReview && (
        <section className="mb-12">
          <ReviewCard review={featuredReview} featured priority />
        </section>
      )}

      {/* Latest reviews grid */}
      {latestReviews.length > 0 && (
        <section className="mb-12">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>آخر التقارير</h2>
            <Link href="/reviews" className="text-sm font-semibold hover-opacity transition" style={{ color: "var(--accent)" }}>
              عرض الكل ←
            </Link>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {latestReviews.map((r) => (
              <ReviewCard key={r.id} review={r} />
            ))}
          </div>
        </section>
      )}

      <AdSlot position="home-mid" className="mb-10" />

      {/* AI Tools */}
      {featuredTools.length > 0 && (
        <section className="mb-12">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>اكتشف أدوات الذكاء الاصطناعي</h2>
            <Link href="/ai-tools" className="text-sm font-semibold hover-opacity transition" style={{ color: "var(--accent)" }}>
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

      {/* Comparisons strip */}
      {latestComparisons.length > 0 && (
        <section className="mb-12">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Scale className="h-5 w-5" style={{ color: "var(--accent)" }} />
              <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
                مقارنات الأدوات
              </h2>
            </div>
            <Link href="/compare" className="flex items-center gap-1 text-sm font-semibold transition hover:opacity-70" style={{ color: "var(--accent)" }}>
              عرض الكل <ArrowLeft className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {latestComparisons.map((comp) => {
              const [a, b] = comp.sides;
              return (
                <Link
                  key={comp.id}
                  href={`/compare/${comp.slug}`}
                  className="group flex flex-col gap-3 rounded-2xl border p-4 transition-all hover:-translate-y-0.5 hover:shadow-md"
                  style={{ borderColor: "var(--border-subtle)", background: "var(--bg-surface)" }}
                >
                  {/* Tools row */}
                  <div className="flex items-center gap-2">
                    {comp.sides.map((side, i) => (
                      <div key={side.id} className="flex items-center gap-1.5">
                        {i > 0 && (
                          <span className="rounded px-1 py-0.5 text-[10px] font-black"
                            style={{ background: "var(--accent-bg)", color: "var(--accent)" }}>VS</span>
                        )}
                        {side.tool.logoUrl ? (
                          <img src={side.tool.logoUrl} alt={side.tool.name}
                            className="h-7 w-7 rounded-lg object-contain"
                            style={{ background: "#f8fafc", border: "1px solid #e2e8f0", padding: 3 }} />
                        ) : (
                          <div className="flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold text-white"
                            style={{ background: "var(--accent)" }}>
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
                  <span className="mt-auto text-xs font-semibold" style={{ color: "var(--accent)" }}>
                    قرأ المقارنة ←
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Tool of the Week */}
      {toolOfWeek && <ToolOfTheWeek tool={toolOfWeek} />}

      {/* Authors intro */}
      <section className="mb-12 rounded-[6px] border p-6" style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-surface)" }}>
        <h2 className="mb-6 text-center text-xl font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>فريق التقارير</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            { slug: "zayd", name: "زيد", title: "محلل نماذج الذكاء الاصطناعي", accent: "#6366f1", desc: "يحلل النماذج الكبرى ويقارن قدراتها بعيناً نقدية — لا يصدق الضجيج التسويقي." },
            { slug: "lina", name: "لينا", title: "مراسلة شؤون الشركات والسياسات", accent: "#ec4899", desc: "تقرأ بين سطور قرارات شركات AI وتربط الأحداث بالصورة الاقتصادية الأشمل." },
          ].map((a) => (
            <Link
              key={a.slug}
              href={`/author/${a.slug}`}
              className="card-hover "
              style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-subtle)" }}
            >
              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-[6px]" style={{ outline: `2px solid ${a.accent}50`, outlineOffset: "2px" }}>
                <img src={`/images/authors/${a.slug}.svg`} alt={a.name} className="h-full w-full object-cover" />
              </div>
              <div>
                <p className="font-bold" style={{ color: a.accent }}>{a.name}</p>
                <p className="text-xs" style={{ color: "var(--text-secondary)" }}>{a.title}</p>
                <p className="mt-1 text-xs line-clamp-2" style={{ color: "var(--text-muted)" }}>{a.desc}</p>
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
