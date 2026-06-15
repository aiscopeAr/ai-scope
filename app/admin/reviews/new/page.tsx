"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Save } from "lucide-react";

type Category = { id: string; nameAr: string };

const inp = "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 placeholder:text-slate-300";
const sel = "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20";
const lbl = "mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-400";

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-").replace(/-+/g, "-").slice(0, 80);
}

export default function NewReviewPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    titleAr: "",
    slug: "",
    summary: "",
    content: "",
    authorSlug: "zayd",
    categoryId: "",
    seoTitle: "",
    seoDescription: "",
    imageUrl: "",
    imageAlt: "",
    tags: "",
    keywords: "",
    published: false,
  });

  useEffect(() => {
    fetch("/api/admin/categories")
      .then((r) => r.json())
      .then((data: Category[]) => {
        setCategories(data);
        if (data.length > 0) setForm((f) => ({ ...f, categoryId: data[0].id }));
      })
      .catch(() => {});
  }, []);

  // Auto-generate slug from title
  function handleTitleChange(val: string) {
    setForm((f) => ({
      ...f,
      titleAr: val,
      slug: f.slug === "" || f.slug === slugify(f.titleAr) ? slugify(val) : f.slug,
      seoTitle: f.seoTitle === "" || f.seoTitle === f.titleAr ? val.slice(0, 60) : f.seoTitle,
    }));
  }

  async function handleSave() {
    if (!form.titleAr || !form.slug || !form.categoryId) {
      setError("العنوان والرابط والتصنيف مطلوبة");
      return;
    }
    setSaving(true);
    setError("");

    const res = await fetch("/api/admin/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        titleAr: form.titleAr,
        slug: form.slug,
        summary: form.summary,
        content: form.content,
        authorSlug: form.authorSlug,
        categoryId: form.categoryId,
        seoTitle: form.seoTitle || form.titleAr,
        seoDescription: form.seoDescription || form.summary,
        imageUrl: form.imageUrl || undefined,
        imageAlt: form.imageAlt || undefined,
        tags: form.tags ? form.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
        keywords: form.keywords ? form.keywords.split(",").map((k) => k.trim()).filter(Boolean) : [],
        published: form.published,
      }),
    });

    const data = await res.json() as { id?: string; error?: string };
    setSaving(false);

    if (!res.ok) {
      setError(data.error ?? "حدث خطأ");
      return;
    }

    router.push(`/admin/reviews/${data.id}`);
  }

  return (
    <div className="p-6" dir="rtl">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <Link href="/admin/reviews" className="rounded-xl p-2 hover:bg-slate-100">
          <ArrowRight className="h-4 w-4 text-slate-500" />
        </Link>
        <h1 className="text-xl font-bold text-slate-900 flex-1">مقال جديد</h1>
        <button
          onClick={() => setForm((f) => ({ ...f, published: !f.published }))}
          className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${form.published ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}
        >
          {form.published ? "سينشر مباشرة" : "مسودة"}
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {saving ? "جارٍ الحفظ..." : "حفظ"}
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 border border-red-200">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="space-y-5 lg:col-span-2">
          <div>
            <label className={lbl}>العنوان *</label>
            <input
              className={inp}
              placeholder="عنوان المقال بالعربية"
              value={form.titleAr}
              onChange={(e) => handleTitleChange(e.target.value)}
              dir="rtl"
            />
          </div>

          <div>
            <label className={lbl}>الرابط (Slug) *</label>
            <input
              className={inp}
              placeholder="english-slug-here"
              value={form.slug}
              onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
              dir="ltr"
            />
          </div>

          <div>
            <label className={lbl}>الملخص (2-3 جمل)</label>
            <textarea
              className={inp}
              rows={3}
              placeholder="ملخص قصير يظهر في قوائم المقالات..."
              value={form.summary}
              onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))}
              dir="rtl"
            />
          </div>

          <div>
            <label className={lbl}>المحتوى (Markdown)</label>
            <textarea
              className={`${inp} font-mono text-xs`}
              rows={20}
              placeholder="## مقدمة&#10;&#10;اكتب المحتوى هنا بتنسيق Markdown..."
              value={form.content}
              onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
              dir="rtl"
            />
          </div>

          {/* SEO */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="mb-4 text-sm font-bold text-slate-700">SEO</h2>
            <div className="space-y-4">
              <div>
                <label className={lbl}>عنوان SEO (50-60 حرف)</label>
                <input className={inp} value={form.seoTitle} onChange={(e) => setForm((f) => ({ ...f, seoTitle: e.target.value }))} dir="rtl" />
                <p className="mt-1 text-xs text-slate-400">{form.seoTitle.length} / 60</p>
              </div>
              <div>
                <label className={lbl}>وصف SEO (140-160 حرف)</label>
                <textarea className={inp} rows={3} value={form.seoDescription} onChange={(e) => setForm((f) => ({ ...f, seoDescription: e.target.value }))} dir="rtl" />
                <p className="mt-1 text-xs text-slate-400">{form.seoDescription.length} / 160</p>
              </div>
              <div>
                <label className={lbl}>الكلمات المفتاحية (فاصلة بين كل كلمة)</label>
                <input className={inp} placeholder="ChatGPT, الذكاء الاصطناعي, دليل" value={form.keywords} onChange={(e) => setForm((f) => ({ ...f, keywords: e.target.value }))} dir="rtl" />
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="mb-4 text-sm font-bold text-slate-700">التصنيف والكاتب</h2>
            <div className="space-y-4">
              <div>
                <label className={lbl}>الكاتب *</label>
                <select className={sel} value={form.authorSlug} onChange={(e) => setForm((f) => ({ ...f, authorSlug: e.target.value }))}>
                  <option value="zayd">زيد — محلل النماذج</option>
                  <option value="lina">لينا — مراسلة الشركات</option>
                  <option value="tariq">طارق — محلل الأدوات</option>
                  <option value="team">طاقم لوميك — شروحات</option>
                </select>
              </div>
              <div>
                <label className={lbl}>التصنيف *</label>
                <select className={sel} value={form.categoryId} onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.nameAr}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={lbl}>الوسوم (فاصلة بين كل وسم)</label>
                <input className={inp} placeholder="ChatGPT, OpenAI, دليل" value={form.tags} onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))} dir="rtl" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="mb-4 text-sm font-bold text-slate-700">الصورة</h2>
            <div className="space-y-4">
              <div>
                <label className={lbl}>رابط الصورة (URL)</label>
                <input className={inp} placeholder="https://images.unsplash.com/..." value={form.imageUrl} onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))} dir="ltr" />
              </div>
              {form.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={form.imageUrl} alt="preview" className="w-full rounded-xl object-cover h-32" />
              )}
              <div>
                <label className={lbl}>وصف الصورة (Alt)</label>
                <input className={inp} value={form.imageAlt} onChange={(e) => setForm((f) => ({ ...f, imageAlt: e.target.value }))} dir="rtl" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
