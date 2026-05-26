import type { Metadata } from "next";
import Link from "next/link";
import ReviewCard from "@/components/ReviewCard";
import ToolCard from "@/components/ToolCard";
import AdSlot from "@/components/AdSlot";
import { prisma } from "@/lib/db";
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

async function getData() {
  try {
    const [featuredReview, latestReviews, featuredTools] = await Promise.all([
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
    ]);
    return { featuredReview, latestReviews, featuredTools };
  } catch {
    return { featuredReview: null, latestReviews: [], featuredTools: [] };
  }
}

export default async function HomePage() {
  const { featuredReview, latestReviews, featuredTools } = await getData();

  return (
    <main className="container mx-auto max-w-6xl px-4 py-8" dir="rtl">
      <AdSlot position="home-top" className="mb-8" />

      {/* Featured review */}
      {featuredReview && (
        <section className="mb-12">
          <ReviewCard review={featuredReview} featured />
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

      <AdSlot position="home-bottom" className="mb-4" />
    </main>
  );
}
