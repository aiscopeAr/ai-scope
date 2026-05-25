import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { absoluteUrl, SITE_NAME_AR, SITE_DESCRIPTION_AR } from "@/lib/seo";
import ReviewCard from "@/components/ReviewCard";
import AdSlot from "@/components/AdSlot";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `سكريفات وتحليلات الذكاء الاصطناعي | ${SITE_NAME_AR}`,
  description: SITE_DESCRIPTION_AR,
  alternates: { canonical: absoluteUrl("/reviews") },
  openGraph: {
    title: `سكريفات وتحليلات الذكاء الاصطناعي | ${SITE_NAME_AR}`,
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
          id: true,
          slug: true,
          titleAr: true,
          summary: true,
          imageUrl: true,
          publishedAt: true,
          authorSlug: true,
          tags: true,
          viewCount: true,
          category: { select: { nameAr: true, slug: true } },
        },
      }),
      prisma.category.findMany({
        orderBy: { nameAr: "asc" },
        select: {
          id: true,
          slug: true,
          nameAr: true,
          _count: { select: { reviews: true } },
        },
      }),
    ]);

    return {
      reviews,
      categories: categories.filter((category) => category._count.reviews > 0),
    };
  } catch {
    return { reviews: [], categories: [] };
  }
}

export default async function ReviewsIndexPage() {
  const { reviews, categories } = await getData();
  const [featuredReview, ...restReviews] = reviews;

  return (
    <main className="container mx-auto max-w-6xl px-4 py-8" dir="rtl">
      <section className="mb-10 rounded-3xl border border-white/8 bg-white/3 p-6 md:p-8">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-1.5 text-xs font-semibold text-violet-300">
          <span className="h-2 w-2 rounded-full bg-violet-400" />
          تحليلات معمقة بالعربية
        </div>
        <h1 className="mb-3 text-3xl font-black text-white md:text-5xl">أحدث السكريفات</h1>
        <p className="max-w-3xl text-sm leading-relaxed text-slate-400 md:text-base">
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
                className="rounded-full border border-white/10 bg-white/4 px-4 py-2 text-sm text-slate-300 transition hover:border-violet-500/30 hover:text-violet-300"
              >
                {category.nameAr}
                <span className="mr-2 text-slate-500">({category._count.reviews})</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <AdSlot position="home-top" className="mb-8" />

      {reviews.length === 0 ? (
        <section className="rounded-2xl border border-white/8 bg-white/3 p-8 text-center">
          <h2 className="mb-2 text-xl font-bold text-white">لا توجد سكريفات منشورة بعد</h2>
          <p className="text-slate-500">بمجرد نشر أول تحليل سيظهر هنا تلقائيًا.</p>
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
