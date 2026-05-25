import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { absoluteUrl, SITE_NAME_AR } from "@/lib/seo";
import ReviewCard from "@/components/ReviewCard";
import ToolCard from "@/components/ToolCard";
import SearchBox from "@/components/SearchBox";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `البحث | ${SITE_NAME_AR}`,
  description: "ابحث في السكريفات وأدوات الذكاء الاصطناعي داخل AI Scope.",
  alternates: { canonical: absoluteUrl("/search") },
  robots: {
    index: false,
    follow: true,
  },
};

async function searchContent(query: string, type: string) {
  const q = query.trim();
  if (!q) {
    try {
      const [recentReviews, recentTools] = await Promise.all([
        prisma.review.findMany({
          where: { published: true },
          orderBy: { publishedAt: "desc" },
          take: 6,
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
        prisma.aITool.findMany({
          where: { published: true },
          orderBy: [{ featured: "desc" }, { viewCount: "desc" }],
          take: 6,
          select: {
            id: true,
            slug: true,
            name: true,
            tagline: true,
            descriptionAr: true,
            logoUrl: true,
            toolCategory: true,
            pricing: true,
            monthlyPrice: true,
            arabicSupport: true,
            hasApi: true,
            tags: true,
            viewCount: true,
            likes: true,
            featured: true,
            editorPick: true,
          },
        }),
      ]);

      return { reviews: recentReviews, tools: recentTools };
    } catch {
      return { reviews: [], tools: [] };
    }
  }

  const reviewWhere = {
    published: true,
    OR: [
      { titleAr: { contains: q, mode: "insensitive" as const } },
      { summary: { contains: q, mode: "insensitive" as const } },
      { content: { contains: q, mode: "insensitive" as const } },
      { tags: { has: q } },
      { keywords: { has: q } },
    ],
  };

  const toolWhere = {
    published: true,
    OR: [
      { name: { contains: q, mode: "insensitive" as const } },
      { tagline: { contains: q, mode: "insensitive" as const } },
      { descriptionAr: { contains: q, mode: "insensitive" as const } },
      { tags: { has: q } },
    ],
  };

  try {
    const [reviews, tools] = await Promise.all([
      type === "tools"
        ? Promise.resolve([])
        : prisma.review.findMany({
            where: reviewWhere,
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
      type === "reviews"
        ? Promise.resolve([])
        : prisma.aITool.findMany({
            where: toolWhere,
            orderBy: [{ featured: "desc" }, { viewCount: "desc" }],
            take: 24,
            select: {
              id: true,
              slug: true,
              name: true,
              tagline: true,
              descriptionAr: true,
              logoUrl: true,
              toolCategory: true,
              pricing: true,
              monthlyPrice: true,
              arabicSupport: true,
              hasApi: true,
              tags: true,
              viewCount: true,
              likes: true,
              featured: true,
              editorPick: true,
            },
          }),
    ]);

    return { reviews, tools };
  } catch {
    return { reviews: [], tools: [] };
  }
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string }>;
}) {
  const { q = "", type = "all" } = await searchParams;
  const activeType = type === "reviews" || type === "tools" ? type : "all";
  const { reviews, tools } = await searchContent(q, activeType);

  const totalResults = reviews.length + tools.length;

  return (
    <main className="container mx-auto max-w-6xl px-4 py-8" dir="rtl">
      <section className="mb-10 rounded-3xl border border-white/8 bg-white/3 p-6 md:p-8">
        <p className="mb-3 text-sm font-semibold text-violet-300">ابحث في الموقع</p>
        <h1 className="mb-4 text-3xl font-black text-white md:text-5xl">البحث</h1>
        <SearchBox defaultValue={q} />
        <div className="mt-4 flex flex-wrap gap-2">
          {[
            { value: "all", label: "الكل" },
            { value: "reviews", label: "السكريفات" },
            { value: "tools", label: "الأدوات" },
          ].map((item) => {
            const href = item.value === "all"
              ? `/search${q ? `?q=${encodeURIComponent(q)}` : ""}`
              : `/search?${new URLSearchParams({ q, type: item.value }).toString()}`;

            return (
              <Link
                key={item.value}
                href={href}
                className={`rounded-full border px-4 py-2 text-sm transition ${
                  activeType === item.value
                    ? "border-violet-500/40 bg-violet-500/10 text-violet-300"
                    : "border-white/10 bg-white/4 text-slate-400 hover:border-violet-500/30 hover:text-violet-300"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </section>

      {q ? (
        <p className="mb-6 text-sm text-slate-500">
          {totalResults > 0
            ? `وجدنا ${totalResults} نتيجة لعبارة "${q}".`
            : `لا توجد نتائج لعبارة "${q}".`}
        </p>
      ) : (
        <p className="mb-6 text-sm text-slate-500">ابدأ بكتابة كلمة مفتاحية للبحث في السكريفات والدليل.</p>
      )}

      {reviews.length > 0 && (
        <section className="mb-12">
          <div className="mb-5 flex items-center gap-3">
            <h2 className="text-xl font-black text-white">السكريفات</h2>
            <div className="h-px flex-1 bg-white/5" />
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {reviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
        </section>
      )}

      {tools.length > 0 && (
        <section>
          <div className="mb-5 flex items-center gap-3">
            <h2 className="text-xl font-black text-white">أدوات الذكاء الاصطناعي</h2>
            <div className="h-px flex-1 bg-white/5" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tools.map((tool) => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
