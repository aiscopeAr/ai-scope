import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { absoluteUrl, SITE_NAME_AR, SITE_DESCRIPTION_AR } from "@/lib/seo";
import ReviewCard from "@/components/ReviewCard";
import AdSlot from "@/components/AdSlot";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `تقارير وتحليلات الذكاء الاصطناعي | ${SITE_NAME_AR}`,
  description: SITE_DESCRIPTION_AR,
  alternates: { canonical: absoluteUrl("/reviews") },
  openGraph: {
    title: `تقارير وتحليلات الذكاء الاصطناعي | ${SITE_NAME_AR}`,
    description: SITE_DESCRIPTION_AR,
    url: absoluteUrl("/reviews"),
    type: "website",
    locale: "ar_AR",
  },
};

async function getData() {
  try {
    const [reviews, categories] = await Promise.all([
      prisma.review.findMany({
        where: { published: true },
        orderBy: { publishedAt: "desc" },
        take: 24,
        select: {
          id: true, slug: true, titleAr: true, summary: true, imageUrl: true,
          publishedAt: true, authorSlug: true, tags: true, viewCount: true,
          category: { select: { nameAr: true, slug: true } },
        },
      }),
      prisma.category.findMany({
        orderBy: { nameAr: "asc" },
        select: { id: true, slug: true, nameAr: true, _count: { select: { reviews: true } } },
      }),
    ]);
    return { reviews, categories: categories.filter((c) => c._count.reviews > 0) };
  } catch {
    return { reviews: [], categories: [] };
  }
}

export default async function ReviewsIndexPage() {
  const { reviews, categories } = await getData();
  const [featuredReview, ...restReviews] = reviews;

  return (
    <main className="container mx-auto max-w-6xl px-4 py-8" dir="rtl">
      {/* Hero */}
      <section className="mb-10 rounded-[6px] border p-6 md:p-8" style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-surface)" }}>
        <div className="mb-4 inline-flex items-center gap-2 rounded-[3px] border px-4 py-1.5 text-xs font-semibold"
          style={{ borderColor: "var(--accent)", backgroundColor: "var(--accent-bg)", color: "var(--accent)" }}>
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: "var(--accent)" }} />
          تحليلات معمقة بالعربية
        </div>
        <h1 className="mb-3 text-3xl font-bold md:text-5xl" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>أحدث التقارير</h1>
        <p className="max-w-3xl text-sm leading-relaxed md:text-base" style={{ color: "var(--text-secondary)" }}>
          أرشيف تحليلات AI Scope: مراجعات عربية عميقة لأهم أخبار النماذج والأبحاث والشركات والسياسات في عالم الذكاء الاصطناعي.
        </p>
      </section>

      {categories.length > 0 && (
        <section className="mb-8">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/category/${category.slug}`}
                className="pill-hover "
                style={{ borderColor: "var(--border-medium)", color: "var(--text-secondary)", backgroundColor: "var(--bg-surface)" }}
              >
                {category.nameAr}
                <span className="mr-2" style={{ color: "var(--text-muted)" }}>({category._count.reviews})</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <AdSlot position="home-top" className="mb-8" />

      {reviews.length === 0 ? (
        <section className="rounded-[6px] border p-8 text-center" style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-surface)" }}>
          <h2 className="mb-2 text-xl font-bold" style={{ color: "var(--text-primary)" }}>لا توجد تقارير منشورة بعد</h2>
          <p style={{ color: "var(--text-muted)" }}>بمجرد نشر أول تحليل سيظهر هنا تلقائيًا.</p>
        </section>
      ) : (
        <>
          {featuredReview && (
            <section className="mb-8">
              <ReviewCard review={featuredReview} featured />
            </section>
          )}
          {restReviews.length > 0 && (
            <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {restReviews.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </section>
          )}
        </>
      )}
    </main>
  );
}
