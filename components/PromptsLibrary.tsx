"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";

type PromptItem = {
  id: string;
  title: string;
  titleAr: string;
  description: string | null;
  category: string;
  tags: string[];
  slug: string;
  featured: boolean;
  viewCount: number;
  createdAt: Date | string;
  tool: { name: string; slug: string; logoUrl: string | null } | null;
};

type Category = { value: string; label: string };

const CATEGORY_COLORS: Record<string, string> = {
  image:     "bg-pink-500/20 text-pink-300",
  writing:   "bg-indigo-500/20 text-indigo-300",
  code:      "bg-emerald-500/20 text-emerald-300",
  marketing: "bg-amber-500/20 text-amber-300",
  general:   "bg-gray-500/20 text-gray-300",
};

const CATEGORY_ICONS: Record<string, string> = {
  image:     "🎨",
  writing:   "✍️",
  code:      "💻",
  marketing: "📣",
  general:   "✨",
};

interface Props {
  initialPrompts: PromptItem[];
  initialTotal: number;
  featuredPrompts: PromptItem[];
  categories: Category[];
}

export default function PromptsLibrary({ initialPrompts, initialTotal, featuredPrompts, categories }: Props) {
  const [prompts, setPrompts] = useState(initialPrompts);
  const [total, setTotal] = useState(initialTotal);
  const [activeCategory, setActiveCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [pages, setPages] = useState(Math.ceil(initialTotal / 24));

  const fetchPrompts = useCallback(async (cat: string, q: string, pg: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(pg) });
      if (cat !== "all") params.set("category", cat);
      if (q.trim()) params.set("q", q.trim());
      const res = await fetch(`/api/prompts?${params}`);
      const data = await res.json();
      setPrompts(data.prompts);
      setTotal(data.total);
      setPages(data.pages);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleCategory = (cat: string) => {
    setActiveCategory(cat);
    setPage(1);
    fetchPrompts(cat, search, 1);
  };

  const handleSearch = (q: string) => {
    setSearch(q);
    setPage(1);
    fetchPrompts(activeCategory, q, 1);
  };

  const handlePage = (pg: number) => {
    setPage(pg);
    fetchPrompts(activeCategory, search, pg);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const showFeatured = activeCategory === "all" && !search && page === 1 && featuredPrompts.length > 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      {/* Search */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center">
        <input
          type="search"
          placeholder="ابحث عن برومبت..."
          value={search}
          onChange={e => handleSearch(e.target.value)}
          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-gray-500 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 sm:max-w-sm"
        />
        <p className="text-sm text-gray-500">{total.toLocaleString("ar-SA")} نتيجة</p>
      </div>

      {/* Category tabs */}
      <div className="mb-8 flex flex-wrap gap-2" dir="rtl">
        {categories.map(cat => (
          <button
            key={cat.value}
            onClick={() => handleCategory(cat.value)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              activeCategory === cat.value
                ? "bg-violet-600 text-white"
                : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
            }`}
          >
            {cat.value !== "all" && CATEGORY_ICONS[cat.value] && (
              <span className="mr-1">{CATEGORY_ICONS[cat.value]}</span>
            )}
            {cat.label}
          </button>
        ))}
      </div>

      {/* Featured section */}
      {showFeatured && (
        <section className="mb-12">
          <h2 className="mb-4 text-lg font-semibold text-white">⭐ مميزة</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featuredPrompts.map(p => (
              <PromptCard key={p.id} prompt={p} />
            ))}
          </div>
        </section>
      )}

      {/* All prompts grid */}
      <section>
        {showFeatured && <h2 className="mb-4 text-lg font-semibold text-white">جميع البرومبتس</h2>}
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="h-44 animate-pulse rounded-2xl bg-white/5" />
            ))}
          </div>
        ) : prompts.length === 0 ? (
          <div className="py-20 text-center text-gray-500">لا توجد نتائج</div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {prompts.map(p => (
              <PromptCard key={p.id} prompt={p} />
            ))}
          </div>
        )}
      </section>

      {/* Pagination */}
      {pages > 1 && (
        <div className="mt-10 flex items-center justify-center gap-2">
          <button
            onClick={() => handlePage(page - 1)}
            disabled={page <= 1}
            className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm disabled:opacity-30"
          >
            السابق
          </button>
          <span className="text-sm text-gray-400">
            {page} / {pages}
          </span>
          <button
            onClick={() => handlePage(page + 1)}
            disabled={page >= pages}
            className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm disabled:opacity-30"
          >
            التالي
          </button>
        </div>
      )}
    </div>
  );
}

function PromptCard({ prompt }: { prompt: PromptItem }) {
  return (
    <Link
      href={`/prompts/${prompt.slug}`}
      className="group relative flex flex-col rounded-2xl border border-white/10 bg-white/5 p-5 transition-all hover:border-violet-500/40 hover:bg-white/8"
    >
      {/* Category badge */}
      <span
        className={`mb-3 inline-flex w-fit items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
          CATEGORY_COLORS[prompt.category] ?? "bg-gray-500/20 text-gray-300"
        }`}
      >
        {CATEGORY_ICONS[prompt.category]} {categoryLabel(prompt.category)}
      </span>

      <h3 className="mb-2 line-clamp-2 text-sm font-semibold leading-snug text-white group-hover:text-violet-300">
        {prompt.titleAr}
      </h3>

      {prompt.description && (
        <p className="mb-3 line-clamp-2 text-xs leading-relaxed text-gray-400">{prompt.description}</p>
      )}

      <div className="mt-auto flex items-center justify-between">
        {prompt.tool ? (
          <span className="flex items-center gap-1.5 text-xs text-gray-500">
            {prompt.tool.logoUrl && (
              <Image
                src={prompt.tool.logoUrl}
                alt={prompt.tool.name}
                width={16}
                height={16}
                className="rounded-sm"
              />
            )}
            {prompt.tool.name}
          </span>
        ) : (
          <span className="text-xs text-gray-600">عام</span>
        )}
        <span className="text-xs text-gray-600">{prompt.viewCount} مشاهدة</span>
      </div>

      {prompt.featured && (
        <span className="absolute left-3 top-3 rounded-full bg-violet-500/30 px-1.5 py-0.5 text-[10px] text-violet-300">
          مميز
        </span>
      )}
    </Link>
  );
}

function categoryLabel(cat: string): string {
  const map: Record<string, string> = {
    image: "صور",
    writing: "كتابة",
    code: "برمجة",
    marketing: "تسويق",
    general: "عام",
  };
  return map[cat] ?? cat;
}
