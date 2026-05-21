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
    <>
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
              <h2 className="text-xl font-black text-white">آخر السكريفات</h2>
              <Link href="/reviews" className="text-sm font-semibold text-violet-400 hover:text-violet-300">
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
              <div>
                <h2 className="text-xl font-black text-white">اكتشف أدوات الذكاء الاصطناعي</h2>
              </div>
              <Link href="/ai-tools" className="text-sm font-semibold text-violet-400 hover:text-violet-300">
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
        <section className="mb-12 rounded-2xl border border-white/8 bg-white/3 p-6">
          <h2 className="mb-6 text-center text-xl font-black text-white">فريق السكريفات</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { slug: "zayd", name: "زيد", title: "محلل نماذج الذكاء الاصطناعي", accent: "#6366f1", desc: "يحلل النماذج الكبرى ويقارن قدراتها بعيناً نقدية — لا يصدق الضجيج التسويقي." },
              { slug: "lina", name: "لينا", title: "مراسلة شؤون الشركات والسياسات", accent: "#ec4899", desc: "تقرأ بين سطور قرارات شركات AI وتربط الأحداث بالصورة الاقتصادية الأشمل." },
            ].map((a) => (
              <Link key={a.slug} href={`/author/${a.slug}`} className="group flex items-center gap-4 rounded-xl border border-white/8 bg-white/3 p-4 transition hover:border-violet-500/20 hover:bg-white/5">
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full" style={{ outline: `2px solid ${a.accent}50`, outlineOffset: "2px" }}>
                  <img src={`/images/authors/${a.slug}.webp`} alt={a.name} className="h-full w-full object-cover" />
                </div>
                <div>
                  <p className="font-bold text-white" style={{ color: a.accent }}>{a.name}</p>
                  <p className="text-xs text-slate-400">{a.title}</p>
                  <p className="mt-1 text-xs text-slate-500 line-clamp-2">{a.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <AdSlot position="home-bottom" className="mb-4" />
      </main>
    </>
  );
}
