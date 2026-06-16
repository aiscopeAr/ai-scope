"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { RefreshCw, ExternalLink, Pencil, Plus } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";

type ReviewRow = {
  id: string;
  titleAr: string;
  slug: string;
  authorSlug: string;
  published: boolean;
  publishedAt: string | null;
  viewCount: number;
  category: { nameAr: string; slug: string };
  createdAt: string;
};

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "published" | "draft">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/reviews");
    const data = await res.json() as ReviewRow[];
    setReviews(data);
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  // Derive unique categories from loaded reviews
  const categories = Array.from(
    new Map(reviews.map((r) => [r.category.slug, r.category.nameAr])).entries()
  );

  const filtered = reviews.filter((r) => {
    if (filter === "published" && !r.published) return false;
    if (filter === "draft" && r.published) return false;
    if (categoryFilter !== "all" && r.category.slug !== categoryFilter) return false;
    return true;
  });

  return (
    <div className="p-6" dir="rtl">
      <div className="mb-5 flex items-center gap-3">
        <h1 className="text-xl font-bold text-slate-900 flex-1">التقارير</h1>
        <Link
          href="/admin/reviews/new"
          className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4" />
          مقال جديد
        </Link>
        <button onClick={load} className="rounded-xl bg-slate-100 p-2 hover:bg-slate-200">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Status filter */}
      <div className="mb-3 flex gap-2">
        {(["all", "published", "draft"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${filter === f ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
          >
            {{ all: "الكل", published: "منشورة", draft: "مسودات" }[f]}
            <span className="mr-1.5 opacity-60">
              {{ all: reviews.length, published: reviews.filter((r) => r.published).length, draft: reviews.filter((r) => !r.published).length }[f]}
            </span>
          </button>
        ))}
      </div>

      {/* Category filter */}
      <div className="mb-5 flex flex-wrap gap-2">
        <button
          onClick={() => setCategoryFilter("all")}
          className={`rounded-full px-3 py-1 text-xs font-semibold transition ${categoryFilter === "all" ? "bg-slate-700 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}
        >
          كل التصنيفات
        </button>
        {categories.map(([slug, nameAr]) => (
          <button
            key={slug}
            onClick={() => setCategoryFilter(slug)}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition ${categoryFilter === slug ? "bg-slate-700 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}
          >
            {nameAr}
            <span className="mr-1 opacity-50">
              {reviews.filter((r) => r.category.slug === slug).length}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-slate-400">جارٍ التحميل...</p>
      ) : filtered.length === 0 ? (
        <p className="text-slate-400">لا توجد تقارير</p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-xs font-bold text-slate-500">
              <tr>
                <th className="px-4 py-3 text-right">العنوان</th>
                <th className="px-4 py-3 text-right">الكاتب</th>
                <th className="px-4 py-3 text-right">التصنيف</th>
                <th className="px-4 py-3 text-right">الحالة</th>
                <th className="px-4 py-3 text-right">المشاهدات</th>
                <th className="px-4 py-3 text-right">التاريخ</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="max-w-xs px-4 py-3">
                    <p className="truncate font-semibold text-slate-800">{r.titleAr}</p>
                    <p className="text-[11px] font-mono text-slate-400" dir="ltr">{r.slug}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{r.authorSlug}</td>
                  <td className="px-4 py-3 text-slate-600">{r.category.nameAr}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${r.published ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                      {r.published ? "منشورة" : "مسودة"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{r.viewCount.toLocaleString("ar-EG")}</td>
                  <td className="px-4 py-3 text-slate-400 text-xs">
                    {r.publishedAt
                      ? formatDistanceToNow(new Date(r.publishedAt), { addSuffix: true, locale: ar })
                      : formatDistanceToNow(new Date(r.createdAt), { addSuffix: true, locale: ar })}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Link href={`/admin/reviews/${r.id}`} className="rounded-lg p-1.5 hover:bg-slate-100">
                        <Pencil className="h-3.5 w-3.5 text-slate-500" />
                      </Link>
                      {r.published && (
                        <a href={`/reviews/${r.slug}`} target="_blank" rel="noopener noreferrer" className="rounded-lg p-1.5 hover:bg-slate-100">
                          <ExternalLink className="h-3.5 w-3.5 text-slate-500" />
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
