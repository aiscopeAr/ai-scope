"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";

interface Article {
  id: string;
  slug: string;
  titleAr: string;
  excerpt: string | null;
  imageUrl: string | null;
  publishedAt: string | null;
  sourceName: string;
  viewCount: number;
  category: { nameAr: string; slug: string; id: string };
}

interface Category {
  id: string;
  slug: string;
  nameAr: string;
  _count: { articles: number };
}

interface Props {
  initialArticles: Article[];
  categories: Category[];
  featured: Article | null;
}

function timeAgo(date: string | null) {
  if (!date) return null;
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: ar });
}

function ArticleSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-white/6 bg-white/2 overflow-hidden">
      <div className="h-40 bg-white/5" />
      <div className="p-4 space-y-2">
        <div className="h-3 w-1/3 rounded bg-white/8" />
        <div className="h-4 rounded bg-white/8" />
        <div className="h-4 w-4/5 rounded bg-white/8" />
        <div className="h-3 w-1/4 rounded bg-white/5" />
      </div>
    </div>
  );
}

function NewsCard({ article }: { article: Article }) {
  const [time, setTime] = useState(() => timeAgo(article.publishedAt));

  useEffect(() => {
    // Refresh timestamp every 60 seconds
    const t = setInterval(() => setTime(timeAgo(article.publishedAt)), 60_000);
    return () => clearInterval(t);
  }, [article.publishedAt]);

  return (
    <Link
      href={`/news/${article.slug}`}
      className="group flex flex-col rounded-2xl border border-white/6 bg-white/2 overflow-hidden transition hover:border-violet-500/25 hover:bg-white/4"
    >
      <div className="relative h-40 w-full bg-white/4 shrink-0">
        {article.imageUrl ? (
          <Image
            src={article.imageUrl}
            alt={article.titleAr}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-violet-900/30 to-blue-900/30">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(167,139,250,0.3)" strokeWidth="1.5">
              <circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3" />
            </svg>
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4" dir="rtl">
        <span className="mb-2 inline-block w-fit rounded-full bg-violet-500/10 border border-violet-500/15 px-2 py-0.5 text-[11px] font-semibold text-violet-400">
          {article.category.nameAr}
        </span>
        <h3 className="flex-1 line-clamp-2 text-sm font-bold leading-snug text-slate-200 transition-colors group-hover:text-violet-300">
          {article.titleAr}
        </h3>
        <div className="mt-3 flex items-center justify-between text-[11px] text-slate-600">
          <span>{article.sourceName}</span>
          {time && <span>{time}</span>}
        </div>
      </div>
    </Link>
  );
}

export default function LiveFeed({ initialArticles, categories, featured }: Props) {
  const [activeCategory, setActiveCategory] = useState<string>(""); // "" = all
  const [articles, setArticles] = useState<Article[]>(initialArticles);
  const [loading, setLoading] = useState(false);

  const fetchArticles = useCallback(async (categoryId: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ take: "12" });
      if (categoryId) params.set("categoryId", categoryId);
      const res = await fetch(`/api/articles?${params}`);
      if (res.ok) setArticles(await res.json());
    } catch {
      // keep existing
    } finally {
      setLoading(false);
    }
  }, []);

  function handleCategory(id: string) {
    setActiveCategory(id);
    fetchArticles(id);
  }

  // Filter out featured from grid
  const grid = articles.filter((a) => !featured || a.id !== featured.id).slice(0, 12);

  return (
    <>
      {/* Category tabs */}
      {categories.length > 0 && (
        <div className="sticky top-16 z-30 border-b border-white/5 bg-[#09090b]/90 backdrop-blur-sm" dir="rtl">
          <div className="container mx-auto flex gap-1 overflow-x-auto px-4 py-2 scrollbar-none">
            <button
              onClick={() => handleCategory("")}
              className={`flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-1.5 text-xs font-semibold transition ${
                activeCategory === ""
                  ? "border-violet-500/40 bg-violet-500/10 text-violet-300"
                  : "border-white/8 bg-white/4 text-slate-400 hover:border-violet-500/20 hover:text-white"
              }`}
            >
              الكل
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategory(cat.id)}
                className={`flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-1.5 text-xs font-medium transition ${
                  activeCategory === cat.id
                    ? "border-violet-500/40 bg-violet-500/10 text-violet-300"
                    : "border-white/8 bg-white/4 text-slate-400 hover:border-violet-500/20 hover:text-white"
                }`}
              >
                {cat.nameAr}
                <span className="rounded-full bg-white/8 px-1.5 py-0.5 text-[10px] text-slate-600">
                  {cat._count.articles}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Article grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <ArticleSkeleton key={i} />)
          : grid.map((article) => <NewsCard key={article.id} article={article} />)
        }
      </div>
    </>
  );
}
