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

const CATEGORY_ICONS: Record<string, string> = {
  image:     "🎨",
  writing:   "✍️",
  code:      "💻",
  marketing: "📣",
  general:   "✨",
};

const CATEGORY_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  image:     { bg: "#fdf4ff", color: "#9333ea", border: "#e9d5ff" },
  writing:   { bg: "#eff6ff", color: "#2563eb", border: "#bfdbfe" },
  code:      { bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0" },
  marketing: { bg: "#fffbeb", color: "#b45309", border: "#fde68a" },
  general:   { bg: "var(--bg-subtle)", color: "var(--text-muted)", border: "var(--border-medium)" },
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
    <div className="container mx-auto max-w-7xl px-4 py-10">
      {/* Search + count */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center" dir="rtl">
        <div className="relative flex-1 sm:max-w-sm">
          <svg className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: "var(--text-muted)" }}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="search"
            placeholder="ابحث عن برومبت..."
            value={search}
            onChange={e => handleSearch(e.target.value)}
            className="w-full rounded-[6px] border py-2.5 pr-9 pl-4 text-sm outline-none transition-colors"
            style={{
              borderColor: "var(--border-medium)",
              backgroundColor: "var(--bg-surface)",
              color: "var(--text-primary)",
            }}
            onFocus={e => (e.currentTarget.style.borderColor = "var(--accent)")}
            onBlur={e => (e.currentTarget.style.borderColor = "var(--border-medium)")}
          />
        </div>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          {total.toLocaleString("ar-EG")} نتيجة
        </p>
      </div>

      {/* Category tabs */}
      <div className="mb-8 flex flex-wrap gap-2" dir="rtl">
        {categories.map(cat => (
          <button
            key={cat.value}
            onClick={() => handleCategory(cat.value)}
            className="rounded-full border px-4 py-1.5 text-sm font-medium transition-colors"
            style={{
              borderColor: activeCategory === cat.value ? "var(--accent)" : "var(--border-medium)",
              backgroundColor: activeCategory === cat.value ? "var(--accent-bg)" : "var(--bg-subtle)",
              color: activeCategory === cat.value ? "var(--accent)" : "var(--text-secondary)",
            }}
          >
            {cat.value !== "all" && CATEGORY_ICONS[cat.value] && (
              <span className="ml-1">{CATEGORY_ICONS[cat.value]}</span>
            )}
            {cat.label}
          </button>
        ))}
      </div>

      {/* Featured section */}
      {showFeatured && (
        <section className="mb-10">
          <h2 className="mb-4 text-lg font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
            ⭐ مميزة
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featuredPrompts.slice(0, 6).map(p => <PromptCard key={p.id} prompt={p} />)}
          </div>
        </section>
      )}

      {/* All prompts grid */}
      <section>
        {showFeatured && (
          <h2 className="mb-4 text-lg font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
            جميع البرومبتس
          </h2>
        )}

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="h-44 animate-pulse rounded-[6px] border"
                style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-surface)" }} />
            ))}
          </div>
        ) : prompts.length === 0 ? (
          <div className="py-24 text-center" style={{ color: "var(--text-muted)" }}>
            <p className="text-4xl mb-4">🔍</p>
            <p className="text-lg font-medium" style={{ color: "var(--text-secondary)" }}>لا توجد نتائج</p>
            <p className="text-sm mt-1">جرّب كلمة بحث مختلفة أو اختر فئة أخرى</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {prompts.map(p => <PromptCard key={p.id} prompt={p} />)}
          </div>
        )}
      </section>

      {/* Pagination */}
      {pages > 1 && (
        <div className="mt-10 flex items-center justify-center gap-2">
          <button
            onClick={() => handlePage(page - 1)}
            disabled={page <= 1}
            className="rounded-[6px] border px-4 py-2 text-sm transition-colors disabled:opacity-30"
            style={{ borderColor: "var(--border-medium)", color: "var(--text-secondary)", backgroundColor: "var(--bg-surface)" }}
          >
            السابق
          </button>
          <span className="text-sm" style={{ color: "var(--text-muted)" }}>
            {page} / {pages}
          </span>
          <button
            onClick={() => handlePage(page + 1)}
            disabled={page >= pages}
            className="rounded-[6px] border px-4 py-2 text-sm transition-colors disabled:opacity-30"
            style={{ borderColor: "var(--border-medium)", color: "var(--text-secondary)", backgroundColor: "var(--bg-surface)" }}
          >
            التالي
          </button>
        </div>
      )}
    </div>
  );
}

function PromptCard({ prompt }: { prompt: PromptItem }) {
  const catStyle = CATEGORY_COLORS[prompt.category] ?? CATEGORY_COLORS.general;

  return (
    <Link
      href={`/prompts/${prompt.slug}`}
      className="group relative flex flex-col rounded-[6px] border p-5 transition-all"
      style={{
        borderColor: "var(--border-subtle)",
        backgroundColor: "var(--bg-surface)",
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.borderColor = "var(--accent)";
        (e.currentTarget as HTMLElement).style.backgroundColor = "var(--bg-subtle)";
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.borderColor = "var(--border-subtle)";
        (e.currentTarget as HTMLElement).style.backgroundColor = "var(--bg-surface)";
      }}
    >
      {/* Category badge */}
      <span className="mb-3 inline-flex w-fit items-center gap-1 rounded-[3px] border px-2 py-0.5 text-xs font-semibold"
        style={{ backgroundColor: catStyle.bg, color: catStyle.color, borderColor: catStyle.border }}>
        {CATEGORY_ICONS[prompt.category]} {categoryLabel(prompt.category)}
      </span>

      <h3 className="mb-2 line-clamp-2 text-sm font-semibold leading-snug transition-colors"
        style={{ color: "var(--text-primary)" }}>
        {prompt.titleAr}
      </h3>

      {prompt.description && (
        <p className="mb-3 line-clamp-2 text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
          {prompt.description}
        </p>
      )}

      <div className="mt-auto flex items-center justify-between pt-2 border-t"
        style={{ borderColor: "var(--border-subtle)" }}>
        {prompt.tool ? (
          <span className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-muted)" }}>
            {prompt.tool.logoUrl && (
              <Image src={prompt.tool.logoUrl} alt={prompt.tool.name} width={14} height={14} className="rounded-sm" />
            )}
            {prompt.tool.name}
          </span>
        ) : (
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>عام</span>
        )}
        <span className="text-xs" style={{ color: "var(--accent)" }}>نسخ ←</span>
      </div>

      {prompt.featured && (
        <span className="absolute left-3 top-3 rounded-[3px] border px-1.5 py-0.5 text-[10px] font-bold"
          style={{ backgroundColor: "#fffbeb", color: "#b45309", borderColor: "#fde68a" }}>
          مميز
        </span>
      )}
    </Link>
  );
}

function categoryLabel(cat: string): string {
  const map: Record<string, string> = {
    image: "صور", writing: "كتابة", code: "برمجة", marketing: "تسويق", general: "عام",
  };
  return map[cat] ?? cat;
}
