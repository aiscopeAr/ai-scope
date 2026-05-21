"use client";
import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Save, Eye, Trash2 } from "lucide-react";

type Category = { id: string; nameAr: string };
type ReviewDetail = {
  id: string;
  titleAr: string;
  slug: string;
  summary: string;
  content: string;
  authorSlug: string;
  categoryId: string;
  tags: string[];
  keywords: string[];
  imageUrl: string | null;
  imageAlt: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  published: boolean;
};

export default function ReviewEditorPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [review, setReview] = useState<ReviewDetail | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    const [rRes, cRes] = await Promise.all([
      fetch(`/api/admin/reviews/${id}`),
      fetch("/api/admin/categories"),
    ]);
    setReview(await rRes.json() as ReviewDetail);
    setCategories(await cRes.json() as Category[]);
  }, [id]);

  useEffect(() => { void load(); }, [load]);

  async function save() {
    if (!review) return;
    setSaving(true);
    await fetch(`/api/admin/reviews/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(review),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function del() {
    if (!confirm("حذف هذه السكريفة نهائياً؟")) return;
    await fetch(`/api/admin/reviews/${id}`, { method: "DELETE" });
    router.push("/admin/reviews");
  }

  if (!review) return <div className="p-8 text-slate-400">جارٍ التحميل...</div>;

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8" dir="rtl">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/admin/reviews" className="text-slate-400 hover:text-slate-700">
          <ArrowRight className="h-5 w-5" />
        </Link>
        <h1 className="flex-1 truncate text-xl font-black text-slate-900">{review.titleAr}</h1>
        <div className="flex gap-2">
          {review.published && (
            <a href={`/reviews/${review.slug}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-200">
              <Eye className="h-4 w-4" /> معاينة
            </a>
          )}
          <button onClick={del} className="rounded-xl bg-red-50 px-3 py-1.5 text-sm font-semibold text-red-600 hover:bg-red-100">
            <Trash2 className="h-4 w-4" />
          </button>
          <button onClick={save} disabled={saving} className="flex items-center gap-1.5 rounded-xl bg-[#667eea] px-4 py-1.5 text-sm font-bold text-white hover:bg-[#5a6fd6] disabled:opacity-60">
            <Save className="h-4 w-4" /> {saving ? "جارٍ الحفظ…" : saved ? "تم الحفظ ✓" : "حفظ"}
          </button>
        </div>
      </div>

      <div className="space-y-5">
        {/* Basic fields */}
        <div className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-bold text-slate-500">العنوان بالعربية</label>
            <input value={review.titleAr} onChange={(e) => setReview({ ...review, titleAr: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-slate-500">الرابط (slug)</label>
            <input value={review.slug} onChange={(e) => setReview({ ...review, slug: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-mono" dir="ltr" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-slate-500">التصنيف</label>
            <select value={review.categoryId} onChange={(e) => setReview({ ...review, categoryId: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm">
              {categories.map((c) => <option key={c.id} value={c.id}>{c.nameAr}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-slate-500">الكاتب</label>
            <select value={review.authorSlug} onChange={(e) => setReview({ ...review, authorSlug: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm">
              <option value="zayd">زيد</option>
              <option value="lina">لينا</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="pub" checked={review.published} onChange={(e) => setReview({ ...review, published: e.target.checked })} />
            <label htmlFor="pub" className="text-sm font-semibold text-slate-700">منشورة</label>
          </div>
        </div>

        {/* Summary */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <label className="mb-2 block text-xs font-bold text-slate-500">المقدمة (2-3 جمل)</label>
          <textarea value={review.summary} onChange={(e) => setReview({ ...review, summary: e.target.value })} rows={3} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm leading-relaxed" />
        </div>

        {/* Content (Markdown) */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <label className="mb-2 block text-xs font-bold text-slate-500">المحتوى (Markdown)</label>
          <textarea value={review.content} onChange={(e) => setReview({ ...review, content: e.target.value })} rows={30} className="w-full rounded-xl border border-slate-200 px-3 py-2 font-mono text-sm leading-relaxed" dir="rtl" />
        </div>

        {/* SEO */}
        <div className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <p className="mb-3 text-xs font-bold text-slate-500">SEO</p>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-500">عنوان SEO</label>
            <input value={review.seoTitle ?? ""} onChange={(e) => setReview({ ...review, seoTitle: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-500">وصف SEO</label>
            <input value={review.seoDescription ?? ""} onChange={(e) => setReview({ ...review, seoDescription: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-500">رابط الصورة</label>
            <input value={review.imageUrl ?? ""} onChange={(e) => setReview({ ...review, imageUrl: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" dir="ltr" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-500">وصف الصورة (alt)</label>
            <input value={review.imageAlt ?? ""} onChange={(e) => setReview({ ...review, imageAlt: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-semibold text-slate-500">الوسوم (مفصولة بفاصلة)</label>
            <input
              value={review.tags.join(", ")}
              onChange={(e) => setReview({ ...review, tags: e.target.value.split(",").map((t) => t.trim()).filter(Boolean) })}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
