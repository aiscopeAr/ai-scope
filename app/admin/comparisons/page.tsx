"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Eye, Trash2, CheckCircle, XCircle, ExternalLink } from "lucide-react";

interface Comparison {
  id: string;
  slug: string;
  title: string;
  published: boolean;
  updatedAt: string;
  sides: { tool: { name: string; logoUrl: string | null } }[];
}

export default function AdminComparisonsPage() {
  const [comparisons, setComparisons] = useState<Comparison[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/comparisons")
      .then((r) => r.json())
      .then((data) => { setComparisons(data.comparisons ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  async function togglePublish(id: string, current: boolean) {
    await fetch(`/api/admin/comparisons/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ published: !current }),
    });
    setComparisons((prev) =>
      prev.map((c) => (c.id === id ? { ...c, published: !current } : c))
    );
  }

  async function deleteComparison(id: string) {
    if (!confirm("حذف هذه المقارنة؟")) return;
    await fetch(`/api/admin/comparisons/${id}`, { method: "DELETE" });
    setComparisons((prev) => prev.filter((c) => c.id !== id));
  }

  const published = comparisons.filter((c) => c.published).length;
  const drafts = comparisons.filter((c) => !c.published).length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">المقارنات</h1>
          <p className="text-sm text-slate-500 mt-1">
            {published} منشورة · {drafts} مسودة · {comparisons.length} إجمالاً
          </p>
        </div>
        <Link
          href="/admin/comparisons/new"
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition"
        >
          <Plus className="h-4 w-4" />
          مقارنة جديدة
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "إجمالي المقارنات", value: comparisons.length, color: "text-slate-800" },
          { label: "منشورة", value: published, color: "text-green-600" },
          { label: "مسودات", value: drafts, color: "text-amber-600" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-slate-200 bg-white p-4 text-center shadow-sm">
            <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-slate-400">جاري التحميل…</div>
        ) : comparisons.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="text-4xl mb-3">⚖️</div>
            <p className="text-slate-600 font-semibold">لا توجد مقارنات بعد</p>
            <p className="text-slate-400 text-sm mt-1">أنشئ أول مقارنة بين أدوات AI</p>
            <Link
              href="/admin/comparisons/new"
              className="mt-4 flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition"
            >
              <Plus className="h-4 w-4" />
              مقارنة جديدة
            </Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-slate-100 bg-slate-50">
              <tr>
                <th className="px-5 py-3 text-right font-semibold text-slate-600">المقارنة</th>
                <th className="px-5 py-3 text-right font-semibold text-slate-600">الأدوات</th>
                <th className="px-5 py-3 text-right font-semibold text-slate-600">الحالة</th>
                <th className="px-5 py-3 text-right font-semibold text-slate-600">آخر تحديث</th>
                <th className="px-5 py-3 text-right font-semibold text-slate-600">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {comparisons.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50 transition">
                  <td className="px-5 py-3">
                    <p className="font-semibold text-slate-800 line-clamp-1">{c.title}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{c.slug}</p>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex flex-wrap gap-1">
                      {c.sides.map((s, i) => (
                        <span key={i} className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                          {s.tool.name}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <button
                      onClick={() => togglePublish(c.id, c.published)}
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition ${
                        c.published
                          ? "bg-green-100 text-green-700 hover:bg-green-200"
                          : "bg-amber-100 text-amber-700 hover:bg-amber-200"
                      }`}
                    >
                      {c.published
                        ? <><CheckCircle className="h-3 w-3" /> منشورة</>
                        : <><XCircle className="h-3 w-3" /> مسودة</>
                      }
                    </button>
                  </td>
                  <td className="px-5 py-3 text-slate-400 text-xs">
                    {new Date(c.updatedAt).toLocaleDateString("ar-SA")}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/comparisons/${c.id}/edit`}
                        className="rounded-md p-1.5 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition"
                        title="تعديل"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                      {c.published && (
                        <a
                          href={`/compare/${c.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                          title="عرض"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                      <button
                        onClick={() => deleteComparison(c.id)}
                        className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 transition"
                        title="حذف"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
