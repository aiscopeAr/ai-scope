import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db";
import { absoluteUrl, SITE_NAME_AR, SITE_URL, SITE_TWITTER_HANDLE } from "@/lib/seo";
import { CACHE_TAGS, DEFAULT_REVALIDATE_SECONDS } from "@/lib/cache";
import ReviewCard from "@/components/ReviewCard";
import AdSlot from "@/components/AdSlot";
import Pagination from "@/components/Pagination";

const PAGE_SIZE = 24;

const getCategoryPageData = unstable_cache(
  async (slug: string, page: number) => {
    try {
      const category = await prisma.category.findUnique({
        where: { slug },
        select: { id: true, slug: true, nameAr: true, name: true },
      });
      if (!category) return null;

      const [reviews, totalCount, relatedCategories] = await Promise.all([
        prisma.review.findMany({
          where: { published: true, categoryId: category.id },
          orderBy: { publishedAt: "desc" },
          skip: (page - 1) * PAGE_SIZE,
          take: PAGE_SIZE,
          select: {
            id: true, slug: true, titleAr: true, summary: true, imageUrl: true,
            publishedAt: true, authorSlug: true, tags: true, viewCount: true,
            category: { select: { nameAr: true, slug: true } },
          },
        }),
        prisma.review.count({ where: { published: true, categoryId: category.id } }),
        prisma.category.findMany({
          where: { slug: { not: slug } },
          orderBy: { nameAr: "asc" },
          select: { id: true, slug: true, nameAr: true, _count: { select: { reviews: true } } },
        }),
      ]);

      return {
        category,
        reviews,
        totalCount,
        relatedCategories: relatedCategories.filter((item) => item._count.reviews > 0).slice(0, 8),
      };
    } catch {
      return null;
    }
  },
  ["category-page"],
  { tags: [CACHE_TAGS.reviews, CACHE_TAGS.categories], revalidate: DEFAULT_REVALIDATE_SECONDS },
);

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const data = await getCategoryPageData(slug, page);
  if (!data) return {};
  const url = absoluteUrl(page > 1 ? `/category/${slug}?page=${page}` : `/category/${slug}`);
  const description = `تقارير وتحليلات في تصنيف ${data.category.nameAr} على ${SITE_NAME_AR}.`;
  const title = page > 1
    ? `${data.category.nameAr} — صفحة ${page} | ${SITE_NAME_AR}`
    : `${data.category.nameAr} | ${SITE_NAME_AR}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title, description, url, type: "website", locale: "ar_AR",
      images: [{ url: `${SITE_URL}/opengraph-image`, width: 1200, height: 630, alt: data.category.nameAr }],
    },
    twitter: {
      card: "summary_large_image",
      site: SITE_TWITTER_HANDLE,
      title,
      description,
      images: [`${SITE_URL}/opengraph-image`],
    },
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { slug } = await params;
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const data = await getCategoryPageData(slug, page);
  if (!data) notFound();
  const { category, reviews, totalCount, relatedCategories } = data;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: category.nameAr,
    description: `تقارير وتحليلات في تصنيف ${category.nameAr} على ${SITE_NAME_AR}`,
    url: absoluteUrl(page > 1 ? `/category/${slug}?page=${page}` : `/category/${slug}`),
    inLanguage: "ar",
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }} />
      <main className="container mx-auto max-w-6xl px-4 py-8" dir="rtl">
      <nav className="mb-6 flex items-center gap-2 text-sm" style={{ color: "var(--text-muted)" }}>
        <Link href="/" className="link-muted transition-colors">الرئيسية</Link>
        <span>/</span>
        <Link href="/reviews" className="link-muted transition-colors">التقارير</Link>
        <span>/</span>
        <span className="font-medium" style={{ color: "var(--text-secondary)" }}>{category.nameAr}</span>
      </nav>

      <section className="mb-10 rounded-[6px] border p-6 md:p-8" style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-surface)" }}>
        <p className="mb-3 text-sm font-semibold" style={{ color: "var(--accent)" }}>تصنيف تحريري</p>
        <h1 className="mb-3 text-3xl font-bold md:text-5xl" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>{category.nameAr}</h1>
        <p className="max-w-3xl text-sm leading-relaxed md:text-base" style={{ color: "var(--text-secondary)" }}>
          كل التقارير المنشورة في هذا التصنيف، مرتبة من الأحدث إلى الأقدم.
        </p>
      </section>

      {relatedCategories.length > 0 && (
        <section className="mb-8 flex flex-wrap gap-2">
          {relatedCategories.map((item) => (
            <Link
              key={item.id}
              href={`/category/${item.slug}`}
              className="pill-hover "
              style={{ borderColor: "var(--border-medium)", color: "var(--text-secondary)", backgroundColor: "var(--bg-surface)" }}
            >
              {item.nameAr}
              <span className="mr-2" style={{ color: "var(--text-muted)" }}>({item._count.reviews})</span>
            </Link>
          ))}
        </section>
      )}

      <AdSlot position="category-top" className="mb-8" />

      {reviews.length === 0 ? (
        <section className="rounded-[6px] border p-8 text-center" style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-surface)" }}>
          <h2 className="mb-2 text-xl font-bold" style={{ color: "var(--text-primary)" }}>لا توجد تقارير في هذا التصنيف بعد</h2>
          <p className="mb-4" style={{ color: "var(--text-muted)" }}>يمكنك العودة إلى جميع التقارير أو متابعة تصنيف آخر.</p>
          <Link href="/reviews" className="text-sm font-semibold hover-opacity transition" style={{ color: "var(--accent)" }}>
            عرض جميع التقارير
          </Link>
        </section>
      ) : (
        <>
          <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {reviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </section>
          <Pagination currentPage={page} totalPages={totalPages} basePath={`/category/${slug}`} />
        </>
      )}
      </main>
    </>
  );
}
