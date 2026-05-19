import { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import NewsCard from "@/components/NewsCard";
import { prisma } from "@/lib/db";
import { mockArticles, mockCategories } from "@/lib/mock-data";
import { SITE_URL, SITE_NAME, SITE_NAME_AR, truncate, absoluteUrl } from "@/lib/seo";
import AdSlot from "@/components/AdSlot";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 12;

const getCategory = cache(async (slug: string) => {
  try {
    return await prisma.category.findUnique({ where: { slug } });
  } catch {
    return mockCategories.find((c) => c.slug === slug) ?? null;
  }
});

async function getCategoryData(
  slug: string,
  page: number,
  source: string,
  sort: string,
) {
  try {
    const where = {
      published: true,
      category: { slug },
      ...(source ? { sourceName: source } : {}),
    };

    const orderBy =
      sort === "oldest"
        ? { publishedAt: "asc" as const }
        : { publishedAt: "desc" as const };

    const [articles, total, sources] = await Promise.all([
      prisma.article.findMany({
        where,
        orderBy,
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        include: { category: true },
      }),
      prisma.article.count({ where }),
      prisma.article.findMany({
        where: { published: true, category: { slug } },
        select: { sourceName: true },
        distinct: ["sourceName"],
        orderBy: { sourceName: "asc" },
      }),
    ]);

    return {
      articles,
      total,
      sources: sources.map((s) => s.sourceName),
      pages: Math.ceil(total / PAGE_SIZE),
    };
  } catch {
    const filtered = mockArticles.filter((a) => a.category.slug === slug);
    return { articles: filtered.slice(0, PAGE_SIZE), total: filtered.length, sources: [], pages: 1 };
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategory(slug);
  if (!category) return {};

  const categoryUrl = absoluteUrl(`/category/${category.slug}`);
  const description = truncate(`أحدث أخبار ${category.nameAr} في عالم الذكاء الاصطناعي`, 160);

  return {
    title: `${category.nameAr} | ${SITE_NAME_AR}`,
    description,
    alternates: { canonical: categoryUrl },
    openGraph: {
      type: "website",
      url: categoryUrl,
      title: `${category.nameAr} | ${SITE_NAME}`,
      description,
      locale: "ar_AR",
      siteName: SITE_NAME,
    },
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string; source?: string; sort?: string }>;
}) {
  const { slug } = await params;
  const { page: pageParam = "1", source = "", sort = "newest" } = await searchParams;

  const page = Math.max(1, parseInt(pageParam, 10) || 1);
  const category = await getCategory(slug);
  if (!category) notFound();

  const { articles, total, sources, pages } = await getCategoryData(slug, page, source, sort);

  const categoryUrl = absoluteUrl(`/category/${category.slug}`);

  const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": categoryUrl,
    url: categoryUrl,
    name: category.nameAr,
    inLanguage: "ar",
    isPartOf: { "@type": "WebSite", "@id": `${SITE_URL}/#website` },
  };

  const makeHref = (overrides: { page?: number; source?: string; sort?: string }) => {
    const p = new URLSearchParams();
    const np = overrides.page ?? page;
    const ns = overrides.source !== undefined ? overrides.source : source;
    const nso = overrides.sort ?? sort;
    if (np > 1) p.set("page", String(np));
    if (ns) p.set("source", ns);
    if (nso !== "newest") p.set("sort", nso);
    const qs = p.toString();
    return `/category/${slug}${qs ? `?${qs}` : ""}`;
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }}
      />

      <section className="container mx-auto px-4 py-8" dir="rtl">

        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-sm text-slate-500">
          <Link href="/" className="hover:text-violet-400 transition-colors">الرئيسية</Link>
          <span className="text-slate-700">/</span>
          <span className="text-slate-400">{category.nameAr}</span>
        </nav>

        {/* Header */}
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-3">
              <h1 className="text-4xl font-black text-white">{category.nameAr}</h1>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm font-semibold text-slate-400">
                {total.toLocaleString("ar-EG")} مقال
              </span>
            </div>
            <p className="text-slate-400">
              {source ? `المصدر: ${source}` : "جميع المصادر"}
              {pages > 1 && ` · صفحة ${page} من ${pages}`}
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Sort */}
            <div className="flex items-center gap-1 rounded-xl border border-white/8 bg-white/3 p-1">
              {[
                { value: "newest", label: "الأحدث" },
                { value: "oldest", label: "الأقدم" },
              ].map((opt) => (
                <Link
                  key={opt.value}
                  href={makeHref({ sort: opt.value, page: 1 })}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                    sort === opt.value
                      ? "bg-violet-600 text-white"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {opt.label}
                </Link>
              ))}
            </div>

            {/* Source filter */}
            {sources.length > 1 && (
              <div className="flex flex-wrap items-center gap-1">
                <Link
                  href={makeHref({ source: "", page: 1 })}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                    !source
                      ? "border-violet-500/40 bg-violet-500/10 text-violet-400"
                      : "border-white/8 bg-white/3 text-slate-400 hover:text-white"
                  }`}
                >
                  الكل
                </Link>
                {sources.map((s) => (
                  <Link
                    key={s}
                    href={makeHref({ source: s, page: 1 })}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                      source === s
                        ? "border-violet-500/40 bg-violet-500/10 text-violet-400"
                        : "border-white/8 bg-white/3 text-slate-400 hover:text-white"
                    }`}
                  >
                    {s}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        <AdSlot position="category-top" className="mb-8" />

        {/* Articles grid */}
        {articles.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-20 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/8 bg-white/3 text-3xl">📭</div>
            <p className="text-slate-400">لا توجد مقالات في هذا التصنيف بعد</p>
            <Link href="/" className="text-sm text-violet-400 hover:underline">العودة للرئيسية</Link>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => (
              <NewsCard key={article.id} article={article} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {pages > 1 && (
          <div className="mt-10 flex items-center justify-center gap-2" dir="ltr">
            <Link
              href={makeHref({ page: page - 1 })}
              aria-disabled={page <= 1}
              className={`flex h-9 w-9 items-center justify-center rounded-xl border text-sm transition ${
                page <= 1
                  ? "pointer-events-none border-white/5 text-slate-700"
                  : "border-white/10 bg-white/3 text-slate-400 hover:border-violet-500/40 hover:text-white"
              }`}
            >
              ‹
            </Link>

            {Array.from({ length: pages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === pages || Math.abs(p - page) <= 2)
              .reduce<(number | "…")[]>((acc, p, i, arr) => {
                if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("…");
                acc.push(p);
                return acc;
              }, [])
              .map((p, i) =>
                p === "…" ? (
                  <span key={`ellipsis-${i}`} className="flex h-9 w-9 items-center justify-center text-slate-600">
                    …
                  </span>
                ) : (
                  <Link
                    key={p}
                    href={makeHref({ page: p as number })}
                    className={`flex h-9 w-9 items-center justify-center rounded-xl border text-sm font-medium transition ${
                      page === p
                        ? "border-violet-500/40 bg-violet-600 text-white"
                        : "border-white/10 bg-white/3 text-slate-400 hover:border-violet-500/40 hover:text-white"
                    }`}
                  >
                    {p}
                  </Link>
                )
              )}

            <Link
              href={makeHref({ page: page + 1 })}
              aria-disabled={page >= pages}
              className={`flex h-9 w-9 items-center justify-center rounded-xl border text-sm transition ${
                page >= pages
                  ? "pointer-events-none border-white/5 text-slate-700"
                  : "border-white/10 bg-white/3 text-slate-400 hover:border-violet-500/40 hover:text-white"
              }`}
            >
              ›
            </Link>
          </div>
        )}

      </section>
    </>
  );
}
