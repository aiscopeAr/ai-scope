"use client";

import * as React from "react";
import { Plus, Pencil, Trash2, Loader2, Wrench, ExternalLink, Wand2, Star, CheckCircle, Clock, RefreshCw } from "lucide-react";
import { useToast } from "@/components/ui/toast";

const inputCls = "w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-[#667eea] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#667eea]/20 transition";
const labelCls = "mb-1.5 block text-sm font-semibold text-slate-700";

const CATEGORIES = [
  { value: "writing",           label: "Writing & Content" },
  { value: "coding",            label: "Coding & Development" },
  { value: "image",             label: "Image Generation" },
  { value: "video",             label: "Video" },
  { value: "voice",             label: "Voice & Music" },
  { value: "marketing",         label: "Marketing" },
  { value: "education",         label: "Education" },
  { value: "startups",          label: "Startups" },
  { value: "ecommerce",         label: "E-commerce" },
  { value: "automation",        label: "Automation" },
  { value: "customer-support",  label: "Customer Support" },
  { value: "productivity",      label: "Productivity" },
  { value: "legal",             label: "Legal" },
  { value: "finance",           label: "Finance" },
  { value: "healthcare",        label: "Healthcare" },
  { value: "students",          label: "Students" },
  { value: "no-code",           label: "No-Code" },
  { value: "presentations",     label: "Presentations" },
  { value: "other",             label: "Other" },
];

type Tool = {
  id: string; name: string; slug: string; tagline: string | null;
  descriptionAr: string; contentAr: string | null; website: string | null;
  logoUrl: string | null; screenshots: string[]; toolCategory: string;
  pricing: string; monthlyPrice: number | null; pricingDetails: string | null;
  pros: string[]; cons: string[]; useCases: string[];
  arabicSupport: boolean; hasApi: boolean; tags: string[];
  seoTitle: string | null; seoDescription: string | null;
  featured: boolean; editorPick: boolean; published: boolean;
  viewCount: number; likes: number; sourceUrl: string | null;
};

type FormState = {
  name: string; slug: string; tagline: string; descriptionAr: string;
  contentAr: string; website: string; logoUrl: string; screenshots: string;
  toolCategory: string; pricing: string; monthlyPrice: string; pricingDetails: string;
  pros: string; cons: string; useCases: string; tags: string;
  arabicSupport: boolean; hasApi: boolean;
  seoTitle: string; seoDescription: string;
  featured: boolean; editorPick: boolean; published: boolean;
  sourceUrl: string;
};

const empty: FormState = {
  name: "", slug: "", tagline: "", descriptionAr: "", contentAr: "",
  website: "", logoUrl: "", screenshots: "", toolCategory: "other",
  pricing: "freemium", monthlyPrice: "", pricingDetails: "",
  pros: "", cons: "", useCases: "", tags: "",
  arabicSupport: false, hasApi: false,
  seoTitle: "", seoDescription: "",
  featured: false, editorPick: false, published: true, sourceUrl: "",
};

function autoSlug(name: string) {
  return name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").slice(0, 50);
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
  const [generatingId, setGeneratingId] = React.useState<string | null>(null);
  const [filterCat, setFilterCat] = React.useState("");
  const [filterStatus, setFilterStatus] = React.useState("");
  const [activeTab, setActiveTab] = React.useState<"all" | "pending">("pending");
  const [ingesting, setIngesting] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/ai-tools");
      if (res.ok) setTools(await res.json());
    } catch { toast("Load failed", "error"); }
    finally { setLoading(false); }
  }, [toast]);

  React.useEffect(() => { load(); }, [load]);

  function set(k: keyof FormState, v: string | boolean) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function openNew() { setForm(empty); setEditId(null); setShowForm(true); }

  function openEdit(t: Tool) {
    setForm({
      name: t.name, slug: t.slug, tagline: t.tagline ?? "",
      descriptionAr: t.descriptionAr, contentAr: t.contentAr ?? "",
      website: t.website ?? "", logoUrl: t.logoUrl ?? "",
      screenshots: t.screenshots.join("\n"),
      toolCategory: t.toolCategory, pricing: t.pricing,
      monthlyPrice: t.monthlyPrice?.toString() ?? "",
      pricingDetails: t.pricingDetails ?? "",
      pros: t.pros.join("\n"), cons: t.cons.join("\n"),
      useCases: t.useCases.join("\n"), tags: t.tags.join(", "),
      arabicSupport: t.arabicSupport, hasApi: t.hasApi,
      seoTitle: t.seoTitle ?? "", seoDescription: t.seoDescription ?? "",
      featured: t.featured, editorPick: t.editorPick, published: t.published,
      sourceUrl: t.sourceUrl ?? "",
    });
    setEditId(t.id);
    setShowForm(true);
  }

  async function save() {
    if (!form.name || !form.slug || !form.descriptionAr) {
      toast("Name, slug, and description are required", "error"); return;
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
          tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
          screenshots: splitLines(form.screenshots),
          monthlyPrice: form.monthlyPrice ? Number(form.monthlyPrice) : null,
        }),
      });
      if (!res.ok) { const e = await res.json(); toast(e.error ?? "Save failed", "error"); return; }
      toast(editId ? "Updated" : "Created");
      setShowForm(false); load();
    } catch { toast("Save failed", "error"); }
    finally { setSaving(false); }
  }

  async function del() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await fetch(`/api/admin/ai-tools/${deleteId}`, { method: "DELETE" });
      toast("Deleted"); setDeleteId(null); load();
    } catch { toast("Delete failed", "error"); }
    finally { setDeleting(false); }
  }

  async function regenerate(id: string) {
    setGeneratingId(id);
    try {
      const res = await fetch(`/api/admin/ai-tools/${id}/regenerate`, { method: "POST" });
      if (res.ok) { toast("AI content regenerated"); load(); }
      else toast("Regeneration failed", "error");
    } catch { toast("Regeneration failed", "error"); }
    finally { setGeneratingId(null); }
  }

  async function togglePublished(t: Tool) {
    await fetch(`/api/admin/ai-tools/${t.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...t, published: !t.published, monthlyPrice: t.monthlyPrice, tags: t.tags, screenshots: t.screenshots }),
    });
    load();
  }

  async function runIngest() {
    setIngesting(true);
    try {
      const res = await fetch("/api/cron/ingest-tools", {
        headers: { authorization: `Bearer ${process.env.NEXT_PUBLIC_CRON_SECRET ?? "dev"}` },
      });
      const data = await res.json();
      toast(`✅ ${data.created ?? 0} نُشر، ${data.duplicates ?? 0} مكرر، ${data.failed ?? 0} فشل`);
      load();
    } catch {
      toast("فشل الـ ingest", "error");
    } finally {
      setIngesting(false);
    }
  }

  const pending = tools.filter((t) => !t.published);
  const filtered = tools.filter((t) => {
    if (!t.published) return false; // pending queue is separate tab
    if (filterCat && t.toolCategory !== filterCat) return false;
    return true;
  });

  return (
    <div className="container mx-auto px-4 py-8" dir="rtl">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 rounded-[2rem] bg-white p-6 shadow-lg shadow-slate-200/60 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="mb-1 text-sm font-semibold text-[#667eea]">Admin Panel</p>
          <h1 className="text-3xl font-black text-slate-900">AI Tools Directory</h1>
          <p className="mt-1 text-slate-500">{tools.filter((t) => t.published).length} published · <span className={pending.length > 0 ? "text-amber-600 font-semibold" : ""}>{pending.length} ينتظر الموافقة</span></p>
        </div>
        <div className="flex flex-wrap gap-3">
          <a href="/admin" className="rounded-2xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200 transition">Dashboard</a>
          <a href="/ai-tools" target="_blank" rel="noopener" className="flex items-center gap-1.5 rounded-2xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200 transition">
            <ExternalLink className="size-3.5" /> View Site
          </a>
          <button
            onClick={runIngest}
            disabled={ingesting}
            className="flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-60 transition"
          >
            {ingesting ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
            Ingest from ProductHunt
          </button>
          <button onClick={openNew} className="flex items-center gap-2 rounded-2xl bg-[#667eea] px-5 py-2 text-sm font-semibold text-white hover:bg-[#5a6fd6] transition">
            <Plus className="size-4" /> Add Tool
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-2">
        <button
          onClick={() => setActiveTab("pending")}
          className={`flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold transition ${activeTab === "pending" ? "bg-amber-500 text-white" : "bg-white text-slate-600 shadow-sm hover:bg-slate-50"}`}
        >
          <Clock className="size-3.5" />
          ينتظر الموافقة
          {pending.length > 0 && <span className={`rounded-full px-1.5 text-xs font-black ${activeTab === "pending" ? "bg-white/25 text-white" : "bg-amber-100 text-amber-700"}`}>{pending.length}</span>}
        </button>
        <button
          onClick={() => setActiveTab("all")}
          className={`flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold transition ${activeTab === "all" ? "bg-[#667eea] text-white" : "bg-white text-slate-600 shadow-sm hover:bg-slate-50"}`}
        >
          <Wrench className="size-3.5" />
          كل الأدوات ({tools.filter((t) => t.published).length})
        </button>
      </div>

      {/* Pending approval queue */}
      {activeTab === "pending" && (
        loading ? (
          <div className="flex justify-center py-32"><Loader2 className="size-8 animate-spin text-amber-500" /></div>
        ) : pending.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-[2rem] bg-white py-24 shadow-lg shadow-slate-200/60">
            <CheckCircle className="size-12 text-emerald-300 mb-4" />
            <p className="text-lg font-semibold text-slate-700">لا توجد أدوات تنتظر الموافقة</p>
            <p className="mt-2 text-sm text-slate-400">ستظهر هنا الأدوات القادمة من ProductHunt</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pending.map((t) => (
              <div key={t.id} className="flex flex-col gap-3 rounded-[2rem] border-2 border-amber-200 bg-amber-50 p-5 sm:flex-row sm:items-start">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  {t.logoUrl
                    ? <img src={t.logoUrl} alt={t.name} className="h-12 w-12 rounded-2xl object-cover border border-amber-200 shrink-0" />
                    : <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-200 text-amber-700 font-black text-xl shrink-0">{t.name[0]}</div>
                  }
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <p className="font-black text-slate-900 text-lg">{t.name}</p>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${t.pricing === "free" ? "bg-emerald-100 text-emerald-700" : t.pricing === "paid" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>{t.pricing}</span>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">{t.toolCategory}</span>
                      {t.sourceUrl && <a href={t.sourceUrl} target="_blank" rel="noopener" className="flex items-center gap-1 text-xs text-blue-600 hover:underline"><ExternalLink className="size-3" /> ProductHunt</a>}
                    </div>
                    <p className="text-sm text-slate-600 line-clamp-2">{t.descriptionAr}</p>
                    {t.tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {t.tags.slice(0, 5).map((tag) => (
                          <span key={tag} className="rounded-full bg-white border border-slate-200 px-2 py-0.5 text-xs text-slate-500">{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {t.website && (
                    <a href={t.website} target="_blank" rel="noopener" className="flex items-center gap-1 rounded-xl bg-white border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition">
                      <ExternalLink className="size-3" /> الموقع
                    </a>
                  )}
                  <button
                    onClick={() => regenerate(t.id)}
                    disabled={generatingId === t.id}
                    className="flex items-center gap-1 rounded-xl bg-white border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition"
                  >
                    {generatingId === t.id ? <Loader2 className="size-3 animate-spin" /> : <Wand2 className="size-3" />}
                    أعد التوليد
                  </button>
                  <button onClick={() => openEdit(t)} className="flex items-center gap-1 rounded-xl bg-white border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition">
                    <Pencil className="size-3" /> تعديل
                  </button>
                  <button
                    onClick={() => togglePublished(t)}
                    className="flex items-center gap-1 rounded-xl bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-emerald-500 transition"
                  >
                    <CheckCircle className="size-3" /> نشر ✓
                  </button>
                  <button onClick={() => setDeleteId(t.id)} className="rounded-xl bg-red-50 border border-red-200 p-1.5 text-red-400 hover:text-red-600 transition">
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* All published tools */}
      {activeTab === "all" && (
        <>
          {/* Filters */}
          <div className="mb-6 flex flex-wrap gap-3">
            <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:outline-none">
              <option value="">All Categories</option>
              {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
            <span className="flex items-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500 shadow-sm">{filtered.length} results</span>
          </div>

          {loading ? (
            <div className="flex justify-center py-32"><Loader2 className="size-8 animate-spin text-[#667eea]" /></div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-[2rem] bg-white py-24 shadow-lg shadow-slate-200/60">
              <Wrench className="size-12 text-slate-300 mb-4" />
              <p className="text-lg font-semibold text-slate-700">No tools yet</p>
              <button onClick={openNew} className="mt-6 flex items-center gap-2 rounded-2xl bg-[#667eea] px-5 py-2.5 text-sm font-semibold text-white">
                <Plus className="size-4" /> Add Tool
              </button>
            </div>
          ) : (
            <div className="rounded-[2rem] bg-white shadow-lg shadow-slate-200/60 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-100 bg-slate-50">
                  <tr>
                    <th className="px-5 py-3 text-right font-semibold text-slate-600">Tool</th>
                    <th className="px-5 py-3 text-right font-semibold text-slate-600 hidden lg:table-cell">Category</th>
                    <th className="px-5 py-3 text-right font-semibold text-slate-600 hidden md:table-cell">Pricing</th>
                    <th className="px-5 py-3 text-right font-semibold text-slate-600 hidden md:table-cell">Stats</th>
                    <th className="px-5 py-3 text-right font-semibold text-slate-600">Status</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50 transition">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          {t.logoUrl && <img src={t.logoUrl} alt={t.name} className="h-7 w-7 rounded-lg object-cover border border-slate-100" />}
                          <div>
                            <p className="font-semibold text-slate-900 flex items-center gap-1.5">
                              {t.name}
                              {t.editorPick && <Star className="size-3 text-amber-400 fill-amber-400" />}
                              {t.featured && <span className="text-[10px] font-bold text-violet-600 bg-violet-100 px-1.5 rounded">featured</span>}
                            </p>
                            <p className="text-xs text-slate-400">{t.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 hidden lg:table-cell text-slate-600 text-xs">{t.toolCategory}</td>
                      <td className="px-5 py-4 hidden md:table-cell">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${t.pricing === "free" ? "bg-emerald-100 text-emerald-700" : t.pricing === "paid" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
                          {t.pricing}{t.monthlyPrice ? ` $${t.monthlyPrice}` : ""}
                        </span>
                      </td>
                      <td className="px-5 py-4 hidden md:table-cell text-xs text-slate-500">
                        👁 {t.viewCount} · ♥ {t.likes}
                        {t.arabicSupport && <span className="ml-1 text-teal-600">عربي</span>}
                        {t.hasApi && <span className="ml-1 text-blue-600">API</span>}
                      </td>
                      <td className="px-5 py-4">
                        <button onClick={() => togglePublished(t)} className={`rounded-full px-2.5 py-0.5 text-xs font-bold transition ${t.published ? "bg-emerald-100 text-emerald-700 hover:bg-red-100 hover:text-red-700" : "bg-amber-100 text-amber-700 hover:bg-emerald-100 hover:text-emerald-700"}`}>
                          {t.published ? "Published" : "Draft"}
                        </button>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-1.5">
                          <a href={`/ai-tools/${t.slug}`} target="_blank" rel="noopener" className="rounded-lg bg-slate-100 p-1.5 text-slate-500 hover:text-[#667eea] transition"><ExternalLink className="size-3.5" /></a>
                          <button
                            onClick={() => regenerate(t.id)}
                            disabled={generatingId === t.id}
                            title="Regenerate AI content"
                            className="rounded-lg bg-slate-100 p-1.5 text-slate-500 hover:text-emerald-600 disabled:opacity-40 transition"
                          >
                            {generatingId === t.id ? <Loader2 className="size-3.5 animate-spin" /> : <Wand2 className="size-3.5" />}
                          </button>
                          <button onClick={() => openEdit(t)} className="rounded-lg bg-slate-100 p-1.5 text-slate-500 hover:text-[#667eea] transition"><Pencil className="size-3.5" /></button>
                          <button onClick={() => setDeleteId(t.id)} className="rounded-lg bg-slate-100 p-1.5 text-slate-500 hover:text-red-600 transition"><Trash2 className="size-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 backdrop-blur-sm p-4 pt-8" dir="rtl">
          <div className="w-full max-w-3xl rounded-[2rem] bg-white p-8 shadow-2xl mb-10">
            <h2 className="mb-6 text-xl font-black text-slate-900">{editId ? "Edit Tool" : "Add Tool"}</h2>

            <div className="space-y-4">
              {/* Row 1: name + slug */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Name *</label>
                  <input value={form.name} onChange={(e) => { set("name", e.target.value); if (!editId) set("slug", autoSlug(e.target.value)); }} className={inputCls} placeholder="ChatGPT" />
                </div>
                <div>
                  <label className={labelCls}>Slug *</label>
                  <input value={form.slug} onChange={(e) => set("slug", e.target.value)} className={inputCls} dir="ltr" placeholder="chatgpt" />
                </div>
              </div>

              <div>
                <label className={labelCls}>Tagline</label>
                <input value={form.tagline} onChange={(e) => set("tagline", e.target.value)} className={inputCls} placeholder="World's most popular AI assistant" />
              </div>

              <div>
                <label className={labelCls}>Short Arabic Description *</label>
                <textarea rows={3} value={form.descriptionAr} onChange={(e) => set("descriptionAr", e.target.value)} className={inputCls} />
              </div>

              <div>
                <label className={labelCls}>Full Arabic Review (contentAr)</label>
                <textarea rows={6} value={form.contentAr} onChange={(e) => set("contentAr", e.target.value)} className={inputCls} placeholder="Long-form Arabic review..." />
              </div>

              {/* Row: website + logo */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Website</label>
                  <input value={form.website} onChange={(e) => set("website", e.target.value)} className={inputCls} dir="ltr" placeholder="https://..." />
                </div>
                <div>
                  <label className={labelCls}>Logo URL</label>
                  <input value={form.logoUrl} onChange={(e) => set("logoUrl", e.target.value)} className={inputCls} dir="ltr" placeholder="https://..." />
                </div>
              </div>

              <div>
                <label className={labelCls}>Screenshots (one URL per line)</label>
                <textarea rows={3} value={form.screenshots} onChange={(e) => set("screenshots", e.target.value)} className={inputCls} dir="ltr" placeholder="https://example.com/screen1.jpg" />
              </div>

              {/* Row: category + pricing + price */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className={labelCls}>Category</label>
                  <select value={form.toolCategory} onChange={(e) => set("toolCategory", e.target.value)} className={inputCls}>
                    {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Pricing</label>
                  <select value={form.pricing} onChange={(e) => set("pricing", e.target.value)} className={inputCls}>
                    <option value="free">Free</option>
                    <option value="freemium">Freemium</option>
                    <option value="paid">Paid</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Monthly Price ($)</label>
                  <input value={form.monthlyPrice} onChange={(e) => set("monthlyPrice", e.target.value)} className={inputCls} dir="ltr" type="number" placeholder="20" />
                </div>
              </div>

              <div>
                <label className={labelCls}>Pricing Details (markdown)</label>
                <textarea rows={3} value={form.pricingDetails} onChange={(e) => set("pricingDetails", e.target.value)} className={inputCls} placeholder="Free: 10 requests/day&#10;Pro $20/mo: unlimited" />
              </div>

              {/* Pros / Cons / Use Cases */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Pros (one per line)</label>
                  <textarea rows={4} value={form.pros} onChange={(e) => set("pros", e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Cons (one per line)</label>
                  <textarea rows={4} value={form.cons} onChange={(e) => set("cons", e.target.value)} className={inputCls} />
                </div>
              </div>

              <div>
                <label className={labelCls}>Use Cases (one per line)</label>
                <textarea rows={3} value={form.useCases} onChange={(e) => set("useCases", e.target.value)} className={inputCls} />
              </div>

              <div>
                <label className={labelCls}>Tags (comma-separated)</label>
                <input value={form.tags} onChange={(e) => set("tags", e.target.value)} className={inputCls} placeholder="chatbot, writing, gpt" />
              </div>

              {/* SEO */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>SEO Title</label>
                  <input value={form.seoTitle} onChange={(e) => set("seoTitle", e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Source URL</label>
                  <input value={form.sourceUrl} onChange={(e) => set("sourceUrl", e.target.value)} className={inputCls} dir="ltr" placeholder="https://producthunt.com/..." />
                </div>
              </div>

              <div>
                <label className={labelCls}>SEO Description</label>
                <textarea rows={2} value={form.seoDescription} onChange={(e) => set("seoDescription", e.target.value)} className={inputCls} />
              </div>

              {/* Toggles */}
              <div className="flex flex-wrap gap-6">
                {([
                  ["arabicSupport", "Arabic Support"],
                  ["hasApi", "Has API"],
                  ["featured", "Featured"],
                  ["editorPick", "Editor Pick"],
                  ["published", "Published"],
                ] as const).map(([key, label]) => (
                  <label key={key} className="flex cursor-pointer items-center gap-2.5 select-none">
                    <div className="relative">
                      <input type="checkbox" className="sr-only" checked={!!form[key]} onChange={(e) => set(key, e.target.checked)} />
                      <div className={`h-5 w-10 rounded-full transition-colors ${form[key] ? "bg-[#667eea]" : "bg-slate-200"}`} />
                      <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${form[key] ? "-translate-x-5" : "-translate-x-0.5"}`} />
                    </div>
                    <span className="text-sm font-semibold text-slate-700">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <button onClick={() => setShowForm(false)} className="rounded-2xl bg-slate-100 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-200">Cancel</button>
              <button onClick={save} disabled={saving} className="flex items-center gap-2 rounded-2xl bg-[#667eea] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#5a6fd6] disabled:opacity-60">
                {saving && <Loader2 className="size-4 animate-spin" />}
                {editId ? "Save" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" dir="rtl">
          <div className="w-full max-w-md rounded-[2rem] bg-white p-8 shadow-2xl">
            <h2 className="text-xl font-black text-slate-900">Confirm Delete</h2>
            <p className="mt-3 text-slate-600">This tool will be permanently deleted.</p>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setDeleteId(null)} disabled={deleting} className="rounded-2xl bg-slate-100 px-5 py-2.5 text-sm font-semibold text-slate-700">Cancel</button>
              <button onClick={del} disabled={deleting} className="flex items-center gap-2 rounded-2xl bg-red-500 px-5 py-2.5 text-sm font-semibold text-white">
                {deleting && <Loader2 className="size-4 animate-spin" />} Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
