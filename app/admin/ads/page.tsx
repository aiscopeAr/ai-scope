"use client";

import * as React from "react";
import { Plus, Pencil, Trash2, Loader2, ToggleLeft, ToggleRight } from "lucide-react";
import { useToast } from "@/components/ui/toast";

type AdPosition =
  | "header"
  | "article-top"
  | "article-mid"
  | "article-bottom"
  | "sidebar"
  | "homepage-top"
  | "homepage-mid"
  | "category-top";

type AdType = "script" | "image" | "iframe";

interface AdSlot {
  id: string;
  name: string;
  position: AdPosition;
  type: AdType;
  code: string;
  enabled: boolean;
  createdAt: string;
}

const POSITIONS: { value: AdPosition; label: string }[] = [
  { value: "header", label: "رأس الصفحة (Header)" },
  { value: "homepage-top", label: "الرئيسية — أعلى" },
  { value: "homepage-mid", label: "الرئيسية — وسط" },
  { value: "article-top", label: "المقال — أعلى" },
  { value: "article-mid", label: "المقال — وسط" },
  { value: "article-bottom", label: "المقال — أسفل" },
  { value: "sidebar", label: "الشريط الجانبي" },
  { value: "category-top", label: "صفحة التصنيف — أعلى" },
];

const TYPES: { value: AdType; label: string; hint: string }[] = [
  { value: "script", label: "Script", hint: "كود JS مثل AdSense / Taboola" },
  { value: "iframe", label: "iFrame", hint: "رابط iframe مباشر" },
  { value: "image", label: "صورة", hint: "صورة مع رابط" },
];

const POSITION_LABELS: Record<AdPosition, string> = Object.fromEntries(
  POSITIONS.map((p) => [p.value, p.label])
) as Record<AdPosition, string>;

const empty = { name: "", position: "article-mid" as AdPosition, type: "script" as AdType, code: "", enabled: true };

export default function AdminAdsPage() {
  const { toast } = useToast();
  const [ads, setAds] = React.useState<AdSlot[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showForm, setShowForm] = React.useState(false);
  const [editId, setEditId] = React.useState<string | null>(null);
  const [form, setForm] = React.useState(empty);
  const [saving, setSaving] = React.useState(false);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  async function fetchAds() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/ads");
      if (!res.ok) throw new Error();
      setAds(await res.json());
    } catch {
      toast("فشل تحميل الإعلانات", "error");
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => { fetchAds(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function openNew() {
    setForm(empty);
    setEditId(null);
    setShowForm(true);
  }

  function openEdit(ad: AdSlot) {
    setForm({ name: ad.name, position: ad.position, type: ad.type, code: ad.code, enabled: ad.enabled });
    setEditId(ad.id);
    setShowForm(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const url = editId ? `/api/admin/ads/${editId}` : "/api/admin/ads";
      const method = editId ? "PATCH" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (!res.ok) throw new Error();
      toast(editId ? "تم تحديث الإعلان" : "تم إضافة الإعلان");
      setShowForm(false);
      fetchAds();
    } catch {
      toast("فشل الحفظ", "error");
    } finally {
      setSaving(false);
    }
  }

  async function toggleEnabled(ad: AdSlot) {
    try {
      const res = await fetch(`/api/admin/ads/${ad.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !ad.enabled }),
      });
      if (!res.ok) throw new Error();
      setAds((prev) => prev.map((a) => a.id === ad.id ? { ...a, enabled: !a.enabled } : a));
    } catch {
      toast("فشل التحديث", "error");
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/ads/${deleteId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast("تم حذف الإعلان");
      setDeleteId(null);
      fetchAds();
    } catch {
      toast("فشل الحذف", "error");
    } finally {
      setDeleting(false);
    }
  }

  const byPosition = POSITIONS.map((p) => ({
    ...p,
    ads: ads.filter((a) => a.position === p.value),
  })).filter((p) => p.ads.length > 0);

  return (
    <div className="p-6" dir="rtl">
      {/* Header */}
      <div className="mb-6 flex items-center gap-4">
        <p className="text-xs text-slate-400 flex-1">{ads.length} إعلان — {ads.filter((a) => a.enabled).length} مفعّل</p>
        <button
          onClick={openNew}
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition"
        >
          <Plus className="size-4" />
          إعلان جديد
        </button>
      </div>

      {/* Positions guide */}
      <div className="mb-8 rounded-[1.75rem] bg-white p-6 shadow-md shadow-slate-200/60">
        <h2 className="mb-4 text-base font-black text-slate-800">مواضع الإعلانات المتاحة</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {POSITIONS.map((p) => {
            const count = ads.filter((a) => a.position === p.value && a.enabled).length;
            return (
              <div key={p.value} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                <span className="text-sm font-medium text-slate-700">{p.label}</span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${count > 0 ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-400"}`}>
                  {count > 0 ? `${count} مفعّل` : "فارغ"}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Ads list */}
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="size-8 animate-spin text-indigo-600" /></div>
      ) : ads.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[2rem] bg-white py-24 shadow-lg shadow-slate-200/60">
          <p className="text-lg font-semibold text-slate-500">لا توجد إعلانات بعد</p>
          <p className="mt-1 text-sm text-slate-400">أضف إعلانك الأول بالضغط على "إعلان جديد"</p>
        </div>
      ) : (
        <div className="space-y-6">
          {byPosition.map((group) => (
            <div key={group.value} className="rounded-[2rem] bg-white shadow-lg shadow-slate-200/60 overflow-hidden">
              <div className="border-b border-slate-100 px-6 py-4">
                <h3 className="font-black text-slate-800">{group.label}</h3>
              </div>
              <div className="divide-y divide-slate-100">
                {group.ads.map((ad) => (
                  <div key={ad.id} className="flex items-center gap-4 px-6 py-4">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-800">{ad.name}</p>
                      <p className="mt-0.5 text-xs text-slate-400">
                        {TYPES.find((t) => t.value === ad.type)?.label} · {ad.code.length} حرف
                      </p>
                    </div>
                    <button
                      onClick={() => toggleEnabled(ad)}
                      className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition ${
                        ad.enabled ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                      }`}
                    >
                      {ad.enabled ? <ToggleRight className="size-4" /> : <ToggleLeft className="size-4" />}
                      {ad.enabled ? "مفعّل" : "معطّل"}
                    </button>
                    <button
                      onClick={() => openEdit(ad)}
                      className="rounded-xl bg-slate-100 p-2 text-slate-600 hover:bg-indigo-600/10 hover:text-indigo-600 transition"
                    >
                      <Pencil className="size-4" />
                    </button>
                    <button
                      onClick={() => setDeleteId(ad.id)}
                      className="rounded-xl bg-slate-100 p-2 text-slate-600 hover:bg-red-50 hover:text-red-600 transition"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" dir="rtl">
          <div className="w-full max-w-2xl rounded-[2rem] bg-white p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="mb-6 text-xl font-black text-slate-900">
              {editId ? "تعديل الإعلان" : "إضافة إعلان جديد"}
            </h2>

            <div className="space-y-5">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">اسم الإعلان</label>
                <input
                  type="text"
                  placeholder="مثال: AdSense — وسط المقال"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">الموضع</label>
                  <select
                    value={form.position}
                    onChange={(e) => setForm((f) => ({ ...f, position: e.target.value as AdPosition }))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none"
                  >
                    {POSITIONS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">نوع الإعلان</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as AdType }))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none"
                  >
                    {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label} — {t.hint}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  {form.type === "script" ? "كود الإعلان (HTML / JS)" : form.type === "iframe" ? "رابط iFrame" : "رابط الصورة"}
                </label>
                <textarea
                  rows={6}
                  placeholder={
                    form.type === "script"
                      ? '<script async src="https://..."></script>\n<ins class="adsbygoogle" ...'
                      : form.type === "iframe"
                      ? "https://ads.example.com/banner?id=..."
                      : "https://example.com/banner.jpg"
                  }
                  value={form.code}
                  onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 font-mono text-xs text-slate-800 focus:border-indigo-500 focus:outline-none"
                  dir="ltr"
                />
                <p className="mt-1 text-xs text-slate-400">
                  {form.type === "script" && "الصق الكود كاملاً كما تلقيته من شبكة الإعلانات"}
                  {form.type === "iframe" && "سيتم تضمينه داخل iframe بعرض 100%"}
                  {form.type === "image" && "سيتم عرضه كصورة — أضف رابط الوجهة في الكود إن أردت"}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, enabled: !f.enabled }))}
                  className={`relative h-6 w-11 rounded-full transition-colors ${form.enabled ? "bg-indigo-600" : "bg-slate-300"}`}
                >
                  <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${form.enabled ? "right-0.5" : "left-0.5"}`} />
                </button>
                <span className="text-sm font-medium text-slate-700">{form.enabled ? "مفعّل مباشرة" : "معطّل (لن يظهر)"}</span>
              </div>
            </div>

            <div className="mt-8 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowForm(false)}
                disabled={saving}
                className="rounded-2xl bg-slate-100 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-200 disabled:opacity-50"
              >
                إلغاء
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.name || !form.code}
                className="flex items-center gap-2 rounded-2xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {saving && <Loader2 className="size-4 animate-spin" />}
                {editId ? "حفظ التعديلات" : "إضافة الإعلان"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" dir="rtl">
          <div className="w-full max-w-md rounded-[2rem] bg-white p-8 shadow-2xl">
            <h2 className="text-xl font-black text-slate-900">تأكيد الحذف</h2>
            <p className="mt-3 text-slate-600">هل أنت متأكد من حذف هذا الإعلان؟ لا يمكن التراجع.</p>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setDeleteId(null)} disabled={deleting} className="rounded-2xl bg-slate-100 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-200 disabled:opacity-50">
                إلغاء
              </button>
              <button onClick={handleDelete} disabled={deleting} className="flex items-center gap-2 rounded-2xl bg-red-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-50">
                {deleting && <Loader2 className="size-4 animate-spin" />}
                حذف
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
