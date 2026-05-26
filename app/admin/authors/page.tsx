"use client";

import * as React from "react";
import {
  Loader2, Save, RefreshCw, ExternalLink, Plus, Trash2,
  Upload, X, ChevronDown, ChevronUp, UserPlus,
} from "lucide-react";
import { useToast } from "@/components/ui/toast";

type AuthorData = {
  slug: string;
  nameAr: string;
  titleAr: string;
  bioAr: string;
  specialtyAr: string;
  avatarUrl: string;
  accentColor: string;
  systemPrompt: string;
  voiceTraits: string[];
  socialTwitter?: string;
  reviewCount: number;
};

const inputCls = "w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition";
const labelCls = "mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500";

const ACCENT_PRESETS = ["#6366f1", "#ec4899", "#f59e0b", "#10b981", "#06b6d4", "#8b5cf6", "#ef4444", "#f97316"];

// ─── Collapsible section ──────────────────────────────────────────────────────

function Section({ title, children, defaultOpen = true }: {
  title: string; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = React.useState(defaultOpen);
  return (
    <div className="rounded-2xl border border-slate-200 bg-white">
      <button type="button" onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-5 py-4 text-right">
        <span className="text-sm font-bold text-slate-700">{title}</span>
        {open ? <ChevronUp className="size-4 text-slate-400" /> : <ChevronDown className="size-4 text-slate-400" />}
      </button>
      {open && <div className="px-5 pb-5 space-y-4">{children}</div>}
    </div>
  );
}

// ─── Avatar upload widget ─────────────────────────────────────────────────────

function AvatarUpload({ value, onChange, accent }: {
  value: string; onChange: (url: string) => void; accent: string;
}) {
  const { toast } = useToast();
  const fileRef = React.useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = React.useState(false);

  async function handleFile(file: File) {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload-avatar", { method: "POST", body: fd });
      const data = await res.json() as { url?: string; error?: string; warning?: string };
      if (!res.ok || !data.url) throw new Error(data.error ?? "Upload failed");
      onChange(data.url);
      if (data.warning) toast(data.warning, "error");
      else toast("✅ تم رفع الصورة");
    } catch (err) {
      toast(err instanceof Error ? err.message : "فشل الرفع", "error");
    } finally {
      setUploading(false);
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  return (
    <div className="space-y-3">
      {/* Preview circle */}
      <div className="flex items-center gap-4">
        <div className="relative shrink-0">
          <div className="h-20 w-20 overflow-hidden rounded-full border-2" style={{ borderColor: accent }}>
            {value ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={value} alt="avatar" className="h-full w-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-2xl text-slate-600">👤</div>
            )}
          </div>
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/60">
              <Loader2 className="size-6 animate-spin text-white" />
            </div>
          )}
        </div>
        <div className="flex-1 space-y-2">
          {/* Drop zone */}
          <div
            onDrop={onDrop}
            onDragOver={e => e.preventDefault()}
            onClick={() => fileRef.current?.click()}
            className="flex cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-center transition hover:border-indigo-400 hover:bg-indigo-50/40"
          >
            <Upload className="size-5 text-slate-500" />
            <p className="text-xs text-slate-400">اسحب أو <span className="font-semibold text-indigo-500">اختر ملفاً</span></p>
            <p className="text-[10px] text-slate-400">PNG · JPG · WebP · SVG</p>
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
        </div>
      </div>

      {/* Manual URL */}
      <div>
        <label className={labelCls}>أو أدخل رابط مباشر</label>
        <div className="flex gap-2">
          <input value={value} onChange={e => onChange(e.target.value)}
            className={`${inputCls} flex-1`} dir="ltr" placeholder="https://... or /images/authors/..." />
          {value && (
            <button type="button" onClick={() => onChange("")}
              className="rounded-xl border border-slate-200 p-2.5 text-slate-400 hover:text-red-500 transition">
              <X className="size-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── New Author modal ─────────────────────────────────────────────────────────

function NewAuthorModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const { toast } = useToast();
  const [form, setForm] = React.useState({
    slug: "", nameAr: "", titleAr: "", bioAr: "",
    specialtyAr: "", accentColor: "#6366f1", avatarUrl: "",
  });
  const [saving, setSaving] = React.useState(false);

  function set<K extends keyof typeof form>(k: K, v: string) {
    setForm(f => ({
      ...f, [k]: v,
      ...(k === "nameAr" && !f.slug ? { slug: v.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") } : {}),
    }));
  }

  async function create() {
    if (!form.slug || !form.nameAr) { toast("الاسم والـ slug مطلوبان", "error"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/authors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed");
      toast(`✅ تم إنشاء الكاتب ${form.nameAr}`);
      onCreated();
      onClose();
    } catch (err) {
      toast(err instanceof Error ? err.message : "فشل الإنشاء", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" dir="rtl">
      <div className="w-full max-w-lg rounded-[2rem] bg-[#0f0f17] border border-white/10 shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/8 px-6 py-5">
          <h2 className="text-lg font-black text-white">إنشاء كاتب جديد</h2>
          <button onClick={onClose} className="rounded-xl p-2 text-slate-500 hover:text-white transition">
            <X className="size-5" />
          </button>
        </div>

        <div className="space-y-4 p-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>الاسم *</label>
              <input value={form.nameAr} onChange={e => set("nameAr", e.target.value)} className={inputCls} placeholder="مثال: سامي" />
            </div>
            <div>
              <label className={labelCls}>Slug * (إنجليزي)</label>
              <input value={form.slug} onChange={e => set("slug", e.target.value)} className={inputCls} dir="ltr" placeholder="sami" />
            </div>
          </div>

          <div>
            <label className={labelCls}>المسمى الوظيفي</label>
            <input value={form.titleAr} onChange={e => set("titleAr", e.target.value)} className={inputCls} placeholder="محلل أمن سيبراني" />
          </div>

          <div>
            <label className={labelCls}>التخصص</label>
            <input value={form.specialtyAr} onChange={e => set("specialtyAr", e.target.value)} className={inputCls} placeholder="الأمن السيبراني والذكاء الاصطناعي" />
          </div>

          <div>
            <label className={labelCls}>نبذة مختصرة</label>
            <textarea rows={3} value={form.bioAr} onChange={e => set("bioAr", e.target.value)} className={inputCls} placeholder="وصف قصير للكاتب..." />
          </div>

          <div>
            <label className={labelCls}>لون التمييز</label>
            <div className="flex gap-2 items-center">
              <input type="color" value={form.accentColor} onChange={e => set("accentColor", e.target.value)}
                className="h-10 w-12 cursor-pointer rounded-lg border border-slate-700 bg-transparent p-0.5" />
              <div className="flex gap-1.5">
                {ACCENT_PRESETS.map(c => (
                  <button key={c} type="button" onClick={() => set("accentColor", c)}
                    className="h-6 w-6 rounded-full border-2 transition hover:scale-110"
                    style={{ backgroundColor: c, borderColor: form.accentColor === c ? "white" : "transparent" }} />
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className={labelCls}>صورة الكاتب</label>
            <AvatarUpload value={form.avatarUrl} onChange={v => set("avatarUrl", v)} accent={form.accentColor} />
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-white/8 px-6 py-4">
          <button onClick={onClose} className="rounded-2xl bg-white/5 px-5 py-2 text-sm font-semibold text-slate-400 hover:text-white transition">
            إلغاء
          </button>
          <button onClick={create} disabled={saving}
            className="flex items-center gap-2 rounded-2xl px-6 py-2 text-sm font-bold text-white transition disabled:opacity-60"
            style={{ backgroundColor: form.accentColor }}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : <UserPlus className="size-4" />}
            إنشاء الكاتب
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Author editor (full, inside tab) ────────────────────────────────────────

function AuthorEditor({ author, onSaved }: { author: AuthorData; onSaved: () => void }) {
  const { toast } = useToast();
  const [form, setForm] = React.useState({
    nameAr: author.nameAr,
    titleAr: author.titleAr,
    bioAr: author.bioAr,
    specialtyAr: author.specialtyAr,
    avatarUrl: author.avatarUrl,
    accentColor: author.accentColor,
    systemPrompt: author.systemPrompt,
    voiceTraits: [...author.voiceTraits],
    socialTwitter: author.socialTwitter ?? "",
  });
  const [saving, setSaving] = React.useState(false);
  const [traitInput, setTraitInput] = React.useState("");

  function set<K extends keyof typeof form>(k: K, v: typeof form[K]) {
    setForm(f => ({ ...f, [k]: v }));
  }

  async function save() {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/authors/${author.slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Save failed");
      toast(`✅ ${form.nameAr} — تم الحفظ`);
      onSaved();
    } catch {
      toast("فشل الحفظ", "error");
    } finally {
      setSaving(false);
    }
  }

  function addTrait() {
    if (!traitInput.trim()) return;
    set("voiceTraits", [...form.voiceTraits, traitInput.trim()]);
    setTraitInput("");
  }
  function removeTrait(i: number) {
    set("voiceTraits", form.voiceTraits.filter((_, idx) => idx !== i));
  }

  const accent = form.accentColor;

  return (
    <div className="space-y-4" dir="rtl">

      {/* Quick save bar */}
      <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 py-3">
        <div className="flex items-center gap-3">
          {/* Live avatar preview */}
          <div className="h-10 w-10 overflow-hidden rounded-full" style={{ outline: `2px solid ${accent}`, outlineOffset: "2px" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={form.avatarUrl || "/placeholder.png"} alt={form.nameAr}
              className="h-full w-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
          </div>
          <div>
            <p className="text-sm font-bold" style={{ color: accent }}>{form.nameAr || "—"}</p>
            <p className="text-xs text-slate-500">{form.titleAr || "—"} · {author.reviewCount} تقرير</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a href={`/author/${author.slug}`} target="_blank" rel="noopener"
            className="flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition">
            <ExternalLink className="size-3.5" /> الصفحة
          </a>
          <button onClick={save} disabled={saving}
            className="flex items-center gap-2 rounded-xl px-4 py-1.5 text-sm font-bold text-white disabled:opacity-60 transition"
            style={{ backgroundColor: accent }}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            حفظ
          </button>
        </div>
      </div>

      {/* Identity */}
      <Section title="🪪 الهوية الأساسية">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>الاسم بالعربية</label>
            <input value={form.nameAr} onChange={e => set("nameAr", e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>المسمى الوظيفي</label>
            <input value={form.titleAr} onChange={e => set("titleAr", e.target.value)} className={inputCls} />
          </div>
        </div>
        <div>
          <label className={labelCls}>التخصص</label>
          <input value={form.specialtyAr} onChange={e => set("specialtyAr", e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>السيرة الذاتية</label>
          <textarea rows={4} value={form.bioAr} onChange={e => set("bioAr", e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>تويتر / X</label>
          <input value={form.socialTwitter} onChange={e => set("socialTwitter", e.target.value)}
            className={inputCls} dir="ltr" placeholder="https://twitter.com/..." />
        </div>
      </Section>

      {/* Appearance */}
      <Section title="🎨 المظهر">
        <div>
          <label className={labelCls}>الصورة الشخصية</label>
          <AvatarUpload value={form.avatarUrl} onChange={v => set("avatarUrl", v)} accent={accent} />
        </div>

        <div>
          <label className={labelCls}>لون التمييز</label>
          <div className="flex items-center gap-3">
            <input type="color" value={accent} onChange={e => set("accentColor", e.target.value)}
              className="h-10 w-12 cursor-pointer rounded-lg border border-slate-700 bg-transparent p-0.5" />
            <input value={accent} onChange={e => set("accentColor", e.target.value)}
              className={`${inputCls} max-w-[140px]`} dir="ltr" />
            <div className="flex gap-1.5">
              {ACCENT_PRESETS.map(c => (
                <button key={c} type="button" onClick={() => set("accentColor", c)}
                  className="h-6 w-6 rounded-full border-2 transition hover:scale-110"
                  style={{ backgroundColor: c, borderColor: accent === c ? "white" : "transparent" }} />
              ))}
            </div>
          </div>
        </div>

        {/* Live preview */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="mb-2 text-xs text-slate-400">معاينة كما تظهر في الكتبة</p>
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 overflow-hidden rounded-full" style={{ outline: `2px solid ${accent}50`, outlineOffset: "2px" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={form.avatarUrl} alt={form.nameAr} className="h-full w-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
            </div>
            <span className="text-sm font-semibold" style={{ color: accent }}>{form.nameAr}</span>
            <span className="text-xs text-slate-400">· إنتاج آلي</span>
            <span className="text-slate-300 text-xs">•</span>
            <span className="text-xs text-slate-400">منذ ساعتين</span>
            <span className="text-slate-300 text-xs">•</span>
            <span className="text-xs text-slate-400">5 دقائق قراءة</span>
          </div>
        </div>
      </Section>

      {/* Voice traits */}
      <Section title="🗣️ سمات الأسلوب">
        <div className="space-y-2">
          {form.voiceTraits.map((trait, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: accent }} />
              <input value={trait}
                onChange={e => {
                  const u = [...form.voiceTraits];
                  u[i] = e.target.value;
                  set("voiceTraits", u);
                }}
                className={`${inputCls} flex-1`} />
              <button type="button" onClick={() => removeTrait(i)}
                className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:text-red-500 transition">
                <Trash2 className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input value={traitInput}
            onChange={e => setTraitInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addTrait())}
            className={`${inputCls} flex-1`} placeholder="أضف سمة جديدة..." />
          <button type="button" onClick={addTrait}
            className="flex items-center rounded-xl px-3 py-2 text-white transition"
            style={{ backgroundColor: accent }}>
            <Plus className="size-4" />
          </button>
        </div>
      </Section>

      {/* System prompt */}
      <Section title="🤖 System Prompt" defaultOpen={false}>
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700">
          ⚠️ يؤثر مباشرة على أسلوب الكتابة في كل تقرير جديد.
        </div>
        <div>
          <textarea rows={14} value={form.systemPrompt}
            onChange={e => set("systemPrompt", e.target.value)}
            className={`${inputCls} font-mono text-xs leading-relaxed`} dir="rtl" />
          <div className="mt-1 flex justify-between text-xs text-slate-400">
            <span>{form.systemPrompt.length} حرف</span>
            <button type="button" onClick={() => set("systemPrompt", author.systemPrompt)}
              className="flex items-center gap-1 text-slate-400 hover:text-slate-700 transition">
              <RefreshCw className="size-3" /> استعادة الأصلي
            </button>
          </div>
        </div>
      </Section>

      {/* Save bottom */}
      <button onClick={save} disabled={saving}
        className="flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-sm font-bold text-white disabled:opacity-60 transition"
        style={{ backgroundColor: accent }}>
        {saving ? <Loader2 className="size-5 animate-spin" /> : <Save className="size-5" />}
        حفظ التغييرات على {form.nameAr}
      </button>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AdminAuthorsPage() {
  const [authors, setAuthors] = React.useState<AuthorData[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [activeSlug, setActiveSlug] = React.useState<string>("");
  const [showNew, setShowNew] = React.useState(false);
  const { toast } = useToast();

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/authors");
      if (res.ok) {
        const data = await res.json() as AuthorData[];
        setAuthors(data);
        if (!activeSlug && data.length > 0) setActiveSlug(data[0].slug);
      }
    } catch {
      toast("فشل التحميل", "error");
    } finally {
      setLoading(false);
    }
  }, [toast, activeSlug]);

  React.useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const active = authors.find(a => a.slug === activeSlug);

  return (
    <div className="p-6" dir="rtl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <p className="text-xs text-slate-400">تعديل الملفات الشخصية والإعدادات</p>
          <button
            onClick={() => setShowNew(true)}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-700 transition"
          >
            <UserPlus className="size-4" /> كاتب جديد
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-32">
            <Loader2 className="size-8 animate-spin text-violet-500" />
          </div>
        ) : (
          <div className="flex gap-6">
            {/* Sidebar tabs */}
            <div className="w-52 shrink-0 space-y-1">
              {authors.map(a => (
                <button
                  key={a.slug}
                  onClick={() => setActiveSlug(a.slug)}
                  className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-right transition ${
                    activeSlug === a.slug
                      ? "bg-white shadow-sm border border-slate-200"
                      : "hover:bg-slate-100"
                  }`}
                  style={activeSlug === a.slug ? { borderRight: `3px solid ${a.accentColor}` } : { borderRight: "3px solid transparent" }}
                >
                  <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full" style={{ outline: `2px solid ${a.accentColor}60` }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={a.avatarUrl} alt={a.nameAr} className="h-full w-full object-cover"
                      onError={(e) => {
                        const el = e.target as HTMLImageElement;
                        el.style.display = "none";
                        el.parentElement!.style.background = `${a.accentColor}20`;
                      }} />
                  </div>
                  <div className="min-w-0 text-right">
                    <p className="truncate text-sm font-bold text-slate-700"
                      style={activeSlug === a.slug ? { color: a.accentColor } : {}}>
                      {a.nameAr}
                    </p>
                    <p className="truncate text-[11px] text-slate-400">{a.reviewCount} تقرير</p>
                  </div>
                </button>
              ))}

              {/* Add new shortcut */}
              <button
                onClick={() => setShowNew(true)}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 px-4 py-3 text-sm text-slate-400 hover:border-indigo-400 hover:text-indigo-600 transition"
              >
                <Plus className="size-4" /> إضافة كاتب
              </button>
            </div>

            {/* Editor panel */}
            <div className="flex-1 min-w-0">
              {active ? (
                <AuthorEditor key={active.slug} author={active} onSaved={load} />
              ) : (
                <div className="flex h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-400">
                  اختر كاتباً من القائمة
                </div>
              )}
            </div>
          </div>
        )}

      {/* New author modal */}
      {showNew && (
        <NewAuthorModal
          onClose={() => setShowNew(false)}
          onCreated={() => { load(); setShowNew(false); }}
        />
      )}
    </div>
  );
}
