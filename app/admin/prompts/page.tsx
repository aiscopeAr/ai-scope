"use client";

import * as React from "react";
import { Plus, Pencil, Trash2, Loader2, Eye, EyeOff, Star, Copy, ExternalLink } from "lucide-react";
import { useToast } from "@/components/ui/toast";

const inputCls = "w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition";
const labelCls = "mb-1.5 block text-sm font-semibold text-slate-700";

const PROMPT_CATEGORIES = [
  { value: "image",     label: "🎨 توليد الصور" },
  { value: "writing",   label: "✍️ الكتابة" },
  { value: "code",      label: "💻 البرمجة" },
  { value: "marketing", label: "📣 التسويق" },
  { value: "general",   label: "✨ عام" },
];

type Prompt = {
  id: string;
  title: string;
  titleAr: string;
  body: string;
  bodyAr: string | null;
  description: string | null;
  category: string;
  tags: string[];
  slug: string;
  featured: boolean;
  published: boolean;
  viewCount: number;
  createdAt: string;
  tool: { id: string; name: string; slug: string; logoUrl: string | null } | null;
};

type FormState = {
  title: string; titleAr: string; body: string; bodyAr: string; description: string;
  category: string; toolId: string; tags: string; slug: string;
  featured: boolean; published: boolean;
};

const empty: FormState = {
  title: "", titleAr: "", body: "", bodyAr: "", description: "",
  category: "general", toolId: "", tags: "", slug: "",
  featured: false, published: true,
};

function autoSlug(title: string) {
  return title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").slice(0, 80);
}

export default function AdminPromptsPage() {
  const { toast } = useToast();
  const [prompts, setPrompts] = React.useState<Prompt[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showForm, setShowForm] = React.useState(false);
  const [editId, setEditId] = React.useState<string | null>(null);
  const [form, setForm] = React.useState<FormState>(empty);
  const [saving, setSaving] = React.useState(false);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);
  const [deleting, setDeleting] = React.useState(false);
  const [filterCat, setFilterCat] = React.useState("all");
  const [search, setSearch] = React.useState("");
  const [expandedId, setExpandedId] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/prompts?limit=200");
      if (res.ok) { const d = await res.json(); setPrompts(d.prompts ?? []); }
    } catch { toast("فشل التحميل", "error"); }
    finally { setLoading(false); }
  }, [toast]);

  React.useEffect(() => { load(); }, [load]);

  function set(k: keyof FormState, v: string | boolean) {
    setForm(f => ({ ...f, [k]: v }));
  }

  function openNew() { setForm(empty); setEditId(null); setShowForm(true); }

  function openEdit(p: Prompt) {
    setForm({
      title: p.title, titleAr: p.titleAr, body: p.body,
      bodyAr: p.bodyAr ?? "", description: p.description ?? "",
      category: p.category, toolId: p.tool?.id ?? "",
      tags: p.tags.join(", "), slug: p.slug,
      featured: p.featured, published: p.published,
    });
    setEditId(p.id);
    setShowForm(true);
  }

  async function save() {
    if (!form.title || !form.titleAr || !form.body || !form.slug) {
      toast("العنوان (EN + AR) والنص والـ slug مطلوبة", "error"); return;
    }
    setSaving(true);
    try {
      const url = editId ? `/api/admin/prompts/${editId}` : "/api/admin/prompts";
      const res = await fetch(url, {
        method: editId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          tags: form.tags.split(",").map(t => t.trim()).filter(Boolean),
          toolId: form.toolId || null,
          bodyAr: form.bodyAr || null,
        }),
      });
      if (!res.ok) { const e = await res.json(); toast(e.error ?? "فشل الحفظ", "error"); return; }
      toast(editId ? "✅ تم التحديث" : "✅ تم الإنشاء");
      setShowForm(false);
      load();
    } catch { toast("فشل الحفظ", "error"); }
    finally { setSaving(false); }
  }

  async function del() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await fetch(`/api/admin/prompts/${deleteId}`, { method: "DELETE" });
      toast("✅ تم الحذف"); setDeleteId(null); load();
    } catch { toast("فشل الحذف", "error"); }
    finally { setDeleting(false); }
  }

  async function togglePublished(p: Prompt) {
    await fetch(`/api/admin/prompts/${p.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ published: !p.published }),
    });
    load();
  }

  async function toggleFeatured(p: Prompt) {
    await fetch(`/api/admin/prompts/${p.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ featured: !p.featured }),
    });
    load();
  }

  async function runGenerate() {
    try {
      const res = await fetch("/api/cron/generate-prompts", {
        headers: { authorization: `Bearer ${process.env.NEXT_PUBLIC_CRON_SECRET ?? "dev"}` },
      });
      const data = await res.json();
      toast(`✅ تم توليد ${data.generated ?? 0} برومبت`);
      load();
    } catch { toast("فشل التوليد", "error"); }
  }

  const filtered = prompts.filter(p => {
    if (filterCat !== "all" && p.category !== filterCat) return false;
    if (search && !p.titleAr.includes(search) && !p.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const catLabel = (cat: string) => PROMPT_CATEGORIES.find(c => c.value === cat)?.label ?? cat;

  return (
    <div className="p-6 space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">مكتبة البرومبتس</h1>
          <p className="text-sm text-slate-500 mt-0.5">{prompts.length} برومبت إجمالاً</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={runGenerate}
            className="flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100"
          >
            <span>🤖</span> توليد تلقائي
          </button>
          <button
            onClick={openNew}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" /> إضافة برومبت
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          type="search"
          placeholder="بحث..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 w-56"
        />
        <select
          value={filterCat}
          onChange={e => setFilterCat(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-700 outline-none focus:border-indigo-400"
        >
          <option value="all">كل الفئات</option>
          {PROMPT_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
        <span className="self-center text-sm text-slate-400">{filtered.length} نتيجة</span>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white py-20 text-center">
          <p className="text-4xl mb-3">📝</p>
          <p className="text-slate-500">لا توجد برومبتس</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-100 bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-right font-semibold text-slate-600">البرومبت</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-600 hidden md:table-cell">الفئة</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-600 hidden lg:table-cell">الأداة</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-600 hidden lg:table-cell">المشاهدات</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-600">الحالة</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(p => (
                <React.Fragment key={p.id}>
                  <tr className="hover:bg-slate-50 transition-colors">
                    {/* Title */}
                    <td className="px-4 py-3 max-w-xs">
                      <div className="flex items-start gap-2">
                        <button
                          onClick={() => setExpandedId(expandedId === p.id ? null : p.id)}
                          className="mt-0.5 shrink-0 text-slate-400 hover:text-indigo-500 transition-colors"
                          title="عرض النص"
                        >
                          {expandedId === p.id
                            ? <EyeOff className="h-4 w-4" />
                            : <Eye className="h-4 w-4" />
                          }
                        </button>
                        <div>
                          <p className="font-semibold text-slate-800 leading-snug">{p.titleAr}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{p.title}</p>
                          {p.description && (
                            <p className="text-xs text-slate-500 mt-1 line-clamp-1">{p.description}</p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                        {catLabel(p.category)}
                      </span>
                    </td>

                    {/* Tool */}
                    <td className="px-4 py-3 hidden lg:table-cell">
                      {p.tool ? (
                        <span className="text-xs text-slate-600">{p.tool.name}</span>
                      ) : (
                        <span className="text-xs text-slate-400">عام</span>
                      )}
                    </td>

                    {/* Views */}
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-xs text-slate-500">{p.viewCount}</span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => togglePublished(p)}
                          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold transition ${
                            p.published
                              ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                              : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                          }`}
                          title={p.published ? "إيقاف النشر" : "نشر"}
                        >
                          {p.published ? "منشور" : "مخفي"}
                        </button>
                        {p.featured && (
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => toggleFeatured(p)}
                          className={`rounded-lg p-1.5 transition ${
                            p.featured
                              ? "text-amber-500 hover:bg-amber-50"
                              : "text-slate-400 hover:bg-slate-100 hover:text-amber-500"
                          }`}
                          title={p.featured ? "إلغاء التمييز" : "تمييز"}
                        >
                          <Star className={`h-4 w-4 ${p.featured ? "fill-amber-400" : ""}`} />
                        </button>
                        <a
                          href={`/prompts/${p.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-indigo-600"
                          title="عرض في الموقع"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                        <button
                          onClick={() => openEdit(p)}
                          className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-indigo-600"
                          title="تعديل"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteId(p.id)}
                          className="rounded-lg p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-500"
                          title="حذف"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* Expanded body */}
                  {expandedId === p.id && (
                    <tr>
                      <td colSpan={6} className="px-4 pb-4 pt-0">
                        <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-indigo-700">نص البرومبت</span>
                            <button
                              onClick={() => navigator.clipboard.writeText(p.body).then(() => toast("✅ تم النسخ"))}
                              className="flex items-center gap-1 rounded-lg bg-indigo-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-indigo-700 transition"
                            >
                              <Copy className="h-3 w-3" /> نسخ
                            </button>
                          </div>
                          <pre className="whitespace-pre-wrap font-mono text-xs text-slate-700 leading-relaxed max-h-60 overflow-y-auto">
                            {p.body}
                          </pre>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-8 overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl" dir="rtl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h2 className="text-lg font-bold text-slate-900">
                {editId ? "تعديل برومبت" : "إضافة برومبت جديد"}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600 text-xl leading-none">✕</button>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Title EN */}
              <div>
                <label className={labelCls}>العنوان بالإنجليزية *</label>
                <input
                  className={inputCls}
                  value={form.title}
                  onChange={e => {
                    set("title", e.target.value);
                    if (!editId) set("slug", autoSlug(e.target.value));
                  }}
                  placeholder="Professional Email Writer"
                />
              </div>

              {/* Title AR */}
              <div>
                <label className={labelCls}>العنوان بالعربية *</label>
                <input className={inputCls} value={form.titleAr} onChange={e => set("titleAr", e.target.value)} placeholder="كاتب الإيميلات المحترف" />
              </div>

              {/* Slug */}
              <div>
                <label className={labelCls}>Slug *</label>
                <input className={inputCls} value={form.slug} onChange={e => set("slug", e.target.value)} dir="ltr" placeholder="professional-email-writer" />
              </div>

              {/* Category */}
              <div>
                <label className={labelCls}>الفئة *</label>
                <select className={inputCls} value={form.category} onChange={e => set("category", e.target.value)}>
                  {PROMPT_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className={labelCls}>وصف قصير (بالعربية)</label>
                <textarea className={inputCls} rows={2} value={form.description} onChange={e => set("description", e.target.value)} placeholder="شرح مختصر لما يفعله هذا البرومبت..." />
              </div>

              {/* Body EN */}
              <div>
                <label className={labelCls}>نص البرومبت * <span className="font-normal text-slate-400">(English)</span></label>
                <textarea
                  className={`${inputCls} font-mono`}
                  rows={7}
                  dir="ltr"
                  value={form.body}
                  onChange={e => set("body", e.target.value)}
                  placeholder="You are a professional... Write a..."
                />
              </div>

              {/* Body AR */}
              <div>
                <label className={labelCls}>
                  النسخة العربية
                  <span className="mr-2 font-normal text-slate-400">(اختياري)</span>
                  <span className="mr-1 rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-600">عربي</span>
                </label>
                <textarea
                  className={`${inputCls} font-mono`}
                  rows={7}
                  dir="rtl"
                  value={form.bodyAr}
                  onChange={e => set("bodyAr", e.target.value)}
                  placeholder="أنت خبير في... اكتب لي..."
                />
              </div>

              {/* Tags */}
              <div>
                <label className={labelCls}>تاغات (مفصولة بفاصلة)</label>
                <input className={inputCls} value={form.tags} onChange={e => set("tags", e.target.value)} placeholder="email, business, writing" dir="ltr" />
              </div>

              {/* Toggles */}
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.published} onChange={e => set("published", e.target.checked)} className="h-4 w-4 rounded accent-indigo-600" />
                  <span className="text-sm font-medium text-slate-700">منشور</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.featured} onChange={e => set("featured", e.target.checked)} className="h-4 w-4 rounded accent-amber-500" />
                  <span className="text-sm font-medium text-slate-700">مميز ⭐</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-100 px-6 py-4">
              <button onClick={() => setShowForm(false)} className="rounded-xl border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition">
                إلغاء
              </button>
              <button onClick={save} disabled={saving} className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 transition">
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {editId ? "حفظ التغييرات" : "إنشاء"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl" dir="rtl">
            <p className="text-lg font-bold text-slate-900 mb-2">حذف البرومبت؟</p>
            <p className="text-sm text-slate-500 mb-5">لا يمكن التراجع عن هذا الإجراء.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteId(null)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">
                إلغاء
              </button>
              <button onClick={del} disabled={deleting} className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60">
                {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
                حذف
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
