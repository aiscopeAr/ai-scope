"use client";

import * as React from "react";
import { Loader2, Save, RefreshCw, ExternalLink, Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";
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

const inputCls = "w-full rounded-xl border border-slate-700 bg-slate-800/60 px-3.5 py-2.5 text-sm text-slate-200 placeholder:text-slate-500 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition";
const labelCls = "mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400";

function Section({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = React.useState(defaultOpen);
  return (
    <div className="rounded-2xl border border-white/8 bg-white/3">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-5 py-4 text-right"
      >
        <span className="text-sm font-bold text-slate-300">{title}</span>
        {open ? <ChevronUp className="size-4 text-slate-500" /> : <ChevronDown className="size-4 text-slate-500" />}
      </button>
      {open && <div className="px-5 pb-5 space-y-4">{children}</div>}
    </div>
  );
}

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
    voiceTraits: author.voiceTraits,
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
    <div className="rounded-[2rem] border border-white/8 bg-[#0f0f17] overflow-hidden" dir="rtl">
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-white/8 p-6" style={{ borderTopColor: accent, borderTopWidth: 3 }}>
        <div className="relative">
          <div className="h-16 w-16 overflow-hidden rounded-full" style={{ outline: `3px solid ${accent}`, outlineOffset: "3px" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={form.avatarUrl} alt={form.nameAr} className="h-full w-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64'><circle cx='32' cy='32' r='32' fill='%23${accent.slice(1)}20'/><text x='32' y='38' text-anchor='middle' font-size='20' fill='${encodeURIComponent(accent)}'>${form.nameAr[0]}</text></svg>`; }} />
          </div>
          <span className="absolute -bottom-1 -right-1 rounded-full px-1.5 py-0.5 text-[9px] font-bold text-white" style={{ backgroundColor: accent }}>AI</span>
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-black text-white">{form.nameAr}</h2>
          <p className="text-sm text-slate-400">{form.titleAr}</p>
          <p className="mt-0.5 text-xs text-slate-600">{author.reviewCount} تقرير منشور</p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href={`/author/${author.slug}`}
            target="_blank"
            rel="noopener"
            className="flex items-center gap-1.5 rounded-xl bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-white transition"
          >
            <ExternalLink className="size-3.5" /> عرض الصفحة
          </a>
          <button
            onClick={save}
            disabled={saving}
            className="flex items-center gap-2 rounded-xl px-4 py-1.5 text-sm font-bold text-white disabled:opacity-60 transition"
            style={{ backgroundColor: accent }}
          >
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            حفظ
          </button>
        </div>
      </div>

      <div className="space-y-4 p-6">
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
            <label className={labelCls}>السيرة الذاتية (تظهر على صفحة الكاتب)</label>
            <textarea rows={4} value={form.bioAr} onChange={e => set("bioAr", e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>تويتر / X</label>
            <input value={form.socialTwitter} onChange={e => set("socialTwitter", e.target.value)} className={inputCls} dir="ltr" placeholder="https://twitter.com/..." />
          </div>
        </Section>

        {/* Appearance */}
        <Section title="🎨 المظهر">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>رابط الصورة الشخصية</label>
              <input value={form.avatarUrl} onChange={e => set("avatarUrl", e.target.value)} className={inputCls} dir="ltr" placeholder="/images/authors/zayd.svg" />
              <p className="mt-1 text-xs text-slate-600">ضع ملف SVG أو PNG في public/images/authors/ ثم أدخل المسار</p>
            </div>
            <div>
              <label className={labelCls}>لون التمييز (Hex)</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={form.accentColor}
                  onChange={e => set("accentColor", e.target.value)}
                  className="h-10 w-12 cursor-pointer rounded-lg border border-slate-700 bg-transparent p-0.5"
                />
                <input value={form.accentColor} onChange={e => set("accentColor", e.target.value)} className={inputCls} dir="ltr" placeholder="#6366f1" />
              </div>
              <div className="mt-2 flex gap-2">
                {["#6366f1","#ec4899","#f59e0b","#10b981","#06b6d4","#8b5cf6"].map(c => (
                  <button key={c} type="button" onClick={() => set("accentColor", c)}
                    className="h-6 w-6 rounded-full border-2 transition hover:scale-110"
                    style={{ backgroundColor: c, borderColor: form.accentColor === c ? "white" : "transparent" }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Live preview */}
          <div className="rounded-xl border border-white/8 bg-white/3 p-4">
            <p className="mb-2 text-xs text-slate-500">معاينة</p>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 overflow-hidden rounded-full" style={{ outline: `2px solid ${accent}50`, outlineOffset: "2px" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={form.avatarUrl} alt={form.nameAr} className="h-full w-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              </div>
              <div>
                <p className="text-sm font-bold" style={{ color: accent }}>{form.nameAr}</p>
                <p className="text-xs text-slate-500">{form.titleAr}</p>
              </div>
              <span className="mr-auto rounded-full border px-3 py-1 text-xs font-semibold" style={{ color: accent, borderColor: `${accent}40`, backgroundColor: `${accent}12` }}>
                نظام ذكاء اصطناعي
              </span>
            </div>
          </div>
        </Section>

        {/* Voice traits */}
        <Section title="🗣️ سمات الأسلوب (تظهر على صفحة الكاتب)">
          <div className="space-y-2">
            {form.voiceTraits.map((trait, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: accent }} />
                <input
                  value={trait}
                  onChange={e => {
                    const updated = [...form.voiceTraits];
                    updated[i] = e.target.value;
                    set("voiceTraits", updated);
                  }}
                  className={`${inputCls} flex-1`}
                />
                <button type="button" onClick={() => removeTrait(i)} className="shrink-0 rounded-lg p-1.5 text-slate-600 hover:text-red-400 transition">
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={traitInput}
              onChange={e => setTraitInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addTrait())}
              className={`${inputCls} flex-1`}
              placeholder="أضف سمة جديدة..."
            />
            <button type="button" onClick={addTrait} className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-white transition" style={{ backgroundColor: accent }}>
              <Plus className="size-4" />
            </button>
          </div>
        </Section>

        {/* System prompt */}
        <Section title="🤖 System Prompt (يحدد كيف يكتب الـ AI)" defaultOpen={false}>
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-xs text-amber-400">
            ⚠️ هذا يؤثر مباشرة على أسلوب كتابة كل تقرير جديد. تغيير هذا الحقل يغير شخصية الكاتب.
          </div>
          <div>
            <label className={labelCls}>System Prompt</label>
            <textarea
              rows={14}
              value={form.systemPrompt}
              onChange={e => set("systemPrompt", e.target.value)}
              className={`${inputCls} font-mono text-xs leading-relaxed`}
              dir="rtl"
            />
            <div className="mt-1 flex justify-between text-xs text-slate-600">
              <span>{form.systemPrompt.length} حرف</span>
              <button
                type="button"
                onClick={() => set("systemPrompt", author.systemPrompt)}
                className="flex items-center gap-1 text-slate-500 hover:text-white transition"
              >
                <RefreshCw className="size-3" /> استعادة الأصلي
              </button>
            </div>
          </div>
        </Section>

        {/* Save button bottom */}
        <button
          onClick={save}
          disabled={saving}
          className="flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-sm font-bold text-white disabled:opacity-60 transition"
          style={{ backgroundColor: accent }}
        >
          {saving ? <Loader2 className="size-5 animate-spin" /> : <Save className="size-5" />}
          حفظ التغييرات على {form.nameAr}
        </button>
      </div>
    </div>
  );
}

export default function AdminAuthorsPage() {
  const [authors, setAuthors] = React.useState<AuthorData[]>([]);
  const [loading, setLoading] = React.useState(true);
  const { toast } = useToast();

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/authors");
      if (res.ok) setAuthors(await res.json());
    } catch {
      toast("فشل التحميل", "error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  React.useEffect(() => { load(); }, [load]);

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8" dir="rtl">
      {/* Header */}
      <div className="mb-8 rounded-[2rem] border border-white/8 bg-white/3 p-6">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-violet-400">Admin Panel</p>
        <h1 className="text-3xl font-black text-white">إدارة الكتّاب</h1>
        <p className="mt-1 text-slate-500">تحكم كامل في شخصية وأسلوب وصورة كل كاتب AI</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-32">
          <Loader2 className="size-8 animate-spin text-violet-500" />
        </div>
      ) : (
        <div className="space-y-8">
          {authors.map(a => (
            <AuthorEditor key={a.slug} author={a} onSaved={load} />
          ))}
        </div>
      )}
    </div>
  );
}
