import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import { prisma } from "@/lib/db";
import { SITE_URL, SITE_NAME } from "@/lib/seo";
import AdSlot from "@/components/AdSlot";
import SearchBox from "@/components/SearchBox";

export const dynamic = "force-dynamic";

export function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string }>;
}): Metadata {
  return {
    title: `بحث — ${SITE_NAME}`,
    description: "ابحث في أخبار الذكاء الاصطناعي، الأدوات، والأدلة باللغة العربية",
    alternates: { canonical: `${SITE_URL}/search` },
    robots: { index: false },
  };
}

const PRICING_AR: Record<string, string> = {
  free: "مجاني",
  freemium: "مجاني جزئياً",
  paid: "مدفوع",
};

const DIFFICULTY_AR: Record<string, string> = {
  beginner: "مبتدئ",
  intermediate: "متوسط",
  advanced: "متقدم",
};

type ResultType = "all" | "articles" | "tools" | "guides";

async function getResults(q: string, type: ResultType) {
  if (!q || q.length < 2) return { articles: [], tools: [], guides: [], total: 0 };

  const term = q.trim();

  const [articles, tools, guides] = await Promise.all([
    type === "tools" || type === "guides"
      ? []
      : prisma.article.findMany({
          where: {
            published: true,
            OR: [
              { titleAr: { contains: term, mode: "insensitive" } },
              { contentAr: { contains: term, mode: "insensitive" } },
              { tags: { has: term } },
              { sourceName: { contains: term, mode: "insensitive" } },
            ],
          },
          orderBy: { publishedAt: "desc" },
          take: type === "articles" ? 20 : 6,
          include: { category: true },
        }),

    type === "articles" || type === "guides"
      ? []
      : prisma.aITool.findMany({
          where: {
            published: true,
            OR: [
              { name: { contains: term, mode: "insensitive" } },
              { tagline: { contains: term, mode: "insensitive" } },
              { descriptionAr: { contains: term, mode: "insensitive" } },
              { useCases: { has: term } },
            ],
          },
          orderBy: { viewCount: "desc" },
          take: type === "tools" ? 20 : 6,
        }),

    type === "articles" || type === "tools"
      ? []
      : prisma.guide.findMany({
          where: {
            published: true,
            OR: [
              { title: { contains: term, mode: "insensitive" } },
              { excerpt: { contains: term, mode: "insensitive" } },
              { tags: { has: term } },
            ],
          },
          orderBy: { publishedAt: "desc" },
          take: type === "guides" ? 20 : 4,
        }),
  ]);

  return {
    articles,
    tools,
    guides,
    total: articles.length + tools.length + guides.length,
  };
}

function ArticleResult({
  article,
}: {
  article: {
    slug: string;
    titleAr: string;
    excerpt: string | null;
    imageUrl: string | null;
    publishedAt: Date | null;
    sourceName: string;
    category: { nameAr: string; slug: string };
  };
}) {
  const timeAgo = article.publishedAt
    ? formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true, locale: ar })
    : null;
  return (
    <Link href={`/news/${article.slug}`} className="group flex gap-4 rounded-xl border border-white/6 bg-white/2 p-4 transition hover:border-violet-500/20 hover:bg-white/4">
      {article.imageUrl && (
        <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-lg">
          <Image src={article.imageUrl} alt={article.titleAr} fill className="object-cover" />
        </div>
      )}
      <div className="min-w-0 flex-1" dir="rtl">
        <span className="mb-1 inline-block rounded-full bg-violet-500/10 px-2 py-0.5 text-xs text-violet-400 border border-violet-500/20">
          {article.category.nameAr}
        </span>
        <h3 className="mb-1 line-clamp-2 text-sm font-semibold text-white transition group-hover:text-violet-300 leading-snug">
          {article.titleAr}
        </h3>
        {article.excerpt && (
          <p className="line-clamp-2 text-xs text-slate-500 leading-relaxed">{article.excerpt}</p>
        )}
        <div className="mt-2 flex items-center gap-2 text-xs text-slate-600">
          <span>{article.sourceName}</span>
          {timeAgo && <><span>·</span><span>{timeAgo}</span></>}
        </div>
      </div>
    </Link>
  );
}

function ToolResult({
  tool,
}: {
  tool: {
    slug: string;
    name: string;
    tagline: string | null;
    logoUrl: string | null;
    category: string;
    pricing: string;
    pros: string[];
  };
}) {
  return (
    <Link href={`/ai-tools/${tool.slug}`} className="group flex gap-4 rounded-xl border border-white/6 bg-white/2 p-4 transition hover:border-fuchsia-500/20 hover:bg-white/4">
      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-white/8 bg-white/4">
        {tool.logoUrl ? (
          <Image src={tool.logoUrl} alt={tool.name} fill className="object-contain p-1.5" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-lg font-bold text-fuchsia-400">
            {tool.name[0]}
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1" dir="rtl">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="text-sm font-bold text-white transition group-hover:text-fuchsia-300">
            {tool.name}
          </h3>
          <span className="rounded-full bg-fuchsia-500/10 px-2 py-0.5 text-xs text-fuchsia-400 border border-fuchsia-500/20">
            {PRICING_AR[tool.pricing] ?? tool.pricing}
          </span>
        </div>
        {tool.tagline && (
          <p className="mt-0.5 line-clamp-2 text-xs text-slate-400">{tool.tagline}</p>
        )}
        {tool.pros[0] && (
          <p className="mt-1 text-xs text-slate-500 line-clamp-1">✓ {tool.pros[0]}</p>
        )}
      </div>
    </Link>
  );
}

function GuideResult({
  guide,
}: {
  guide: {
    slug: string;
    title: string;
    excerpt: string;
    difficulty: string;
    readingTime: number | null;
    category: string;
  };
}) {
  return (
    <Link href={`/guides/${guide.slug}`} className="group flex gap-4 rounded-xl border border-white/6 bg-white/2 p-4 transition hover:border-emerald-500/20 hover:bg-white/4">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-2xl">
        📖
      </div>
      <div className="min-w-0 flex-1" dir="rtl">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="text-sm font-bold text-white transition group-hover:text-emerald-300 line-clamp-1">
            {guide.title}
          </h3>
          <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-400 border border-emerald-500/20">
            {DIFFICULTY_AR[guide.difficulty] ?? guide.difficulty}
          </span>
        </div>
        <p className="mt-0.5 line-clamp-2 text-xs text-slate-400 leading-relaxed">{guide.excerpt}</p>
        {guide.readingTime && (
          <p className="mt-1 text-xs text-slate-600">{guide.readingTime} دقيقة قراءة</p>
        )}
      </div>
    </Link>
  );
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string }>;
}) {
  const { q = "", type = "all" } = await searchParams;
  const activeType = (["all", "articles", "tools", "guides"].includes(type) ? type : "all") as ResultType;
  const { articles, tools, guides, total } = await getResults(q, activeType);

  const tabs: { id: ResultType; label: string; count?: number }[] = [
    { id: "all", label: "الكل" },
    { id: "articles", label: "الأخبار" },
    { id: "tools", label: "الأدوات" },
    { id: "guides", label: "الأدلة" },
  ];

  const makeHref = (t: ResultType) =>
    `/search?q=${encodeURIComponent(q)}&type=${t}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SearchResultsPage",
    url: `${SITE_URL}/search?q=${encodeURIComponent(q)}`,
    name: `نتائج البحث عن "${q}" — ${SITE_NAME}`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main className="min-h-screen" dir="rtl">
        {/* Hero search bar */}
        <div className="border-b border-white/6 bg-[#0d0d12] px-4 py-10">
          <div className="mx-auto max-w-3xl">
            <h1 className="mb-2 text-center text-3xl font-bold text-white">
              البحث
            </h1>
            <p className="mb-6 text-center text-sm text-slate-500">
              ابحث في أخبار الذكاء الاصطناعي، الأدوات، والأدلة باللغة العربية
            </p>
            <Suspense>
              <SearchBox defaultValue={q} />
            </Suspense>
          </div>
        </div>

        <div className="mx-auto max-w-5xl px-4 py-8">
          <AdSlot position="search-top" className="mb-8" />

          {/* Results header */}
          {q && (
            <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
              <p className="text-sm text-slate-400">
                {total > 0 ? (
                  <>
                    <span className="font-semibold text-white">{total}</span> نتيجة للبحث عن{" "}
                    <span className="font-semibold text-violet-400">"{q}"</span>
                  </>
                ) : (
                  <>
                    لا توجد نتائج للبحث عن{" "}
                    <span className="font-semibold text-violet-400">"{q}"</span>
                  </>
                )}
              </p>

              {/* Type tabs */}
              {total > 0 && (
                <div className="flex items-center gap-1 rounded-xl border border-white/8 bg-white/3 p-1">
                  {tabs.map((tab) => (
                    <Link
                      key={tab.id}
                      href={makeHref(tab.id)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                        activeType === tab.id
                          ? "bg-violet-600 text-white"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      {tab.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Empty state */}
          {!q && (
            <div className="mt-12 flex flex-col items-center gap-4 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/8 bg-white/3 text-3xl">
                🔍
              </div>
              <p className="text-slate-400">اكتب كلمة البحث للعثور على أخبار الذكاء الاصطناعي، أدوات، أو أدلة</p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {["ChatGPT", "Gemini", "Midjourney", "كلود", "OpenAI", "توليد الصور"].map((term) => (
                  <Link
                    key={term}
                    href={`/search?q=${encodeURIComponent(term)}`}
                    className="rounded-full border border-white/8 bg-white/3 px-3 py-1.5 text-xs text-slate-400 transition hover:border-violet-500/30 hover:text-violet-400"
                  >
                    {term}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* No results */}
          {q && total === 0 && (
            <div className="mt-12 flex flex-col items-center gap-4 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/8 bg-white/3 text-3xl">
                😶
              </div>
              <p className="text-slate-400">لم يتم العثور على نتائج. جرب كلمات بحث مختلفة.</p>
              <Link href="/" className="text-sm text-violet-400 hover:underline">
                العودة إلى الرئيسية
              </Link>
            </div>
          )}

          {/* Results */}
          {total > 0 && (
            <div className="space-y-8">
              {/* Articles */}
              {articles.length > 0 && (
                <section>
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="flex items-center gap-2 text-base font-bold text-white">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-500/15 text-sm">📰</span>
                      الأخبار
                    </h2>
                    {activeType === "all" && (
                      <Link href={makeHref("articles")} className="text-xs text-violet-400 hover:underline">
                        عرض الكل
                      </Link>
                    )}
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {articles.map((a) => (
                      <ArticleResult key={a.id} article={a} />
                    ))}
                  </div>
                </section>
              )}

              {/* Tools */}
              {tools.length > 0 && (
                <section>
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="flex items-center gap-2 text-base font-bold text-white">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-fuchsia-500/15 text-sm">🛠️</span>
                      الأدوات
                    </h2>
                    {activeType === "all" && (
                      <Link href={makeHref("tools")} className="text-xs text-fuchsia-400 hover:underline">
                        عرض الكل
                      </Link>
                    )}
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {tools.map((t) => (
                      <ToolResult key={t.id} tool={t} />
                    ))}
                  </div>
                </section>
              )}

              {/* Guides */}
              {guides.length > 0 && (
                <section>
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="flex items-center gap-2 text-base font-bold text-white">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/15 text-sm">📖</span>
                      الأدلة
                    </h2>
                    {activeType === "all" && (
                      <Link href={makeHref("guides")} className="text-xs text-emerald-400 hover:underline">
                        عرض الكل
                      </Link>
                    )}
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {guides.map((g) => (
                      <GuideResult key={g.id} guide={g} />
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
