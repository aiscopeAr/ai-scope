"use client";

import * as React from "react";
import { Plus, Pencil, Trash2, Loader2, Wrench, ExternalLink } from "lucide-react";
import { useToast } from "@/components/ui/toast";

const inputCls = "w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-[#667eea] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#667eea]/20 transition";
const labelCls = "mb-1.5 block text-sm font-semibold text-slate-700";

type Tool = {
  id: string; name: string; slug: string; tagline: string | null; descriptionAr: string;
  website: string | null; logoUrl: string | null; category: string; pricing: string;
  pros: string[]; cons: string[]; useCases: string[]; published: boolean; viewCount: number;
};

type FormState = {
  name: string; slug: string; tagline: string; descriptionAr: string;
  website: string; logoUrl: string; category: string; pricing: string;
  pros: string; cons: string; useCases: string; published: boolean;
};

const empty: FormState = {
  name: "", slug: "", tagline: "", descriptionAr: "", website: "", logoUrl: "",
  category: "chatbot", pricing: "freemium", pros: "", cons: "", useCases: "", published: true,
};

const CATEGORIES = [
  { value: "chatbot", label: "محادثة وكتابة" },
  { value: "image", label: "توليد الصور" },
  { value: "video", label: "توليد الفيديو" },
  { value: "audio", label: "الصوت والموسيقى" },
  { value: "code", label: "البرمجة" },
  { value: "productivity", label: "الإنتاجية" },
  { value: "other", label: "أخرى" },
];

function autoSlug(name: string) {
  return name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").slice(0, 40);
}

function splitLines(s: string): string[] {
  return s.split("\n").map((l) => l.trim()).filter(Boolean);
}

export default function AdminAIToolsPage() {
  const { toast } = useToast();
  const [tools, setTools] = React.useState<Tool[]>([]);
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
      const res = await fetch("/api/admin/ai-tools");
      if (res.ok) setTools(await res.json());
    } catch { toast("فشل التحميل", "error"); }
    finally { setLoading(false); }
  }, [toast]);

  React.useEffect(() => { load(); }, [load]);

  function set(k: keyof FormState, v: string | boolean) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function openNew() { setForm(empty); setEditId(null); setShowForm(true); }

  function openEdit(t: Tool) {
    setForm({
      name: t.name, slug: t.slug, tagline: t.tagline ?? "", descriptionAr: t.descriptionAr,
      website: t.website ?? "", logoUrl: t.logoUrl ?? "",
      category: t.category, pricing: t.pricing,
      pros: t.pros.join("\n"), cons: t.cons.join("\n"), useCases: t.useCases.join("\n"),
      published: t.published,
    });
    setEditId(t.id);
    setShowForm(true);
  }

  async function save() {
    if (!form.name || !form.slug || !form.descriptionAr) {
      toast("الاسم والـ slug والوصف مطلوبة", "error"); return;
    }
    setSaving(true);
    try {
      const url = editId ? `/api/admin/ai-tools/${editId}` : "/api/admin/ai-tools";
      const res = await fetch(url, {
        method: editId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          pros: splitLines(form.pros),
          cons: splitLines(form.cons),
          useCases: splitLines(form.useCases),
        }),
      });
      if (!res.ok) { const e = await res.json(); toast(e.error ?? "فشل الحفظ", "error"); return; }
      toast(editId ? "تم التحديث" : "تمت الإضافة");
      setShowForm(false); load();
    } catch { toast("فشل الحفظ", "error"); }
    finally { setSaving(false); }
  }

  async function del() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await fetch(`/api/admin/ai-tools/${deleteId}`, { method: "DELETE" });
      toast("تم الحذف"); setDeleteId(null); load();
    } catch { toast("فشل الحذف", "error"); }
    finally { setDeleting(false); }
  }

  return (
    <div className="container mx-auto px-4 py-8" dir="rtl">
      <div className="mb-8 flex flex-col gap-4 rounded-[2rem] bg-white p-6 shadow-lg shadow-slate-200/60 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="mb-1 text-sm font-semibold text-[#667eea]">لوحة الإدارة</p>
          <h1 className="text-3xl font-black text-slate-900">أدوات الذكاء الاصطناعي</h1>
          <p className="mt-1 text-slate-500">{tools.length} أداة مسجّلة</p>
        </div>
        <div className="flex gap-3">
          <a href="/admin" className="rounded-2xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200 transition">الرئيسية</a>
          <a href="/ai-tools" target="_blank" rel="noopener" className="flex items-center gap-1.5 rounded-2xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200 transition">
            <ExternalLink className="size-3.5" /> عرض
          </a>
          <button onClick={openNew} className="flex items-center gap-2 rounded-2xl bg-[#667eea] px-5 py-2 text-sm font-semibold text-white hover:bg-[#5a6fd6] transition">
            <Plus className="size-4" /> أداة جديدة
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-32"><Loader2 className="size-8 animate-spin text-[#667eea]" /></div>
      ) : tools.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[2rem] bg-white py-24 shadow-lg shadow-slate-200/60">
          <Wrench className="size-12 text-slate-300 mb-4" />
          <p className="text-lg font-semibold text-slate-700">لا توجد أدوات بعد</p>
          <button onClick={openNew} className="mt-6 flex items-center gap-2 rounded-2xl bg-[#667eea] px-5 py-2.5 text-sm font-semibold text-white">
            <Plus className="size-4" /> أضف أداة
          </button>
        </div>
      ) : (
        <div className="rounded-[2rem] bg-white shadow-lg shadow-slate-200/60 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-100 bg-slate-50">
              <tr>
                <th className="px-5 py-3 text-right font-semibold text-slate-600">الأداة</th>
                <th className="px-5 py-3 text-right font-semibold text-slate-600 hidden md:table-cell">التصنيف</th>
                <th className="px-5 py-3 text-right font-semibold text-slate-600 hidden md:table-cell">السعر</th>
                <th className="px-5 py-3 text-right font-semibold text-slate-600">الحالة</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tools.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50 transition">
                  <td className="px-5 py-4">
                    <p className="font-semibold text-slate-900">{t.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{t.slug}</p>
                  </td>
                  <td className="px-5 py-4 hidden md:table-cell text-slate-600">{t.category}</td>
                  <td className="px-5 py-4 hidden md:table-cell text-slate-600">{t.pricing}</td>
                  <td className="px-5 py-4">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${t.published ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                      {t.published ? "منشور" : "مسودة"}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <a href={`/ai-tools/${t.slug}`} target="_blank" rel="noopener" className="rounded-lg bg-slate-100 p-2 text-slate-500 hover:text-[#667eea] transition"><ExternalLink className="size-4" /></a>
                      <button onClick={() => openEdit(t)} className="rounded-lg bg-slate-100 p-2 text-slate-500 hover:text-[#667eea] transition"><Pencil className="size-4" /></button>
                      <button onClick={() => setDeleteId(t.id)} className="rounded-lg bg-slate-100 p-2 text-slate-500 hover:text-red-600 transition"><Trash2 className="size-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 backdrop-blur-sm p-4 pt-10" dir="rtl">
          <div className="w-full max-w-2xl rounded-[2rem] bg-white p-8 shadow-2xl mb-10">
            <h2 className="mb-6 text-xl font-black text-slate-900">{editId ? "تعديل الأداة" : "أداة جديدة"}</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>الاسم *</label>
                  <input value={form.name} onChange={(e) => { set("name", e.target.value); if (!editId) set("slug", autoSlug(e.target.value)); }} className={inputCls} placeholder="ChatGPT" />
                </div>
                <div>
                  <label className={labelCls}>Slug *</label>
                  <input value={form.slug} onChange={(e) => set("slug", e.target.value)} className={inputCls} dir="ltr" placeholder="chatgpt" />
                </div>
              </div>
              <div>
                <label className={labelCls}>شعار قصير (tagline)</label>
                <input value={form.tagline} onChange={(e) => set("tagline", e.target.value)} className={inputCls} placeholder="أذكى مساعد AI للكتابة والبحث" />
              </div>
              <div>
                <label className={labelCls}>الوصف بالعربية *</label>
                <textarea rows={4} value={form.descriptionAr} onChange={(e) => set("descriptionAr", e.target.value)} className={inputCls} placeholder="وصف شامل للأداة..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>رابط الموقع</label>
                  <input value={form.website} onChange={(e) => set("website", e.target.value)} className={inputCls} dir="ltr" placeholder="https://chat.openai.com" />
                </div>
                <div>
                  <label className={labelCls}>رابط الشعار</label>
                  <input value={form.logoUrl} onChange={(e) => set("logoUrl", e.target.value)} className={inputCls} dir="ltr" placeholder="https://..." />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>الفئة</label>
                  <select value={form.category} onChange={(e) => set("category", e.target.value)} className={inputCls}>
                    {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>التسعير</label>
                  <select value={form.pricing} onChange={(e) => set("pricing", e.target.value)} className={inputCls}>
                    <option value="free">مجاني</option>
                    <option value="freemium">مجاني + مدفوع</option>
                    <option value="paid">مدفوع</option>
                  </select>
                </div>
              </div>
              <div>
                <label className={labelCls}>المميزات (سطر لكل ميزة)</label>
                <textarea rows={3} value={form.pros} onChange={(e) => set("pros", e.target.value)} className={inputCls} placeholder={"واجهة سهلة الاستخدام\nيدعم العربية\nمجاني للاستخدام الأساسي"} />
              </div>
              <div>
                <label className={labelCls}>العيوب (سطر لكل عيب)</label>
                <textarea rows={3} value={form.cons} onChange={(e) => set("cons", e.target.value)} className={inputCls} placeholder={"الخطة المجانية محدودة\nيحتاج اتصال بالإنترنت"} />
              </div>
              <div>
                <label className={labelCls}>حالات الاستخدام (سطر لكل حالة)</label>
                <textarea rows={3} value={form.useCases} onChange={(e) => set("useCases", e.target.value)} className={inputCls} placeholder={"كتابة المقالات والتقارير\nالترجمة والتلخيص"} />
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
                {editId ? "حفظ" : "إضافة"}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" dir="rtl">
          <div className="w-full max-w-md rounded-[2rem] bg-white p-8 shadow-2xl">
            <h2 className="text-xl font-black text-slate-900">تأكيد الحذف</h2>
            <p className="mt-3 text-slate-600">سيتم حذف هذه الأداة نهائياً.</p>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setDeleteId(null)} disabled={deleting} className="rounded-2xl bg-slate-100 px-5 py-2.5 text-sm font-semibold text-slate-700">إلغاء</button>
              <button onClick={del} disabled={deleting} className="flex items-center gap-2 rounded-2xl bg-red-500 px-5 py-2.5 text-sm font-semibold text-white">
                {deleting && <Loader2 className="size-4 animate-spin" />} حذف
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
