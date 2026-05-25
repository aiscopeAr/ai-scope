import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { absoluteUrl, SITE_NAME_AR } from "@/lib/seo";
import ReviewCard from "@/components/ReviewCard";
import AdSlot from "@/components/AdSlot";

export const dynamic = "force-dynamic";

async function getCategoryPageData(slug: string) {
  try {
    const category = await prisma.category.findUnique({
      where: { slug },
      select: { id: true, slug: true, nameAr: true, name: true },
    });

    if (!category) return null;

    const [reviews, relatedCategories] = await Promise.all([
      prisma.review.findMany({
        where: { published: true, categoryId: category.id },
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
        where: { slug: { not: slug } },
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
      category,
      reviews,
      relatedCategories: relatedCategories.filter((item) => item._count.reviews > 0).slice(0, 8),
    };
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const data = await getCategoryPageData(slug);
  if (!data) return {};

  const url = absoluteUrl(`/category/${slug}`);
  const description = `تقارير وتحليلات في تصنيف ${data.category.nameAr} على ${SITE_NAME_AR}.`;

  return {
    title: `${data.category.nameAr} | ${SITE_NAME_AR}`,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: `${data.category.nameAr} | ${SITE_NAME_AR}`,
      description,
      url,
      type: "website",
      locale: "ar_AR",
    },
  };
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getCategoryPageData(slug);
  if (!data) notFound();

  const { category, reviews, relatedCategories } = data;

  return (
    <main className="container mx-auto max-w-6xl px-4 py-8" dir="rtl">
      <nav className="mb-6 flex items-center gap-2 text-sm text-slate-500">
        <Link href="/" className="hover:text-violet-400 transition-colors">الرئيسية</Link>
        <span>/</span>
        <Link href="/reviews" className="hover:text-violet-400 transition-colors">التقارير</Link>
        <span>/</span>
        <span className="text-slate-300">{category.nameAr}</span>
      </nav>

      <section className="mb-10 rounded-3xl border border-white/8 bg-white/3 p-6 md:p-8">
        <p className="mb-3 text-sm font-semibold text-violet-300">تصنيف تحريري</p>
        <h1 className="mb-3 text-3xl font-black text-white md:text-5xl">{category.nameAr}</h1>
        <p className="max-w-3xl text-sm leading-relaxed text-slate-400 md:text-base">
          كل التقارير المنشورة في هذا التصنيف، مرتبة من الأحدث إلى الأقدم.
        </p>
      </section>

      {relatedCategories.length > 0 && (
        <section className="mb-8 flex flex-wrap gap-2">
          {relatedCategories.map((item) => (
            <Link
              key={item.id}
              href={`/category/${item.slug}`}
              className="rounded-full border border-white/10 bg-white/4 px-4 py-2 text-sm text-slate-300 transition hover:border-violet-500/30 hover:text-violet-300"
            >
              {item.nameAr}
              <span className="mr-2 text-slate-500">({item._count.reviews})</span>
            </Link>
          ))}
        </section>
      )}

      <AdSlot position="category-top" className="mb-8" />

      {reviews.length === 0 ? (
        <section className="rounded-2xl border border-white/8 bg-white/3 p-8 text-center">
          <h2 className="mb-2 text-xl font-bold text-white">لا توجد تقارير في هذا التصنيف بعد</h2>
          <p className="mb-4 text-slate-500">يمكنك العودة إلى جميع التقارير أو متابعة تصنيف آخر.</p>
          <Link href="/reviews" className="text-sm font-semibold text-violet-400 hover:text-violet-300">
            عرض جميع التقارير
          </Link>
        </section>
      ) : (
        <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </section>
      )}
    </main>
  );
}
