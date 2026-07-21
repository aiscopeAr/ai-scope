import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { absoluteUrl, SITE_NAME_AR } from "@/lib/seo";
import { normalizeTag, reviewHasTag, slugToTag } from "@/lib/tags";
import ReviewCard from "@/components/ReviewCard";
import Pagination from "@/components/Pagination";
import AdSlot from "@/components/AdSlot";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 24;
const MIN_REVIEWS_FOR_TAG_PAGE = 3;

async function getTagPageData(tagSlug: string, page: number) {
  const canonical = normalizeTag(slugToTag(tagSlug));
  if (!canonical) return null;

  // Tag matching needs the same-article "ال" normalization as buildTagSummaries,
  // which Postgres array `has` can't express — filter in memory (cheap at this scale).
  const allReviews = await prisma.review.findMany({
    where: { published: true },
    orderBy: { publishedAt: "desc" },
    select: {
      id: true, slug: true, titleAr: true, summary: true, imageUrl: true,
      publishedAt: true, authorSlug: true, tags: true, viewCount: true,
      category: { select: { nameAr: true, slug: true } },
    },
  });

  const matching = allReviews.filter((r) => reviewHasTag(r.tags, canonical));
  if (matching.length < MIN_REVIEWS_FOR_TAG_PAGE) return null;

  const label =
    matching
      .flatMap((r) => r.tags)
      .filter((t) => normalizeTag(t) === canonical)[0] ?? canonical;

  const totalCount = matching.length;
  const reviews = matching.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return { label, canonical, reviews, totalCount };
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ tag: string }>;
  searchParams: Promise<{ page?: string }>;
}): Promise<Metadata> {
  const { tag } = await params;
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const data = await getTagPageData(tag, page);
  if (!data) return {};

  const url = absoluteUrl(page > 1 ? `/tag/${tag}?page=${page}` : `/tag/${tag}`);
  const description = `كل التقارير والتحليلات المتعلقة بـ ${data.label} على ${SITE_NAME_AR}.`;
  const title = page > 1
    ? `${data.label} — صفحة ${page} | ${SITE_NAME_AR}`
    : `${data.label} | ${SITE_NAME_AR}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: "website", locale: "ar_AR" },
  };
}

export default async function TagPage({
  params,
  searchParams,
}: {
  params: Promise<{ tag: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { tag } = await params;
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const data = await getTagPageData(tag, page);
  if (!data) notFound();

  const { label, reviews, totalCount } = data;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  return (
    <main className="container mx-auto max-w-6xl px-4 py-8" dir="rtl">
      <nav className="mb-6 flex items-center gap-2 text-sm" style={{ color: "var(--text-muted)" }}>
        <Link href="/" className="link-muted transition-colors">الرئيسية</Link>
        <span>/</span>
        <Link href="/reviews" className="link-muted transition-colors">التقارير</Link>
        <span>/</span>
        <span className="font-medium" style={{ color: "var(--text-secondary)" }}>#{label}</span>
      </nav>

      <section className="mb-10 rounded-[6px] border p-6 md:p-8" style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-surface)" }}>
        <p className="mb-3 text-sm font-semibold" style={{ color: "var(--accent)" }}>وسم</p>
        <h1 className="mb-3 text-3xl font-bold md:text-5xl" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>#{label}</h1>
        <p className="max-w-3xl text-sm leading-relaxed md:text-base" style={{ color: "var(--text-secondary)" }}>
          {totalCount.toLocaleString("ar-EG")} تقرير مرتبط بهذا الوسم، من الأحدث إلى الأقدم.
        </p>
      </section>

      <AdSlot position="category-top" className="mb-8" />

      <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {reviews.map((review) => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </section>

      <Pagination currentPage={page} totalPages={totalPages} basePath={`/tag/${tag}`} />
    </main>
  );
}
