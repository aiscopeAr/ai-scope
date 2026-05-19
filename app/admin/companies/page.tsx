"use client";

import * as React from "react";
import { Plus, Pencil, Trash2, Loader2, Building2, ExternalLink } from "lucide-react";
import { useToast } from "@/components/ui/toast";

const inputCls = "w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-[#667eea] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#667eea]/20 transition";
const labelCls = "mb-1.5 block text-sm font-semibold text-slate-700";

type Company = {
  id: string; name: string; slug: string; descriptionAr: string;
  website: string | null; logoUrl: string | null; country: string | null; founded: number | null;
  specialties: string[]; notableModels: string[]; published: boolean; viewCount: number;
};

type FormState = {
  name: string; slug: string; descriptionAr: string; website: string; logoUrl: string;
  country: string; founded: string; specialties: string; notableModels: string; published: boolean;
};

const empty: FormState = {
  name: "", slug: "", descriptionAr: "", website: "", logoUrl: "",
  country: "", founded: "", specialties: "", notableModels: "", published: true,
};

function autoSlug(name: string) {
  return name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").slice(0, 40);
}

export default function AdminCompaniesPage() {
  const { toast } = useToast();
  const [companies, setCompanies] = React.useState<Company[]>([]);
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
      const res = await fetch("/api/admin/companies");
      if (res.ok) setCompanies(await res.json());
    } catch { toast("فشل التحميل", "error"); }
    finally { setLoading(false); }
  }, [toast]);

  React.useEffect(() => { load(); }, [load]);

  function set(k: keyof FormState, v: string | boolean) { setForm((f) => ({ ...f, [k]: v })); }

  function openNew() { setForm(empty); setEditId(null); setShowForm(true); }

  function openEdit(c: Company) {
    setForm({
      name: c.name, slug: c.slug, descriptionAr: c.descriptionAr,
      website: c.website ?? "", logoUrl: c.logoUrl ?? "",
      country: c.country ?? "", founded: c.founded ? String(c.founded) : "",
      specialties: c.specialties.join("، "),
      notableModels: c.notableModels.join("، "),
      published: c.published,
    });
    setEditId(c.id); setShowForm(true);
  }

  async function save() {
    if (!form.name || !form.slug || !form.descriptionAr) {
      toast("الاسم والـ slug والوصف مطلوبة", "error"); return;
    }
    setSaving(true);
    try {
      const url = editId ? `/api/admin/companies/${editId}` : "/api/admin/companies";
      const res = await fetch(url, {
        method: editId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          founded: form.founded ? Number(form.founded) : null,
          specialties: form.specialties.split(/[,،]/).map((s) => s.trim()).filter(Boolean),
          notableModels: form.notableModels.split(/[,،]/).map((s) => s.trim()).filter(Boolean),
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
      await fetch(`/api/admin/companies/${deleteId}`, { method: "DELETE" });
      toast("تم الحذف"); setDeleteId(null); load();
    } catch { toast("فشل الحذف", "error"); }
    finally { setDeleting(false); }
  }

  return (
    <div className="container mx-auto px-4 py-8" dir="rtl">
      <div className="mb-8 flex flex-col gap-4 rounded-[2rem] bg-white p-6 shadow-lg shadow-slate-200/60 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="mb-1 text-sm font-semibold text-[#667eea]">لوحة الإدارة</p>
          <h1 className="text-3xl font-black text-slate-900">شركات الذكاء الاصطناعي</h1>
          <p className="mt-1 text-slate-500">{companies.length} شركة مسجّلة</p>
        </div>
        <div className="flex gap-3">
          <a href="/admin" className="rounded-2xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200 transition">الرئيسية</a>
          <a href="/companies" target="_blank" rel="noopener" className="flex items-center gap-1.5 rounded-2xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200 transition">
            <ExternalLink className="size-3.5" /> عرض
          </a>
          <button onClick={openNew} className="flex items-center gap-2 rounded-2xl bg-[#667eea] px-5 py-2 text-sm font-semibold text-white hover:bg-[#5a6fd6] transition">
            <Plus className="size-4" /> شركة جديدة
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-32"><Loader2 className="size-8 animate-spin text-[#667eea]" /></div>
      ) : companies.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[2rem] bg-white py-24 shadow-lg shadow-slate-200/60">
          <Building2 className="size-12 text-slate-300 mb-4" />
          <p className="text-lg font-semibold text-slate-700">لا توجد شركات بعد</p>
          <button onClick={openNew} className="mt-6 flex items-center gap-2 rounded-2xl bg-[#667eea] px-5 py-2.5 text-sm font-semibold text-white"><Plus className="size-4" /> أضف شركة</button>
        </div>
      ) : (
        <div className="rounded-[2rem] bg-white shadow-lg shadow-slate-200/60 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-100 bg-slate-50">
              <tr>
                <th className="px-5 py-3 text-right font-semibold text-slate-600">الشركة</th>
                <th className="px-5 py-3 text-right font-semibold text-slate-600 hidden md:table-cell">الدولة</th>
                <th className="px-5 py-3 text-right font-semibold text-slate-600 hidden lg:table-cell">النماذج</th>
                <th className="px-5 py-3 text-right font-semibold text-slate-600">الحالة</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {companies.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50 transition">
                  <td className="px-5 py-4">
                    <p className="font-semibold text-slate-900">{c.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{c.slug}</p>
                  </td>
                  <td className="px-5 py-4 hidden md:table-cell text-slate-600">{c.country ?? "—"}</td>
                  <td className="px-5 py-4 hidden lg:table-cell text-slate-600 text-xs">{c.notableModels.slice(0, 2).join("، ") || "—"}</td>
                  <td className="px-5 py-4">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${c.published ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                      {c.published ? "منشور" : "مسودة"}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <a href={`/companies/${c.slug}`} target="_blank" rel="noopener" className="rounded-lg bg-slate-100 p-2 text-slate-500 hover:text-[#667eea] transition"><ExternalLink className="size-4" /></a>
                      <button onClick={() => openEdit(c)} className="rounded-lg bg-slate-100 p-2 text-slate-500 hover:text-[#667eea] transition"><Pencil className="size-4" /></button>
                      <button onClick={() => setDeleteId(c.id)} className="rounded-lg bg-slate-100 p-2 text-slate-500 hover:text-red-600 transition"><Trash2 className="size-4" /></button>
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
            <h2 className="mb-6 text-xl font-black text-slate-900">{editId ? "تعديل الشركة" : "شركة جديدة"}</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>الاسم *</label>
                  <input value={form.name} onChange={(e) => { set("name", e.target.value); if (!editId) set("slug", autoSlug(e.target.value)); }} className={inputCls} placeholder="OpenAI" />
                </div>
                <div>
                  <label className={labelCls}>Slug *</label>
                  <input value={form.slug} onChange={(e) => set("slug", e.target.value)} className={inputCls} dir="ltr" placeholder="openai" />
                </div>
              </div>
              <div>
                <label className={labelCls}>الوصف بالعربية *</label>
                <textarea rows={5} value={form.descriptionAr} onChange={(e) => set("descriptionAr", e.target.value)} className={inputCls} placeholder="وصف الشركة ونشاطها..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>رابط الموقع</label>
                  <input value={form.website} onChange={(e) => set("website", e.target.value)} className={inputCls} dir="ltr" placeholder="https://openai.com" />
                </div>
                <div>
                  <label className={labelCls}>رابط الشعار</label>
                  <input value={form.logoUrl} onChange={(e) => set("logoUrl", e.target.value)} className={inputCls} dir="ltr" placeholder="https://..." />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>الدولة</label>
                  <input value={form.country} onChange={(e) => set("country", e.target.value)} className={inputCls} placeholder="الولايات المتحدة" />
                </div>
                <div>
                  <label className={labelCls}>سنة التأسيس</label>
                  <input type="number" value={form.founded} onChange={(e) => set("founded", e.target.value)} className={inputCls} dir="ltr" placeholder="2015" />
                </div>
              </div>
              <div>
                <label className={labelCls}>النماذج البارزة (مفصولة بفاصلة)</label>
                <input value={form.notableModels} onChange={(e) => set("notableModels", e.target.value)} className={inputCls} placeholder="GPT-4، GPT-3.5، DALL-E 3، Sora" />
              </div>
              <div>
                <label className={labelCls}>مجالات التخصص (مفصولة بفاصلة)</label>
                <input value={form.specialties} onChange={(e) => set("specialties", e.target.value)} className={inputCls} placeholder="نماذج لغوية، توليد الصور، البحث" />
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
            <p className="mt-3 text-slate-600">سيتم حذف هذه الشركة نهائياً.</p>
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
