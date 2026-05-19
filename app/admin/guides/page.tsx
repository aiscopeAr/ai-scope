"use client";

import * as React from "react";
import { Plus, Pencil, Trash2, Loader2, BookOpen, ExternalLink } from "lucide-react";
import { useToast } from "@/components/ui/toast";

const inputCls = "w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-[#667eea] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#667eea]/20 transition";
const labelCls = "mb-1.5 block text-sm font-semibold text-slate-700";

type Guide = {
  id: string; title: string; slug: string; excerpt: string; content: string;
  category: string; difficulty: string; tags: string[]; readingTime: number | null;
  published: boolean; viewCount: number; publishedAt: string;
};

type FormState = {
  title: string; slug: string; excerpt: string; content: string;
  category: string; difficulty: string; tags: string; readingTime: string; published: boolean;
};

const empty: FormState = {
  title: "", slug: "", excerpt: "", content: "",
  category: "beginner", difficulty: "beginner", tags: "", readingTime: "", published: true,
};

const CATEGORIES = [
  { value: "beginner", label: "مبتدئ" },
  { value: "intermediate", label: "متوسط" },
  { value: "advanced", label: "متقدم" },
  { value: "tutorial", label: "شرح تفصيلي" },
  { value: "how-to", label: "كيف تفعل" },
  { value: "comparison", label: "مقارنة" },
];

function autoSlug(title: string) {
  return title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").slice(0, 60);
}

export default function AdminGuidesPage() {
  const { toast } = useToast();
  const [guides, setGuides] = React.useState<Guide[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showForm, setShowForm] = React.useState(false);
  const [editId, setEditId] = React.useState<string | null>(null);
  const [form, setForm] = React.useState<FormState>(empty);
  const [saving, setSaving] = React.useState(false);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/guides");
      if (res.ok) setGuides(await res.json());
    } catch { toast("فشل التحميل", "error"); }
    finally { setLoading(false); }
  }, [toast]);

  React.useEffect(() => { load(); }, [load]);

  function set(k: keyof FormState, v: string | boolean) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function openNew() {
    setForm(empty);
    setEditId(null);
    setShowForm(true);
  }

  function openEdit(g: Guide) {
    setForm({
      title: g.title, slug: g.slug, excerpt: g.excerpt, content: g.content,
      category: g.category, difficulty: g.difficulty,
      tags: g.tags.join("، "),
      readingTime: g.readingTime ? String(g.readingTime) : "",
      published: g.published,
    });
    setEditId(g.id);
    setShowForm(true);
  }

  async function save() {
    if (!form.title || !form.slug || !form.excerpt || !form.content) {
      toast("العنوان والـ slug والمقدمة والمحتوى مطلوبة", "error"); return;
    }
    setSaving(true);
    try {
      const url = editId ? `/api/admin/guides/${editId}` : "/api/admin/guides";
      const res = await fetch(url, {
        method: editId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          tags: form.tags.split(/[,،]/).map((t) => t.trim()).filter(Boolean),
          readingTime: form.readingTime ? Number(form.readingTime) : null,
        }),
      });
      if (!res.ok) { const e = await res.json(); toast(e.error ?? "فشل الحفظ", "error"); return; }
      toast(editId ? "تم تحديث الدليل" : "تمت إضافة الدليل");
      setShowForm(false);
      load();
    } catch { toast("فشل الحفظ", "error"); }
    finally { setSaving(false); }
  }

  async function del() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/guides/${deleteId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast("تم الحذف"); setDeleteId(null); load();
    } catch { toast("فشل الحذف", "error"); }
    finally { setDeleting(false); }
  }

  return (
    <div className="container mx-auto px-4 py-8" dir="rtl">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 rounded-[2rem] bg-white p-6 shadow-lg shadow-slate-200/60 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="mb-1 text-sm font-semibold text-[#667eea]">لوحة الإدارة</p>
          <h1 className="text-3xl font-black text-slate-900">الأدلة والشروحات</h1>
          <p className="mt-1 text-slate-500">{guides.length} دليل مسجّل</p>
        </div>
        <div className="flex gap-3">
          <a href="/admin" className="rounded-2xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200 transition">الرئيسية</a>
          <a href="/guides" target="_blank" rel="noopener" className="flex items-center gap-1.5 rounded-2xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200 transition">
            <ExternalLink className="size-3.5" /> عرض
          </a>
          <button onClick={openNew} className="flex items-center gap-2 rounded-2xl bg-[#667eea] px-5 py-2 text-sm font-semibold text-white hover:bg-[#5a6fd6] transition">
            <Plus className="size-4" /> دليل جديد
          </button>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-32"><Loader2 className="size-8 animate-spin text-[#667eea]" /></div>
      ) : guides.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[2rem] bg-white py-24 shadow-lg shadow-slate-200/60">
          <BookOpen className="size-12 text-slate-300 mb-4" />
          <p className="text-lg font-semibold text-slate-700">لا توجد أدلة بعد</p>
          <button onClick={openNew} className="mt-6 flex items-center gap-2 rounded-2xl bg-[#667eea] px-5 py-2.5 text-sm font-semibold text-white">
            <Plus className="size-4" /> أضف أول دليل
          </button>
        </div>
      ) : (
        <div className="rounded-[2rem] bg-white shadow-lg shadow-slate-200/60 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-100 bg-slate-50">
              <tr>
                <th className="px-5 py-3 text-right font-semibold text-slate-600">العنوان</th>
                <th className="px-5 py-3 text-right font-semibold text-slate-600 hidden md:table-cell">التصنيف</th>
                <th className="px-5 py-3 text-right font-semibold text-slate-600 hidden lg:table-cell">المشاهدات</th>
                <th className="px-5 py-3 text-right font-semibold text-slate-600">الحالة</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {guides.map((g) => (
                <tr key={g.id} className="hover:bg-slate-50 transition">
                  <td className="px-5 py-4">
                    <p className="font-semibold text-slate-900 line-clamp-1">{g.title}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{g.slug}</p>
                  </td>
                  <td className="px-5 py-4 hidden md:table-cell text-slate-600">{g.category}</td>
                  <td className="px-5 py-4 hidden lg:table-cell text-slate-600">{g.viewCount}</td>
                  <td className="px-5 py-4">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${g.published ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                      {g.published ? "منشور" : "مسودة"}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <a href={`/guides/${g.slug}`} target="_blank" rel="noopener" className="rounded-lg bg-slate-100 p-2 text-slate-500 hover:text-[#667eea] transition">
                        <ExternalLink className="size-4" />
                      </a>
                      <button onClick={() => openEdit(g)} className="rounded-lg bg-slate-100 p-2 text-slate-500 hover:text-[#667eea] transition">
                        <Pencil className="size-4" />
                      </button>
                      <button onClick={() => setDeleteId(g.id)} className="rounded-lg bg-slate-100 p-2 text-slate-500 hover:text-red-600 transition">
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

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 backdrop-blur-sm p-4 pt-10" dir="rtl">
          <div className="w-full max-w-2xl rounded-[2rem] bg-white p-8 shadow-2xl mb-10">
            <h2 className="mb-6 text-xl font-black text-slate-900">{editId ? "تعديل الدليل" : "دليل جديد"}</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>العنوان *</label>
                  <input value={form.title} onChange={(e) => { set("title", e.target.value); if (!editId) set("slug", autoSlug(e.target.value)); }} className={inputCls} placeholder="كيف تستخدم ChatGPT للعمل" />
                </div>
                <div>
                  <label className={labelCls}>Slug *</label>
                  <input value={form.slug} onChange={(e) => set("slug", e.target.value)} className={inputCls} dir="ltr" placeholder="how-to-use-chatgpt" />
                </div>
              </div>
              <div>
                <label className={labelCls}>المقدمة (excerpt) *</label>
                <textarea rows={2} value={form.excerpt} onChange={(e) => set("excerpt", e.target.value)} className={inputCls} placeholder="جملة أو جملتان تلخص الدليل" />
              </div>
              <div>
                <label className={labelCls}>المحتوى الكامل *</label>
                <textarea rows={10} value={form.content} onChange={(e) => set("content", e.target.value)} className={inputCls} placeholder="اكتب الدليل كاملاً هنا..." />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className={labelCls}>التصنيف</label>
                  <select value={form.category} onChange={(e) => set("category", e.target.value)} className={inputCls}>
                    {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>المستوى</label>
                  <select value={form.difficulty} onChange={(e) => set("difficulty", e.target.value)} className={inputCls}>
                    <option value="beginner">مبتدئ</option>
                    <option value="intermediate">متوسط</option>
                    <option value="advanced">متقدم</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>وقت القراءة (دقيقة)</label>
                  <input type="number" value={form.readingTime} onChange={(e) => set("readingTime", e.target.value)} className={inputCls} dir="ltr" placeholder="5" />
                </div>
              </div>
              <div>
                <label className={labelCls}>الوسوم (مفصولة بفاصلة)</label>
                <input value={form.tags} onChange={(e) => set("tags", e.target.value)} className={inputCls} placeholder="ChatGPT، ذكاء اصطناعي، مبتدئ" />
              </div>
              <label className="flex cursor-pointer items-center gap-3 select-none">
                <div className="relative">
                  <input type="checkbox" className="sr-only" checked={form.published} onChange={(e) => set("published", e.target.checked)} />
                  <div className={`h-6 w-11 rounded-full transition-colors ${form.published ? "bg-[#667eea]" : "bg-slate-200"}`} />
                  <div className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${form.published ? "-translate-x-5" : "-translate-x-0.5"}`} />
                </div>
                <span className="text-sm font-semibold text-slate-700">{form.published ? "منشور" : "مسودة"}</span>
              </label>
            </div>
            <div className="mt-8 flex justify-end gap-3">
              <button onClick={() => setShowForm(false)} className="rounded-2xl bg-slate-100 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-200">إلغاء</button>
              <button onClick={save} disabled={saving} className="flex items-center gap-2 rounded-2xl bg-[#667eea] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#5a6fd6] disabled:opacity-60">
                {saving && <Loader2 className="size-4 animate-spin" />}
                {editId ? "حفظ التعديلات" : "نشر الدليل"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" dir="rtl">
          <div className="w-full max-w-md rounded-[2rem] bg-white p-8 shadow-2xl">
            <h2 className="text-xl font-black text-slate-900">تأكيد الحذف</h2>
            <p className="mt-3 text-slate-600">سيتم حذف هذا الدليل نهائياً.</p>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setDeleteId(null)} disabled={deleting} className="rounded-2xl bg-slate-100 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-200">إلغاء</button>
              <button onClick={del} disabled={deleting} className="flex items-center gap-2 rounded-2xl bg-red-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-600">
                {deleting && <Loader2 className="size-4 animate-spin" />} حذف
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
