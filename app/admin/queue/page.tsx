"use client";
import { useState, useEffect, useCallback } from "react";
import { RefreshCw, Check, X, RotateCcw, ChevronDown, ChevronUp, Trash2 } from "lucide-react";

type NewsItemSnippet = { id: string; title: string; sourceName: string; sourceUrl: string };

type QueueItem = {
  id: string;
  topic: string;
  authorSlug: string;
  status: string;
  titleAr: string | null;
  summaryAr: string | null;
  contentAr: string | null;
  tags: string[];
  seoTitle: string | null;
  seoDescription: string | null;
  slug: string | null;
  failureReason: string | null;
  retryCount: number;
  processedAt: string | null;
  createdAt: string;
  newsItems: NewsItemSnippet[];
};

type Category = { id: string; nameAr: string; slug: string };

const STATUS_COLORS: Record<string, string> = {
  pending:    "bg-amber-100 text-amber-700",
  processing: "bg-sky-100 text-sky-700",
  processed:  "bg-violet-100 text-violet-700",
  approved:   "bg-emerald-100 text-emerald-700",
  rejected:   "bg-slate-100 text-slate-500",
  failed:     "bg-red-100 text-red-700",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "معلّق", processing: "قيد المعالجة", processed: "جاهز",
  approved: "تمت الموافقة", rejected: "مرفوض", failed: "فشل",
};

export default function AdminQueuePage() {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [approving, setApproving] = useState<string | null>(null);
  // per-item override state
  const [overrides, setOverrides] = useState<Record<string, { categoryId: string; slug: string; published: boolean }>>({});

  const load = useCallback(async () => {
    setLoading(true);
    const [qRes, cRes] = await Promise.all([
      fetch("/api/admin/queue"),
      fetch("/api/admin/categories"),
    ]);
    const qData = await qRes.json() as QueueItem[];
    const cData = await cRes.json() as Category[];
    setItems(qData);
    setCategories(cData);
    // Initialize overrides for processed items
    const init: Record<string, { categoryId: string; slug: string; published: boolean }> = {};
    for (const item of qData) {
      if (item.status === "processed") {
        init[item.id] = {
          categoryId: cData[0]?.id ?? "",
          slug: item.slug ?? "",
          published: true,
        };
      }
    }
    setOverrides((prev) => ({ ...init, ...prev }));
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function doAction(id: string, action: string, extra?: Record<string, unknown>) {
    setApproving(id);
    await fetch(`/api/admin/queue/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...extra }),
    });
    await load();
    setApproving(null);
  }

  async function deleteItem(id: string) {
    if (!confirm("حذف هذا العنصر نهائياً؟")) return;
    setApproving(id);
    await fetch(`/api/admin/queue/${id}`, { method: "DELETE" });
    setItems((p) => p.filter((i) => i.id !== id));
    setApproving(null);
  }

  const filtered = filter === "all" ? items : items.filter((i) => i.status === filter);

  return (
    <div className="p-6" dir="rtl">
      <div className="mb-5 flex items-center gap-3">
        <h1 className="text-xl font-bold text-slate-900 flex-1">طابور التقارير</h1>
        <button onClick={load} className="rounded-xl bg-slate-100 p-2 hover:bg-slate-200">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Filter tabs */}
      <div className="mb-6 flex flex-wrap gap-2">
        {["all", "pending", "processing", "processed", "failed", "approved", "rejected"].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${filter === s ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
          >
            {s === "all" ? "الكل" : STATUS_LABELS[s]}
            <span className="mr-1.5 opacity-60">
              {s === "all" ? items.length : items.filter((i) => i.status === s).length}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-slate-400">جارٍ التحميل...</p>
      ) : filtered.length === 0 ? (
        <p className="text-slate-400">لا توجد عناصر</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => {
            const isExpanded = expanded === item.id;
            const ov = overrides[item.id] ?? { categoryId: categories[0]?.id ?? "", slug: item.slug ?? "", published: true };

            return (
              <div key={item.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                {/* Header row */}
                <div className="flex items-start gap-3 p-4">
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${STATUS_COLORS[item.status] ?? "bg-slate-100 text-slate-500"}`}>
                        {STATUS_LABELS[item.status] ?? item.status}
                      </span>
                      <span className="text-xs text-slate-400">{item.authorSlug}</span>
                      <span className="text-xs text-slate-400">{item.newsItems.length} مصدر</span>
                    </div>
                    <p className="font-bold text-slate-800">{item.titleAr ?? item.topic}</p>
                    {item.summaryAr && <p className="mt-1 line-clamp-2 text-sm text-slate-500">{item.summaryAr}</p>}
                    {item.failureReason && <p className="mt-1 text-xs text-red-500">{item.failureReason}</p>}
                  </div>
                  <button onClick={() => setExpanded(isExpanded ? null : item.id)} className="shrink-0 rounded-xl bg-slate-100 p-1.5 hover:bg-slate-200">
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                </div>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="border-t border-slate-100 p-4 space-y-4">
                    {/* Sources */}
                    <div>
                      <p className="mb-2 text-xs font-bold text-slate-500">المصادر</p>
                      <ul className="space-y-1">
                        {item.newsItems.map((n) => (
                          <li key={n.id} className="flex items-center gap-2 text-sm">
                            <span className="text-slate-400">{n.sourceName}</span>
                            <a href={n.sourceUrl} target="_blank" rel="noopener noreferrer" className="truncate text-violet-500 hover:underline">{n.title}</a>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Content preview */}
                    {item.contentAr && (
                      <div>
                        <p className="mb-2 text-xs font-bold text-slate-500">معاينة المحتوى</p>
                        <div className="max-h-64 overflow-y-auto rounded-xl bg-slate-50 p-3 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                          {item.contentAr.slice(0, 1200)}{item.contentAr.length > 1200 ? "…" : ""}
                        </div>
                      </div>
                    )}

                    {/* Approve controls (processed items only) */}
                    {item.status === "processed" && (
                      <div className="rounded-xl border border-violet-200 bg-violet-50 p-4 space-y-3">
                        <p className="text-sm font-bold text-violet-700">إعدادات النشر</p>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div>
                            <label className="mb-1 block text-xs font-semibold text-slate-600">الرابط (slug)</label>
                            <input
                              value={ov.slug}
                              onChange={(e) => setOverrides((p) => ({ ...p, [item.id]: { ...ov, slug: e.target.value } }))}
                              className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-mono"
                              dir="ltr"
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-xs font-semibold text-slate-600">التصنيف</label>
                            <select
                              value={ov.categoryId}
                              onChange={(e) => setOverrides((p) => ({ ...p, [item.id]: { ...ov, categoryId: e.target.value } }))}
                              className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm"
                            >
                              {categories.map((c) => (
                                <option key={c.id} value={c.id}>{c.nameAr}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={ov.published}
                            onChange={(e) => setOverrides((p) => ({ ...p, [item.id]: { ...ov, published: e.target.checked } }))}
                          />
                          نشر فوراً
                        </label>
                        <div className="flex gap-2">
                          <button
                            onClick={() => doAction(item.id, "approve", ov)}
                            disabled={!ov.slug || !ov.categoryId || approving === item.id}
                            className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-600 disabled:opacity-50"
                          >
                            <Check className="h-4 w-4" /> موافقة ونشر
                          </button>
                          <button
                            onClick={() => doAction(item.id, "reject")}
                            className="flex items-center gap-1.5 rounded-xl bg-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-300"
                          >
                            <X className="h-4 w-4" /> رفض
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Retry / Delete for failed or rejected */}
                    {(item.status === "failed" || item.status === "rejected") && (
                      <div className="flex gap-2">
                        {item.status === "failed" && (
                          <button
                            onClick={() => doAction(item.id, "retry")}
                            disabled={approving === item.id}
                            className="flex items-center gap-1.5 rounded-xl bg-amber-100 px-4 py-2 text-sm font-bold text-amber-700 hover:bg-amber-200 disabled:opacity-50"
                          >
                            <RotateCcw className="h-4 w-4" /> إعادة المحاولة
                          </button>
                        )}
                        <button
                          onClick={() => deleteItem(item.id)}
                          disabled={approving === item.id}
                          className="flex items-center gap-1.5 rounded-xl bg-red-50 px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-100 disabled:opacity-50"
                        >
                          <Trash2 className="h-4 w-4" /> حذف
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
