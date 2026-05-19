"use client";

import * as React from "react";
import { Plus, Pencil, Trash2, Loader2, Scale, ExternalLink } from "lucide-react";
import { useToast } from "@/components/ui/toast";

const inputCls = "w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-[#667eea] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#667eea]/20 transition";
const labelCls = "mb-1.5 block text-sm font-semibold text-slate-700";

type ToolOption = { id: string; name: string; slug: string };

type ComparisonRow = {
  id: string;
  slug: string;
  title: string;
  summaryAr: string;
  verdict: string | null;
  published: boolean;
  viewCount: number;
  sides: Array<{
    id: string;
    score: number | null;
    notes: string | null;
    tool: ToolOption;
  }>;
};

type FormState = {
  slug: string;
  title: string;
  summaryAr: string;
  verdict: string;
  published: boolean;
  toolAId: string;
  toolBId: string;
  scoreA: string;
  scoreB: string;
  notesA: string;
  notesB: string;
};

const empty: FormState = {
  slug: "", title: "", summaryAr: "", verdict: "", published: true,
  toolAId: "", toolBId: "", scoreA: "", scoreB: "", notesA: "", notesB: "",
};

function autoSlug(title: string) {
  return title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").slice(0, 60);
}

export default function AdminComparePage() {
  const { toast } = useToast();
  const [comparisons, setComparisons] = React.useState<ComparisonRow[]>([]);
  const [tools, setTools] = React.useState<ToolOption[]>([]);
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
      const [cRes, tRes] = await Promise.all([
        fetch("/api/admin/compare"),
        fetch("/api/admin/ai-tools"),
      ]);
      if (cRes.ok) setComparisons(await cRes.json());
      if (tRes.ok) setTools(await tRes.json());
    } catch { toast("فشل التحميل", "error"); }
    finally { setLoading(false); }
  }, [toast]);

  React.useEffect(() => { load(); }, [load]);

  function set(k: keyof FormState, v: string | boolean) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function openNew() { setForm(empty); setEditId(null); setShowForm(true); }

  function openEdit(c: ComparisonRow) {
    const sideA = c.sides[0];
    const sideB = c.sides[1];
    setForm({
      slug: c.slug,
      title: c.title,
      summaryAr: c.summaryAr,
      verdict: c.verdict ?? "",
      published: c.published,
      toolAId: sideA?.tool.id ?? "",
      toolBId: sideB?.tool.id ?? "",
      scoreA: sideA?.score != null ? String(sideA.score) : "",
      scoreB: sideB?.score != null ? String(sideB.score) : "",
      notesA: sideA?.notes ?? "",
      notesB: sideB?.notes ?? "",
    });
    setEditId(c.id);
    setShowForm(true);
  }

  async function save() {
    if (!form.slug || !form.title || !form.summaryAr) {
      toast("الـ slug والعنوان والملخص مطلوبة", "error"); return;
    }
    if (!form.toolAId || !form.toolBId) {
      toast("يجب اختيار أداتين للمقارنة", "error"); return;
    }
    if (form.toolAId === form.toolBId) {
      toast("يجب أن تكون الأداتان مختلفتين", "error"); return;
    }
    setSaving(true);
    try {
      const url = editId ? `/api/admin/compare/${editId}` : "/api/admin/compare";
      const res = await fetch(url, {
        method: editId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) { const e = await res.json(); toast(e.error ?? "فشل الحفظ", "error"); return; }
      toast(editId ? "تم التحديث" : "تمت الإضافة");
      setShowForm(false);
      load();
    } catch { toast("فشل الحفظ", "error"); }
    finally { setSaving(false); }
  }

  async function del() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await fetch(`/api/admin/compare/${deleteId}`, { method: "DELETE" });
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
          <h1 className="text-3xl font-black text-slate-900">مقارنات الأدوات</h1>
          <p className="mt-1 text-slate-500">{comparisons.length} مقارنة مسجّلة</p>
        </div>
        <div className="flex gap-3">
          <a href="/admin" className="rounded-2xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200 transition">الرئيسية</a>
          <a href="/compare" target="_blank" rel="noopener" className="flex items-center gap-1.5 rounded-2xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200 transition">
            <ExternalLink className="size-3.5" /> عرض
          </a>
          <button onClick={openNew} className="flex items-center gap-2 rounded-2xl bg-[#667eea] px-5 py-2 text-sm font-semibold text-white hover:bg-[#5a6fd6] transition">
            <Plus className="size-4" /> مقارنة جديدة
          </button>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-32"><Loader2 className="size-8 animate-spin text-[#667eea]" /></div>
      ) : comparisons.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[2rem] bg-white py-24 shadow-lg shadow-slate-200/60">
          <Scale className="size-12 text-slate-300 mb-4" />
          <p className="text-lg font-semibold text-slate-700">لا توجد مقارنات بعد</p>
          <button onClick={openNew} className="mt-6 flex items-center gap-2 rounded-2xl bg-[#667eea] px-5 py-2.5 text-sm font-semibold text-white">
            <Plus className="size-4" /> أضف مقارنة
          </button>
        </div>
      ) : (
        <div className="rounded-[2rem] bg-white shadow-lg shadow-slate-200/60 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-100 bg-slate-50">
              <tr>
                <th className="px-5 py-3 text-right font-semibold text-slate-600">المقارنة</th>
                <th className="px-5 py-3 text-right font-semibold text-slate-600 hidden md:table-cell">الأداتان</th>
                <th className="px-5 py-3 text-right font-semibold text-slate-600 hidden lg:table-cell">المشاهدات</th>
                <th className="px-5 py-3 text-right font-semibold text-slate-600">الحالة</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {comparisons.map((c) => {
                const toolA = c.sides[0]?.tool;
                const toolB = c.sides[1]?.tool;
                return (
                  <tr key={c.id} className="hover:bg-slate-50 transition">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-900 line-clamp-1">{c.title}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{c.slug}</p>
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell text-slate-600 text-xs">
                      {toolA && toolB ? (
                        <span className="flex items-center gap-1">
                          <span className="font-semibold">{toolA.name}</span>
                          <span className="text-slate-400">vs</span>
                          <span className="font-semibold">{toolB.name}</span>
                        </span>
                      ) : "—"}
                    </td>
                    <td className="px-5 py-4 hidden lg:table-cell text-slate-600">{c.viewCount}</td>
                    <td className="px-5 py-4">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${c.published ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                        {c.published ? "منشور" : "مسودة"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <a href={`/compare/${c.slug}`} target="_blank" rel="noopener" className="rounded-lg bg-slate-100 p-2 text-slate-500 hover:text-[#667eea] transition">
                          <ExternalLink className="size-4" />
                        </a>
                        <button onClick={() => openEdit(c)} className="rounded-lg bg-slate-100 p-2 text-slate-500 hover:text-[#667eea] transition">
                          <Pencil className="size-4" />
                        </button>
                        <button onClick={() => setDeleteId(c.id)} className="rounded-lg bg-slate-100 p-2 text-slate-500 hover:text-red-600 transition">
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 backdrop-blur-sm p-4 pt-10" dir="rtl">
          <div className="w-full max-w-2xl rounded-[2rem] bg-white p-8 shadow-2xl mb-10">
            <h2 className="mb-6 text-xl font-black text-slate-900">{editId ? "تعديل المقارنة" : "مقارنة جديدة"}</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>العنوان *</label>
                  <input value={form.title} onChange={(e) => { set("title", e.target.value); if (!editId) set("slug", autoSlug(e.target.value)); }} className={inputCls} placeholder="ChatGPT مقابل Claude" />
                </div>
                <div>
                  <label className={labelCls}>Slug *</label>
                  <input value={form.slug} onChange={(e) => set("slug", e.target.value)} className={inputCls} dir="ltr" placeholder="chatgpt-vs-claude" />
                </div>
              </div>

              <div>
                <label className={labelCls}>ملخص المقارنة *</label>
                <textarea rows={3} value={form.summaryAr} onChange={(e) => set("summaryAr", e.target.value)} className={inputCls} placeholder="مقارنة شاملة بين..." />
              </div>

              <div>
                <label className={labelCls}>الحكم النهائي</label>
                <textarea rows={2} value={form.verdict} onChange={(e) => set("verdict", e.target.value)} className={inputCls} placeholder="الفائز في هذه المقارنة هو..." />
              </div>

              {/* Tool A */}
              <div className="rounded-xl border border-slate-200 p-4 bg-slate-50">
                <p className="mb-3 text-xs font-bold text-slate-500 uppercase tracking-wide">الأداة الأولى</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>الأداة *</label>
                    <select value={form.toolAId} onChange={(e) => set("toolAId", e.target.value)} className={inputCls}>
                      <option value="">اختر أداة...</option>
                      {tools.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>الدرجة (0-100)</label>
                    <input type="number" min="0" max="100" value={form.scoreA} onChange={(e) => set("scoreA", e.target.value)} className={inputCls} dir="ltr" placeholder="85" />
                  </div>
                </div>
                <div className="mt-3">
                  <label className={labelCls}>ملاحظات</label>
                  <textarea rows={2} value={form.notesA} onChange={(e) => set("notesA", e.target.value)} className={inputCls} placeholder="نقاط قوة وضعف الأداة الأولى..." />
                </div>
              </div>

              {/* Tool B */}
              <div className="rounded-xl border border-slate-200 p-4 bg-slate-50">
                <p className="mb-3 text-xs font-bold text-slate-500 uppercase tracking-wide">الأداة الثانية</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>الأداة *</label>
                    <select value={form.toolBId} onChange={(e) => set("toolBId", e.target.value)} className={inputCls}>
                      <option value="">اختر أداة...</option>
                      {tools.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>الدرجة (0-100)</label>
                    <input type="number" min="0" max="100" value={form.scoreB} onChange={(e) => set("scoreB", e.target.value)} className={inputCls} dir="ltr" placeholder="80" />
                  </div>
                </div>
                <div className="mt-3">
                  <label className={labelCls}>ملاحظات</label>
                  <textarea rows={2} value={form.notesB} onChange={(e) => set("notesB", e.target.value)} className={inputCls} placeholder="نقاط قوة وضعف الأداة الثانية..." />
                </div>
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
                {editId ? "حفظ التعديلات" : "إضافة المقارنة"}
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
            <p className="mt-3 text-slate-600">سيتم حذف هذه المقارنة نهائياً.</p>
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
