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

  const filterBtn = (active: boolean, label: string, onClick: () => void, activeStyle?: { color: string; bg: string; border: string }) => (
    <button
      onClick={onClick}
      className="rounded-[6px] border px-3 py-1 text-xs font-medium transition"
      style={active
        ? { borderColor: activeStyle?.border ?? "var(--accent)", backgroundColor: activeStyle?.bg ?? "var(--accent-bg)", color: activeStyle?.color ?? "var(--accent)" }
        : { borderColor: "var(--border-medium)", backgroundColor: "transparent", color: "var(--text-secondary)" }
      }
    >
      {label}
    </button>
  );

  return (
    <div>
      {/* Search + filters */}
      <div className="mb-6 space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" style={{ color: "var(--text-muted)" }} />
          <input
            type="search"
            placeholder="ابحث عن أداة..."
            value={q}
            onChange={(e) => { setQ(e.target.value); resetPage(); }}
            className="w-full rounded-[6px] border py-2.5 pr-10 pl-4 text-sm transition focus:outline-none"
            style={{ borderColor: "var(--border-medium)", backgroundColor: "var(--bg-surface)", color: "var(--text-primary)" }}
            onFocus={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--accent)"; }}
            onBlur={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border-medium)"; }}
            dir="rtl"
          />
        </div>

        {/* Filter row */}
        <div className="flex flex-wrap items-center gap-2">
          {(["", "free", "freemium", "paid"] as const).map((p) =>
            filterBtn(pricing === p, p === "" ? "كل الأسعار" : p === "free" ? "مجاني" : p === "freemium" ? "مجاني + مدفوع" : "مدفوع", () => { setPricing(p); resetPage(); })
          )}
          <div className="h-4 w-px" style={{ backgroundColor: "var(--border-medium)" }} />
          {filterBtn(arabicOnly, "يدعم العربية", () => { setArabicOnly(!arabicOnly); resetPage(); }, { color: "#0d9488", bg: "#f0fdfa", border: "#99f6e4" })}
          {filterBtn(apiOnly, "له API", () => { setApiOnly(!apiOnly); resetPage(); }, { color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe" })}
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => { setCat(""); resetPage(); }}
            className="shrink-0 rounded-[6px] border px-3 py-1.5 text-xs font-medium transition"
            style={{
              borderColor: cat === "" ? "var(--accent)" : "var(--border-medium)",
              backgroundColor: cat === "" ? "var(--accent-bg)" : "transparent",
              color: cat === "" ? "var(--accent)" : "var(--text-secondary)",
            }}
          >
            الكل ({allTools.length})
          </button>
          {categories.map((c) => (
            <button
              key={c.value}
              onClick={() => { setCat(c.value); resetPage(); }}
              className="shrink-0 flex items-center gap-1 rounded-[6px] border px-3 py-1.5 text-xs font-medium transition"
              style={{
                borderColor: cat === c.value ? "var(--accent)" : "var(--border-medium)",
                backgroundColor: cat === c.value ? "var(--accent-bg)" : "transparent",
                color: cat === c.value ? "var(--accent)" : "var(--text-secondary)",
              }}
            >
              <span>{c.icon}</span>
              <span>{c.labelAr}</span>
              <span style={{ color: "var(--text-muted)" }}>({c.count})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Results count */}
      <p className="mb-4 text-xs" style={{ color: "var(--text-muted)" }}>{filtered.length.toLocaleString("ar-EG")} نتيجة</p>

      {/* Grid */}
      {slice.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24" style={{ color: "var(--text-muted)" }}>
          <div className="mb-3 text-4xl">🔍</div>
          <p className="font-semibold">لا توجد أدوات مطابقة</p>
          <button
            onClick={() => { setQ(""); setCat(""); setPricing(""); setArabicOnly(false); setApiOnly(false); resetPage(); }}
            className="mt-4 text-xs transition"
            style={{ color: "var(--accent)" }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = "0.7"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
          >
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
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="rounded-[6px] border px-3 py-1.5 text-sm transition disabled:opacity-30"
            style={{ borderColor: "var(--border-medium)", color: "var(--text-secondary)", backgroundColor: "var(--bg-surface)" }}
          >السابق</button>
          <span className="text-sm" style={{ color: "var(--text-muted)" }}>{page} / {totalPages}</span>
          <button
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
            className="rounded-[6px] border px-3 py-1.5 text-sm transition disabled:opacity-30"
            style={{ borderColor: "var(--border-medium)", color: "var(--text-secondary)", backgroundColor: "var(--bg-surface)" }}
          >التالي</button>
        </div>
      )}
    </div>
  );
}
