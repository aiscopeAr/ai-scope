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
    <div className="overflow-hidden rounded-[6px] border" style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-surface)" }}>
      <div className="h-40 animate-shimmer" />
      <div className="p-4 space-y-2">
        <div className="h-3 w-1/3 rounded-[3px] animate-shimmer" />
        <div className="h-4 rounded-[3px] animate-shimmer" />
        <div className="h-4 w-4/5 rounded-[3px] animate-shimmer" />
        <div className="h-3 w-1/4 rounded-[3px] animate-shimmer" />
      </div>
    </div>
  );
}

function NewsCard({ article }: { article: Article }) {
  const [time, setTime] = useState(() => timeAgo(article.publishedAt));

  useEffect(() => {
    const t = setInterval(() => setTime(timeAgo(article.publishedAt)), 60_000);
    return () => clearInterval(t);
  }, [article.publishedAt]);

  return (
    <Link
      href={`/news/${article.slug}`}
      className="group flex flex-col rounded-[6px] border overflow-hidden transition"
      style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-surface)" }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border-medium)"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border-subtle)"; }}
    >
      <div className="relative h-40 w-full shrink-0" style={{ backgroundColor: "var(--bg-subtle)" }}>
        {article.imageUrl ? (
          <Image
            src={article.imageUrl}
            alt={article.titleAr}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" style={{ stroke: "var(--border-medium)" }}>
              <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>
            </svg>
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4" dir="rtl">
        <span className="mb-2 inline-block w-fit rounded-[3px] px-2 py-0.5 text-[11px] font-semibold"
          style={{ backgroundColor: "var(--accent-bg)", color: "var(--accent)" }}>
          {article.category.nameAr}
        </span>
        <h3 className="flex-1 line-clamp-2 text-sm font-bold leading-snug transition-opacity group-hover:opacity-75"
          style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
          {article.titleAr}
        </h3>
        <div className="mt-3 flex items-center justify-between text-[11px]" style={{ color: "var(--text-muted)" }}>
          <span>{article.sourceName}</span>
          {time && <span>{time}</span>}
        </div>
      </div>
    </Link>
  );
}

export default function LiveFeed({ initialArticles, categories, featured }: Props) {
  const [activeCategory, setActiveCategory] = useState<string>("");
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

  const grid = articles.filter((a) => !featured || a.id !== featured.id).slice(0, 12);

  return (
    <>
      {/* Category tabs */}
      {categories.length > 0 && (
        <div className="sticky top-14 z-30 border-b" style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-page)" }} dir="rtl">
          <div className="container mx-auto flex gap-1.5 overflow-x-auto px-4 py-2.5 scrollbar-none">
            <button
              onClick={() => handleCategory("")}
              className="flex shrink-0 items-center gap-1.5 rounded-[6px] border px-3 py-1.5 text-xs font-semibold transition"
              style={{
                borderColor: activeCategory === "" ? "var(--accent)" : "var(--border-medium)",
                backgroundColor: activeCategory === "" ? "var(--accent-bg)" : "transparent",
                color: activeCategory === "" ? "var(--accent)" : "var(--text-secondary)",
              }}
            >
              الكل
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategory(cat.id)}
                className="flex shrink-0 items-center gap-1.5 rounded-[6px] border px-3 py-1.5 text-xs font-medium transition"
                style={{
                  borderColor: activeCategory === cat.id ? "var(--accent)" : "var(--border-medium)",
                  backgroundColor: activeCategory === cat.id ? "var(--accent-bg)" : "transparent",
                  color: activeCategory === cat.id ? "var(--accent)" : "var(--text-secondary)",
                }}
              >
                {cat.nameAr}
                <span className="rounded-[3px] px-1 py-0.5 text-[10px]"
                  style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-muted)" }}>
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
