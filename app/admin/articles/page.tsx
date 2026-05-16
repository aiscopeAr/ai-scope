"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Plus, Search, Pencil, Trash2, ChevronUp, ChevronDown, ChevronsUpDown, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import type { ArticleWithCategory } from "@/types/articles";

type SortField = "createdAt" | "publishedAt" | "title" | "titleAr" | "score" | "viewCount";
type SortOrder = "asc" | "desc";

function SortIcon({ field, current, order }: { field: SortField; current: SortField; order: SortOrder }) {
  if (field !== current) return <ChevronsUpDown className="size-3.5 text-slate-400" />;
  return order === "asc" ? <ChevronUp className="size-3.5 text-[#667eea]" /> : <ChevronDown className="size-3.5 text-[#667eea]" />;
}

export default function AdminArticlesPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [articles, setArticles] = React.useState<ArticleWithCategory[]>([]);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState<"" | "published" | "draft">("");
  const [sortBy, setSortBy] = React.useState<SortField>("createdAt");
  const [sortOrder, setSortOrder] = React.useState<SortOrder>("desc");
  const [page, setPage] = React.useState(1);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  const limit = 20;

  const fetchArticles = React.useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      search,
      sortBy,
      sortOrder,
      page: String(page),
      limit: String(limit),
      ...(status ? { status } : {}),
    });
    try {
      const res = await fetch(`/api/admin/articles?${params}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setArticles(data.articles);
      setTotal(data.total);
    } catch {
      toast("فشل تحميل المقالات", "error");
    } finally {
      setLoading(false);
    }
  }, [search, sortBy, sortOrder, page, status, toast]);

  React.useEffect(() => {
    const t = setTimeout(() => fetchArticles(), search ? 400 : 0);
    return () => clearTimeout(t);
  }, [fetchArticles, search]);

  function handleSort(field: SortField) {
    if (sortBy === field) {
      setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
    setPage(1);
  }

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/articles/${deleteId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast("تم حذف المقال بنجاح");
      setDeleteId(null);
      fetchArticles();
    } catch {
      toast("فشل حذف المقال", "error");
    } finally {
      setDeleting(false);
    }
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="container mx-auto px-4 py-8" dir="rtl">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 rounded-[2rem] bg-white p-6 shadow-lg shadow-slate-200/60 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="mb-2 text-sm font-semibold text-[#667eea]">لوحة الإدارة</p>
          <h1 className="text-3xl font-black text-slate-900">إدارة المقالات</h1>
          <p className="mt-1 text-slate-500">{total} مقال في قاعدة البيانات</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/admin" className="rounded-2xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200">
            الرئيسية
          </Link>
          <Link href="/admin/articles/new">
            <Button className="gap-2 rounded-2xl bg-[#667eea] px-5 py-2 text-white hover:bg-[#5a6fd6]">
              <Plus className="size-4" />
              مقال جديد
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap items-center gap-3 rounded-[1.75rem] bg-white p-4 shadow-md shadow-slate-200/60">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="بحث بالعنوان..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pr-9 pl-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-[#667eea] focus:outline-none"
          />
        </div>
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value as "" | "published" | "draft"); setPage(1); }}
          className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-[#667eea] focus:outline-none"
        >
          <option value="">الكل</option>
          <option value="published">منشور</option>
          <option value="draft">مسودة</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-[2rem] bg-white shadow-lg shadow-slate-200/60 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="size-8 animate-spin text-[#667eea]" />
          </div>
        ) : articles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-500">
            <p className="text-lg font-semibold">لا توجد مقالات</p>
            <p className="mt-1 text-sm">أنشئ مقالك الأول الآن</p>
            <Link href="/admin/articles/new" className="mt-4">
              <Button className="gap-2 rounded-2xl bg-[#667eea] text-white hover:bg-[#5a6fd6]">
                <Plus className="size-4" />
                مقال جديد
              </Button>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50">
                <tr className="text-right text-xs text-slate-500">
                  <th className="px-5 py-4 font-semibold">
                    <button className="flex items-center gap-1" onClick={() => handleSort("titleAr")}>
                      العنوان <SortIcon field="titleAr" current={sortBy} order={sortOrder} />
                    </button>
                  </th>
                  <th className="px-4 py-4 font-semibold">التصنيف</th>
                  <th className="px-4 py-4 font-semibold">المصدر</th>
                  <th className="px-4 py-4 font-semibold">الحالة</th>
                  <th className="px-4 py-4 font-semibold">
                    <button className="flex items-center gap-1" onClick={() => handleSort("publishedAt")}>
                      تاريخ النشر <SortIcon field="publishedAt" current={sortBy} order={sortOrder} />
                    </button>
                  </th>
                  <th className="px-4 py-4 font-semibold">
                    <button className="flex items-center gap-1" onClick={() => handleSort("viewCount")}>
                      المشاهدات <SortIcon field="viewCount" current={sortBy} order={sortOrder} />
                    </button>
                  </th>
                  <th className="px-4 py-4 font-semibold">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {articles.map((article) => (
                  <tr key={article.id} className="text-sm text-slate-700 hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-4 max-w-[280px]">
                      <p className="font-semibold text-slate-900 line-clamp-1">{article.titleAr}</p>
                      <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{article.title}</p>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="rounded-full bg-[#667eea]/10 px-2.5 py-1 text-xs font-medium text-[#667eea]">
                        {article.category.nameAr}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-slate-500 whitespace-nowrap max-w-[120px] truncate">
                      {article.sourceName}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${
                          article.published ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {article.published ? "منشور" : "مسودة"}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-slate-500">
                      {article.publishedAt ? format(new Date(article.publishedAt), "yyyy-MM-dd") : "—"}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-slate-700 font-medium">
                      {article.viewCount.toLocaleString("ar-EG")}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => router.push(`/admin/articles/${article.id}/edit`)}
                          className="rounded-xl bg-slate-100 p-2 text-slate-600 hover:bg-[#667eea]/10 hover:text-[#667eea] transition-colors"
                          title="تعديل"
                        >
                          <Pencil className="size-4" />
                        </button>
                        <button
                          onClick={() => setDeleteId(article.id)}
                          className="rounded-xl bg-slate-100 p-2 text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors"
                          title="حذف"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4">
            <p className="text-sm text-slate-500">
              صفحة {page} من {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="rounded-xl border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                السابق
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-xl border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                التالي
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" dir="rtl">
          <div className="w-full max-w-md rounded-[2rem] bg-white p-8 shadow-2xl">
            <h2 className="text-xl font-black text-slate-900">تأكيد الحذف</h2>
            <p className="mt-3 text-slate-600">هل أنت متأكد من حذف هذا المقال؟ لا يمكن التراجع عن هذا الإجراء.</p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => setDeleteId(null)}
                disabled={deleting}
                className="rounded-2xl bg-slate-100 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-200 disabled:opacity-50"
              >
                إلغاء
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center gap-2 rounded-2xl bg-red-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-50"
              >
                {deleting && <Loader2 className="size-4 animate-spin" />}
                حذف المقال
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
