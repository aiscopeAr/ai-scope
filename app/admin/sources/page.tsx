"use client";

import * as React from "react";
import { format } from "date-fns";
import {
  Plus, Pencil, Trash2, RefreshCw, Loader2,
  Globe, Rss, CheckCircle, XCircle,
} from "lucide-react";

import { useToast } from "@/components/ui/toast";
import type { SourceWithCategory } from "@/types/pipeline";

type Category = { id: string; nameAr: string; name: string };

function priorityLabel(p: number) {
  if (p >= 8) return { label: "عالية", cls: "bg-emerald-100 text-emerald-700" };
  if (p >= 5) return { label: "متوسطة", cls: "bg-amber-100 text-amber-700" };
  return { label: "منخفضة", cls: "bg-slate-100 text-slate-600" };
}

const inputCls =
  "w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-[#667eea] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#667eea]/20 transition";

type FormState = {
  name: string;
  rssUrl: string;
  website: string;
  enabled: boolean;
  priority: number;
  categoryId: string;
};

const emptyForm: FormState = {
  name: "",
  rssUrl: "",
  website: "",
  enabled: true,
  priority: 5,
  categoryId: "",
};

export default function AdminSourcesPage() {
  const { toast } = useToast();
  const [sources, setSources] = React.useState<SourceWithCategory[]>([]);
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showForm, setShowForm] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [form, setForm] = React.useState<FormState>(emptyForm);
  const [saving, setSaving] = React.useState(false);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);
  const [deleting, setDeleting] = React.useState(false);
  const [syncingId, setSyncingId] = React.useState<string | null>(null);

  const loadSources = React.useCallback(async () => {
    setLoading(true);
    try {
      const [srcRes, catRes] = await Promise.all([
        fetch("/api/admin/sources"),
        fetch("/api/admin/categories"),
      ]);
      if (srcRes.ok) setSources(await srcRes.json());
      if (catRes.ok) setCategories(await catRes.json());
    } catch {
      toast("فشل تحميل البيانات", "error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  React.useEffect(() => { loadSources(); }, [loadSources]);

  function openNew() {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
  }

  function openEdit(s: SourceWithCategory) {
    setForm({
      name: s.name,
      rssUrl: s.rssUrl,
      website: s.website ?? "",
      enabled: s.enabled,
      priority: s.priority,
      categoryId: s.categoryId ?? "",
    });
    setEditingId(s.id);
    setShowForm(true);
  }

  async function handleSave() {
    if (!form.name || !form.rssUrl) {
      toast("الاسم ورابط RSS مطلوبان", "error");
      return;
    }
    setSaving(true);
    try {
      const url = editingId ? `/api/admin/sources/${editingId}` : "/api/admin/sources";
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, categoryId: form.categoryId || null }),
      });
      if (!res.ok) {
        const err = await res.json();
        toast(typeof err.error === "string" ? err.error : "فشل الحفظ", "error");
        return;
      }
      toast(editingId ? "تم تحديث المصدر" : "تمت إضافة المصدر");
      setShowForm(false);
      loadSources();
    } catch {
      toast("فشل الحفظ", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/sources/${deleteId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast("تم حذف المصدر");
      setDeleteId(null);
      loadSources();
    } catch {
      toast("فشل الحذف", "error");
    } finally {
      setDeleting(false);
    }
  }

  async function handleSync(id: string) {
    setSyncingId(id);
    try {
      const res = await fetch(`/api/admin/sources/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "sync" }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast(data.error ?? "فشل المزامنة", "error");
        return;
      }
      toast(`تمت المزامنة: ${data.added} جديد، ${data.skipped} مكرر`);
      loadSources();
    } catch {
      toast("فشل الاتصال", "error");
    } finally {
      setSyncingId(null);
    }
  }

  async function handleToggle(s: SourceWithCategory) {
    try {
      const res = await fetch(`/api/admin/sources/${s.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !s.enabled }),
      });
      if (!res.ok) throw new Error();
      loadSources();
    } catch {
      toast("فشل التحديث", "error");
    }
  }

  return (
    <div className="container mx-auto px-4 py-8" dir="rtl">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 rounded-[2rem] bg-white p-6 shadow-lg shadow-slate-200/60 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="mb-2 text-sm font-semibold text-[#667eea]">لوحة الإدارة</p>
          <h1 className="text-3xl font-black text-slate-900">إدارة المصادر</h1>
          <p className="mt-1 text-slate-500">{sources.length} مصدر مسجّل</p>
        </div>
        <div className="flex gap-3">
          <a href="/admin" className="rounded-2xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200">
            الرئيسية
          </a>
          <button
            onClick={openNew}
            className="flex items-center gap-2 rounded-2xl bg-[#667eea] px-5 py-2 text-sm font-semibold text-white hover:bg-[#5a6fd6] transition"
          >
            <Plus className="size-4" /> مصدر جديد
          </button>
        </div>
      </div>

      {/* Sources grid */}
      {loading ? (
        <div className="flex items-center justify-center py-32">
          <Loader2 className="size-8 animate-spin text-[#667eea]" />
        </div>
      ) : sources.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[2rem] bg-white py-24 shadow-lg shadow-slate-200/60">
          <Rss className="size-12 text-slate-300 mb-4" />
          <p className="text-lg font-semibold text-slate-700">لا توجد مصادر بعد</p>
          <p className="mt-1 text-sm text-slate-400">أضف أول مصدر RSS للبدء</p>
          <button onClick={openNew} className="mt-6 flex items-center gap-2 rounded-2xl bg-[#667eea] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#5a6fd6]">
            <Plus className="size-4" /> أضف مصدراً
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {sources.map((s) => {
            const pri = priorityLabel(s.priority);
            const isSyncing = syncingId === s.id;
            return (
              <div
                key={s.id}
                className={`rounded-[2rem] bg-white p-5 shadow-md shadow-slate-200/60 transition-all ${!s.enabled ? "opacity-60" : ""}`}
              >
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-black text-slate-900 text-base">{s.name}</span>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${pri.cls}`}>
                        {pri.label}
                      </span>
                    </div>
                    {s.category && (
                      <span className="mt-1 inline-block text-xs text-[#667eea] font-medium">
                        {s.category.nameAr}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleToggle(s)}
                    title={s.enabled ? "تعطيل" : "تفعيل"}
                    className="shrink-0 rounded-full p-1 hover:bg-slate-100 transition"
                  >
                    {s.enabled
                      ? <CheckCircle className="size-5 text-emerald-500" />
                      : <XCircle className="size-5 text-slate-400" />
                    }
                  </button>
                </div>

                <div className="space-y-1.5 text-xs text-slate-500 mb-4">
                  <div className="flex items-center gap-1.5 truncate">
                    <Rss className="size-3 shrink-0" />
                    <span className="truncate">{s.rssUrl}</span>
                  </div>
                  {s.website && (
                    <div className="flex items-center gap-1.5 truncate">
                      <Globe className="size-3 shrink-0" />
                      <span className="truncate">{s.website}</span>
                    </div>
                  )}
                  {s.lastSyncedAt && (
                    <p className="text-slate-400">
                      آخر مزامنة: {format(new Date(s.lastSyncedAt), "yyyy-MM-dd HH:mm")}
                    </p>
                  )}
                  {s._count && (
                    <p className="text-slate-400">{s._count.queueItems} عنصر في الطابور</p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleSync(s.id)}
                    disabled={isSyncing || !s.enabled}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#667eea]/10 py-2 text-xs font-semibold text-[#667eea] hover:bg-[#667eea]/20 disabled:opacity-40 transition"
                  >
                    {isSyncing
                      ? <Loader2 className="size-3.5 animate-spin" />
                      : <RefreshCw className="size-3.5" />
                    }
                    مزامنة الآن
                  </button>
                  <button
                    onClick={() => openEdit(s)}
                    className="rounded-xl bg-slate-100 p-2 text-slate-600 hover:bg-slate-200 transition"
                  >
                    <Pencil className="size-4" />
                  </button>
                  <button
                    onClick={() => setDeleteId(s.id)}
                    className="rounded-xl bg-slate-100 p-2 text-slate-600 hover:bg-red-50 hover:text-red-600 transition"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" dir="rtl">
          <div className="w-full max-w-lg rounded-[2rem] bg-white p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="mb-6 text-xl font-black text-slate-900">
              {editingId ? "تعديل المصدر" : "إضافة مصدر جديد"}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">الاسم *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className={inputCls}
                  placeholder="مثال: TechCrunch"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">رابط RSS *</label>
                <input
                  value={form.rssUrl}
                  onChange={(e) => setForm((f) => ({ ...f, rssUrl: e.target.value }))}
                  className={inputCls}
                  placeholder="https://techcrunch.com/feed/"
                  dir="ltr"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">رابط الموقع</label>
                <input
                  value={form.website}
                  onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
                  className={inputCls}
                  placeholder="https://techcrunch.com"
                  dir="ltr"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">الأولوية (1-10)</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={form.priority}
                    onChange={(e) => setForm((f) => ({ ...f, priority: Number(e.target.value) }))}
                    className={inputCls}
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">التصنيف</label>
                  <select
                    value={form.categoryId}
                    onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
                    className={inputCls}
                  >
                    <option value="">بدون تصنيف</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.nameAr}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="flex cursor-pointer items-center gap-3 select-none">
                  <div className="relative">
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={form.enabled}
                      onChange={(e) => setForm((f) => ({ ...f, enabled: e.target.checked }))}
                    />
                    <div className={`h-6 w-11 rounded-full transition-colors ${form.enabled ? "bg-[#667eea]" : "bg-slate-200"}`} />
                    <div className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${form.enabled ? "-translate-x-5" : "-translate-x-0.5"}`} />
                  </div>
                  <span className="text-sm font-semibold text-slate-700">
                    {form.enabled ? "مفعّل" : "معطّل"}
                  </span>
                </label>
              </div>
            </div>
            <div className="mt-8 flex justify-end gap-3">
              <button
                onClick={() => setShowForm(false)}
                className="rounded-2xl bg-slate-100 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-200"
              >
                إلغاء
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 rounded-2xl bg-[#667eea] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#5a6fd6] disabled:opacity-60"
              >
                {saving && <Loader2 className="size-4 animate-spin" />}
                {editingId ? "حفظ التعديلات" : "إضافة المصدر"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" dir="rtl">
          <div className="w-full max-w-md rounded-[2rem] bg-white p-8 shadow-2xl">
            <h2 className="text-xl font-black text-slate-900">تأكيد الحذف</h2>
            <p className="mt-3 text-slate-600">سيتم حذف المصدر وجميع عناصر الطابور المرتبطة به.</p>
            <div className="mt-6 flex justify-end gap-3">
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
                حذف
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
