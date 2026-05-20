"use client";

import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import ToolCard, { type ToolCardData } from "./ToolCard";

interface Category {
  value: string;
  labelAr: string;
  icon: string;
  count: number;
}

const PAGE_SIZE = 12;

export default function ToolsDirectory({
  allTools,
  categories,
  initialQ = "",
  initialCat = "",
  initialPricing = "",
}: {
  allTools: ToolCardData[];
  categories: Category[];
  initialQ?: string;
  initialCat?: string;
  initialPricing?: string;
}) {
  const [q, setQ] = useState(initialQ);
  const [cat, setCat] = useState(initialCat);
  const [pricing, setPricing] = useState(initialPricing);
  const [page, setPage] = useState(1);
  const [arabicOnly, setArabicOnly] = useState(false);
  const [apiOnly, setApiOnly] = useState(false);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return allTools.filter((t) => {
      if (term && !t.name.toLowerCase().includes(term) && !t.descriptionAr.includes(term) && !t.tags.some((tag) => tag.toLowerCase().includes(term))) return false;
      if (cat && t.toolCategory !== cat) return false;
      if (pricing && t.pricing !== pricing) return false;
      if (arabicOnly && !t.arabicSupport) return false;
      if (apiOnly && !t.hasApi) return false;
      return true;
    });
  }, [allTools, q, cat, pricing, arabicOnly, apiOnly]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const slice = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function resetPage() { setPage(1); }

  return (
    <div>
      {/* Search + filters */}
      <div className="mb-6 space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
          <input
            type="search"
            placeholder="ابحث عن أداة..."
            value={q}
            onChange={(e) => { setQ(e.target.value); resetPage(); }}
            className="w-full rounded-xl border border-white/10 bg-white/4 py-2.5 pr-10 pl-4 text-sm text-slate-200 placeholder:text-slate-500 focus:border-violet-500/50 focus:outline-none focus:ring-1 focus:ring-violet-500/30"
            dir="rtl"
          />
        </div>

        {/* Filter row */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Pricing */}
          {(["", "free", "freemium", "paid"] as const).map((p) => (
            <button
              key={p}
              onClick={() => { setPricing(p); resetPage(); }}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition ${pricing === p ? "border-violet-500/60 bg-violet-500/20 text-violet-300" : "border-white/8 bg-white/4 text-slate-400 hover:text-white"}`}
            >
              {p === "" ? "كل الأسعار" : p === "free" ? "مجاني" : p === "freemium" ? "مجاني + مدفوع" : "مدفوع"}
            </button>
          ))}
          <div className="h-4 w-px bg-white/10" />
          <button
            onClick={() => { setArabicOnly(!arabicOnly); resetPage(); }}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition ${arabicOnly ? "border-teal-500/60 bg-teal-500/15 text-teal-400" : "border-white/8 bg-white/4 text-slate-400 hover:text-white"}`}
          >
            يدعم العربية
          </button>
          <button
            onClick={() => { setApiOnly(!apiOnly); resetPage(); }}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition ${apiOnly ? "border-blue-500/60 bg-blue-500/15 text-blue-400" : "border-white/8 bg-white/4 text-slate-400 hover:text-white"}`}
          >
            له API
          </button>
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => { setCat(""); resetPage(); }}
            className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition ${cat === "" ? "border-violet-500/60 bg-violet-500/20 text-violet-300" : "border-white/8 bg-white/4 text-slate-400 hover:text-white"}`}
          >
            الكل ({allTools.length})
          </button>
          {categories.map((c) => (
            <button
              key={c.value}
              onClick={() => { setCat(c.value); resetPage(); }}
              className={`shrink-0 flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-medium transition ${cat === c.value ? "border-violet-500/60 bg-violet-500/20 text-violet-300" : "border-white/8 bg-white/4 text-slate-400 hover:text-white"}`}
            >
              <span>{c.icon}</span>
              <span>{c.labelAr}</span>
              <span className="text-slate-600">({c.count})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Results count */}
      <p className="mb-4 text-xs text-slate-500">{filtered.length.toLocaleString("ar-EG")} نتيجة</p>

      {/* Grid */}
      {slice.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-slate-500">
          <div className="mb-3 text-4xl">🔍</div>
          <p className="font-semibold">لا توجد أدوات مطابقة</p>
          <button onClick={() => { setQ(""); setCat(""); setPricing(""); setArabicOnly(false); setApiOnly(false); resetPage(); }} className="mt-4 text-xs text-violet-400 hover:text-violet-300">
            إعادة تعيين الفلاتر
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {slice.map((t) => <ToolCard key={t.slug} tool={t} />)}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-2">
          <button disabled={page === 1} onClick={() => setPage(page - 1)} className="rounded-lg border border-white/8 bg-white/4 px-3 py-1.5 text-sm text-slate-400 disabled:opacity-30 hover:text-white transition">السابق</button>
          <span className="text-sm text-slate-500">{page} / {totalPages}</span>
          <button disabled={page === totalPages} onClick={() => setPage(page + 1)} className="rounded-lg border border-white/8 bg-white/4 px-3 py-1.5 text-sm text-slate-400 disabled:opacity-30 hover:text-white transition">التالي</button>
        </div>
      )}
    </div>
  );
}
