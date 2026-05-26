"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight, Save, Eye, Trash2, Wand2, ImageIcon,
  RefreshCw, ChevronDown, CheckCircle2, AlertCircle,
  Bold, Italic, Heading2, Heading3, List, Quote, Code, Link2,
  X, ExternalLink,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Category = { id: string; nameAr: string };

type ReviewDetail = {
  id: string;
  titleAr: string;
  slug: string;
  summary: string;
  content: string;
  authorSlug: string;
  categoryId: string;
  tags: string[];
  keywords: string[];
  imageUrl: string | null;
  imageAlt: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  published: boolean;
  viewCount: number;
  publishedAt: string | null;
  faq: Array<{ question: string; answer: string }> | null;
};

type SaveStatus = "idle" | "saving" | "saved" | "error";
type Tab = "content" | "seo" | "image" | "faq";

// ─── Shared input styles ──────────────────────────────────────────────────────

const inp =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-[#667eea] focus:ring-2 focus:ring-[#667eea]/20 placeholder:text-slate-300";
const sel =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-[#667eea] focus:ring-2 focus:ring-[#667eea]/20";
const lbl = "mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-400";

// ─── Markdown toolbar ─────────────────────────────────────────────────────────

function insertMarkdown(
  ta: HTMLTextAreaElement,
  before: string,
  after = "",
  placeholder = "نص",
) {
  const start = ta.selectionStart;
  const end = ta.selectionEnd;
  const selected = ta.value.slice(start, end) || placeholder;
  const newVal =
    ta.value.slice(0, start) + before + selected + after + ta.value.slice(end);
  // We return the new value and new cursor position
  return { value: newVal, cursor: start + before.length + selected.length + after.length };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ReviewEditorPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [review, setReview] = useState<ReviewDetail | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [activeTab, setActiveTab] = useState<Tab>("content");
  const [wordCount, setWordCount] = useState(0);

  // Image generation
  const [imagePrompt, setImagePrompt] = useState("");
  const [generatingImage, setGeneratingImage] = useState(false);
  const [imageError, setImageError] = useState("");

  const contentRef = useRef<HTMLTextAreaElement>(null);

  // ── Load ──
  const load = useCallback(async () => {
    const [rRes, cRes] = await Promise.all([
      fetch(`/api/admin/reviews/${id}`),
      fetch("/api/admin/categories"),
    ]);
    const r = await rRes.json() as ReviewDetail;
    setReview(r);
    setCategories(await cRes.json() as Category[]);
    setWordCount(r.content.trim().split(/\s+/).filter(Boolean).length);
    setImagePrompt((r as { featuredImagePrompt?: string }).featuredImagePrompt ?? "");
  }, [id]);

  useEffect(() => { void load(); }, [load]);

  // ── Save ──
  async function save() {
    if (!review) return;
    setSaveStatus("saving");
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(review),
      });
      if (!res.ok) throw new Error();
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2500);
    } catch {
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 3000);
    }
  }

  // ── Delete ──
  async function del() {
    if (!confirm("حذف هذا التقرير نهائياً؟ لا يمكن التراجع.")) return;
    await fetch(`/api/admin/reviews/${id}`, { method: "DELETE" });
    router.push("/admin/reviews");
  }

  // ── Generate image ──
  async function generateImage() {
    if (!imagePrompt.trim()) return;
    setGeneratingImage(true);
    setImageError("");
    try {
      const res = await fetch(`/api/admin/reviews/${id}/generate-image`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: imagePrompt }),
      });
      if (!res.ok) throw new Error("فشل في توليد الصورة");
      const { imageUrl } = await res.json() as { imageUrl: string };
      setReview((r) => r ? { ...r, imageUrl } : r);
    } catch (e) {
      setImageError(e instanceof Error ? e.message : "خطأ غير معروف");
    } finally {
      setGeneratingImage(false);
    }
  }

  // ── Markdown toolbar action ──
  function mdAction(before: string, after = "", placeholder = "نص") {
    const ta = contentRef.current;
    if (!ta || !review) return;
    const { value, cursor } = insertMarkdown(ta, before, after, placeholder);
    setReview({ ...review, content: value });
    setWordCount(value.trim().split(/\s+/).filter(Boolean).length);
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(cursor, cursor);
    });
  }

  // ── Update content ──
  function updateContent(val: string) {
    if (!review) return;
    setReview({ ...review, content: val });
    setWordCount(val.trim().split(/\s+/).filter(Boolean).length);
  }

  if (!review) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="flex items-center gap-3 text-slate-400">
          <RefreshCw className="h-5 w-5 animate-spin" />
          <span>جارٍ تحميل التقرير…</span>
        </div>
      </div>
    );
  }

  const saveLabel =
    saveStatus === "saving" ? "جارٍ الحفظ…" :
    saveStatus === "saved"  ? "تم الحفظ ✓" :
    saveStatus === "error"  ? "خطأ في الحفظ" : "حفظ";

  const saveBg =
    saveStatus === "saved" ? "bg-emerald-600 hover:bg-emerald-500" :
    saveStatus === "error" ? "bg-red-500 hover:bg-red-400" :
    "bg-[#667eea] hover:bg-[#5a6fd6]";

  const tabs: { id: Tab; label: string }[] = [
    { id: "content", label: "المحتوى" },
    { id: "seo",     label: "SEO" },
    { id: "image",   label: "الصورة" },
    { id: "faq",     label: "FAQ" },
  ];

  return (
    <div className="min-h-screen bg-slate-100" dir="rtl">

      {/* ── Top bar ── */}
      <div className="sticky top-0 z-30 border-b border-slate-200 bg-white shadow-sm">
        <div className="container mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          {/* Back */}
          <Link
            href="/admin/reviews"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50"
          >
            <ArrowRight className="h-4 w-4" />
          </Link>

          {/* Title */}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-slate-800 leading-tight">{review.titleAr}</p>
            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <span>{review.authorSlug === "zayd" ? "زيد" : "لينا"}</span>
              <span>·</span>
              <span>{wordCount.toLocaleString("ar-EG")} كلمة</span>
              <span>·</span>
              <span>{review.viewCount.toLocaleString("ar-EG")} مشاهدة</span>
              {review.publishedAt && (
                <>
                  <span>·</span>
                  <span>
                    {new Date(review.publishedAt).toLocaleDateString("ar-SA", { dateStyle: "medium" })}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Status badge */}
          <span className={`hidden shrink-0 rounded-full px-3 py-1 text-xs font-bold sm:inline-flex ${
            review.published
              ? "bg-emerald-100 text-emerald-700"
              : "bg-amber-100 text-amber-700"
          }`}>
            {review.published ? "منشورة" : "مسودة"}
          </span>

          {/* Actions */}
          <div className="flex shrink-0 items-center gap-2">
            {review.published && (
              <a
                href={`/reviews/${review.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 sm:flex"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                معاينة
              </a>
            )}
            <button
              onClick={del}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-red-100 text-red-400 transition hover:bg-red-50 hover:text-red-600"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <button
              onClick={save}
              disabled={saveStatus === "saving"}
              className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-bold text-white transition disabled:opacity-60 ${saveBg}`}
            >
              {saveStatus === "saving" ? (
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              ) : saveStatus === "saved" ? (
                <CheckCircle2 className="h-3.5 w-3.5" />
              ) : saveStatus === "error" ? (
                <AlertCircle className="h-3.5 w-3.5" />
              ) : (
                <Save className="h-3.5 w-3.5" />
              )}
              <span className="hidden sm:inline">{saveLabel}</span>
            </button>
          </div>
        </div>

        {/* Tab bar */}
        <div className="container mx-auto max-w-6xl border-t border-slate-100 px-4">
          <div className="flex gap-1">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`border-b-2 px-4 py-2.5 text-sm font-semibold transition ${
                  activeTab === t.id
                    ? "border-[#667eea] text-[#667eea]"
                    : "border-transparent text-slate-400 hover:text-slate-600"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="container mx-auto max-w-6xl px-4 py-6">
        <div className="grid gap-5 lg:grid-cols-[1fr_320px]">

          {/* ── Main column ── */}
          <div className="space-y-5">

            {/* ── META card (always visible) ── */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-xs font-bold uppercase tracking-wide text-slate-400">معلومات التقرير</h2>
              <div className="grid gap-4 sm:grid-cols-2">

                {/* Title */}
                <div className="sm:col-span-2">
                  <label className={lbl}>العنوان بالعربية</label>
                  <input
                    value={review.titleAr}
                    onChange={(e) => setReview({ ...review, titleAr: e.target.value })}
                    className={inp}
                    placeholder="عنوان التقرير…"
                  />
                </div>

                {/* Slug */}
                <div>
                  <label className={lbl}>الرابط (slug)</label>
                  <input
                    value={review.slug}
                    onChange={(e) => setReview({ ...review, slug: e.target.value })}
                    className={`${inp} font-mono`}
                    dir="ltr"
                    placeholder="article-slug-here"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className={lbl}>التصنيف</label>
                  <select
                    value={review.categoryId}
                    onChange={(e) => setReview({ ...review, categoryId: e.target.value })}
                    className={sel}
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.nameAr}</option>
                    ))}
                  </select>
                </div>

                {/* Author */}
                <div>
                  <label className={lbl}>الكاتب</label>
                  <select
                    value={review.authorSlug}
                    onChange={(e) => setReview({ ...review, authorSlug: e.target.value })}
                    className={sel}
                  >
                    <option value="zayd">زيد — محلل النماذج</option>
                    <option value="lina">لينا — مراسلة الشركات</option>
                  </select>
                </div>

                {/* Published toggle */}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={review.published}
                    onClick={() => setReview({ ...review, published: !review.published })}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors ${
                      review.published ? "bg-emerald-500" : "bg-slate-200"
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                      review.published ? "translate-x-6" : "translate-x-1"
                    }`} />
                  </button>
                  <span className="text-sm font-semibold text-slate-700">
                    {review.published ? "منشورة" : "مسودة — غير منشورة"}
                  </span>
                </div>

              </div>
            </div>

            {/* ── CONTENT tab ── */}
            {activeTab === "content" && (
              <div className="space-y-5">

                {/* Summary */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <label className={lbl}>المقدمة / الليد (2–3 جمل)</label>
                  <textarea
                    value={review.summary}
                    onChange={(e) => setReview({ ...review, summary: e.target.value })}
                    rows={3}
                    className={`${inp} resize-none leading-relaxed`}
                    placeholder="تستدرج القارئ المتخصص — تبدأ بالأهمية لا بالخبر…"
                  />
                  <p className="mt-1.5 text-right text-[11px] text-slate-300">
                    {review.summary.length} حرف
                  </p>
                </div>

                {/* Content editor */}
                <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                  {/* Toolbar */}
                  <div className="flex flex-wrap items-center gap-0.5 border-b border-slate-100 bg-slate-50 p-2">
                    {[
                      { icon: Bold,     tip: "عريض",     fn: () => mdAction("**", "**", "نص عريض") },
                      { icon: Italic,   tip: "مائل",     fn: () => mdAction("*", "*", "نص مائل") },
                      { icon: Heading2, tip: "عنوان 2",  fn: () => mdAction("\n## ", "", "العنوان") },
                      { icon: Heading3, tip: "عنوان 3",  fn: () => mdAction("\n### ", "", "العنوان") },
                      { icon: List,     tip: "قائمة",    fn: () => mdAction("\n- ", "", "عنصر") },
                      { icon: Quote,    tip: "اقتباس",   fn: () => mdAction("\n> ", "", "نص الاقتباس") },
                      { icon: Code,     tip: "كود",      fn: () => mdAction("`", "`", "code") },
                      { icon: Link2,    tip: "رابط",     fn: () => mdAction("[", "](https://)", "نص الرابط") },
                    ].map(({ icon: Icon, tip, fn }) => (
                      <button
                        key={tip}
                        title={tip}
                        type="button"
                        onClick={fn}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-200 hover:text-slate-700"
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </button>
                    ))}
                    <div className="mr-auto flex items-center gap-2 text-[11px] text-slate-300">
                      <span>{wordCount.toLocaleString("ar-EG")} كلمة</span>
                      <span>·</span>
                      <span>~{Math.max(5, Math.round(wordCount / 200))} دقيقة</span>
                    </div>
                  </div>

                  {/* Textarea */}
                  <textarea
                    ref={contentRef}
                    value={review.content}
                    onChange={(e) => updateContent(e.target.value)}
                    rows={36}
                    dir="rtl"
                    className="block w-full bg-white px-5 py-4 font-mono text-sm leading-7 text-slate-800 outline-none placeholder:text-slate-300"
                    placeholder="المحتوى بتنسيق Markdown…"
                  />

                  <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-4 py-2 text-[11px] text-slate-400">
                    <span>Markdown مدعوم — ## عنوان · **عريض** · *مائل* · &gt; اقتباس</span>
                    <span>{review.content.length.toLocaleString("ar-EG")} حرف</span>
                  </div>
                </div>

                {/* Tags & Keywords */}
                <div className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-2">
                  <div>
                    <label className={lbl}>الوسوم / Tags</label>
                    <input
                      value={review.tags.join(", ")}
                      onChange={(e) =>
                        setReview({
                          ...review,
                          tags: e.target.value.split(",").map((t) => t.trim()).filter(Boolean),
                        })
                      }
                      className={inp}
                      placeholder="وسم1، وسم2، وسم3"
                    />
                    <p className="mt-1 text-[11px] text-slate-300">مفصولة بفاصلة</p>
                  </div>
                  <div>
                    <label className={lbl}>الكلمات المفتاحية / Keywords</label>
                    <input
                      value={(review.keywords ?? []).join(", ")}
                      onChange={(e) =>
                        setReview({
                          ...review,
                          keywords: e.target.value.split(",").map((k) => k.trim()).filter(Boolean),
                        })
                      }
                      className={inp}
                      placeholder="مصطلح تقني 1، مصطلح 2"
                    />
                    <p className="mt-1 text-[11px] text-slate-300">للـ SEO والـ embedding</p>
                  </div>
                </div>

              </div>
            )}

            {/* ── SEO tab ── */}
            {activeTab === "seo" && (
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="mb-5 text-xs font-bold uppercase tracking-wide text-slate-400">بيانات SEO</h2>
                <div className="space-y-4">

                  <div>
                    <label className={lbl}>عنوان SEO</label>
                    <input
                      value={review.seoTitle ?? ""}
                      onChange={(e) => setReview({ ...review, seoTitle: e.target.value })}
                      className={inp}
                      placeholder="50–60 حرف — يظهر في نتائج البحث"
                      maxLength={70}
                    />
                    <div className="mt-1 flex justify-between text-[11px]">
                      <span className="text-slate-300">الأمثل: 50–60 حرف</span>
                      <span className={`${(review.seoTitle?.length ?? 0) > 60 ? "text-red-400" : "text-slate-300"}`}>
                        {review.seoTitle?.length ?? 0} / 70
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className={lbl}>وصف SEO (Meta Description)</label>
                    <textarea
                      value={review.seoDescription ?? ""}
                      onChange={(e) => setReview({ ...review, seoDescription: e.target.value })}
                      rows={3}
                      className={`${inp} resize-none`}
                      placeholder="150–160 حرف — يحفّز النقر من نتائج البحث"
                      maxLength={180}
                    />
                    <div className="mt-1 flex justify-between text-[11px]">
                      <span className="text-slate-300">الأمثل: 150–160 حرف</span>
                      <span className={`${(review.seoDescription?.length ?? 0) > 160 ? "text-red-400" : "text-slate-300"}`}>
                        {review.seoDescription?.length ?? 0} / 180
                      </span>
                    </div>
                  </div>

                  {/* SERP preview */}
                  {(review.seoTitle || review.titleAr) && (
                    <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                      <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-300">معاينة Google</p>
                      <p className="text-[13px] font-medium text-[#1a0dab] hover:underline" dir="rtl">
                        {review.seoTitle || review.titleAr}
                      </p>
                      <p className="text-[11px] text-[#006621]">ai-news-ar.vercel.app › reviews › {review.slug}</p>
                      <p className="mt-0.5 text-[12px] leading-snug text-[#545454]" dir="rtl">
                        {review.seoDescription || review.summary || "لا يوجد وصف…"}
                      </p>
                    </div>
                  )}

                  <div>
                    <label className={lbl}>وصف الصورة (alt)</label>
                    <input
                      value={review.imageAlt ?? ""}
                      onChange={(e) => setReview({ ...review, imageAlt: e.target.value })}
                      className={inp}
                      placeholder="وصف دقيق للصورة — مهم للـ SEO وإمكانية الوصول"
                    />
                  </div>

                </div>
              </div>
            )}

            {/* ── IMAGE tab ── */}
            {activeTab === "image" && (
              <div className="space-y-4">

                {/* Current image */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h2 className="mb-4 text-xs font-bold uppercase tracking-wide text-slate-400">الصورة الرئيسية</h2>

                  {review.imageUrl ? (
                    <div className="space-y-3">
                      <div className="relative h-52 w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                        <Image
                          src={review.imageUrl}
                          alt={review.imageAlt ?? review.titleAr}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                        <button
                          onClick={() => setReview({ ...review, imageUrl: null })}
                          className="absolute top-2 left-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm transition hover:bg-black/80"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <p className="break-all font-mono text-[11px] text-slate-300" dir="ltr">
                        {review.imageUrl}
                      </p>
                    </div>
                  ) : (
                    <div className="flex h-40 items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50">
                      <div className="text-center">
                        <ImageIcon className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                        <p className="text-sm text-slate-400">لا توجد صورة حالياً</p>
                      </div>
                    </div>
                  )}

                  {/* Manual URL input */}
                  <div className="mt-4">
                    <label className={lbl}>أو أدخل رابط صورة يدوياً</label>
                    <input
                      value={review.imageUrl ?? ""}
                      onChange={(e) => setReview({ ...review, imageUrl: e.target.value || null })}
                      className={`${inp} font-mono`}
                      dir="ltr"
                      placeholder="https://res.cloudinary.com/…"
                    />
                  </div>
                </div>

                {/* AI image generation */}
                <div className="rounded-2xl border border-violet-200 bg-violet-50/50 p-5 shadow-sm">
                  <div className="mb-4 flex items-center gap-2">
                    <Wand2 className="h-4 w-4 text-violet-500" />
                    <h2 className="text-xs font-bold uppercase tracking-wide text-violet-600">توليد صورة بـ AI (Replicate)</h2>
                  </div>

                  <div className="mb-3">
                    <label className={lbl}>وصف الصورة بالإنجليزية</label>
                    <textarea
                      value={imagePrompt}
                      onChange={(e) => setImagePrompt(e.target.value)}
                      rows={3}
                      className={`${inp} resize-none`}
                      dir="ltr"
                      placeholder="e.g. Futuristic AI neural network visualization, dark background, glowing nodes, cinematic lighting"
                    />
                    <p className="mt-1 text-[11px] text-slate-400">
                      يُضاف تلقائياً: <span className="font-mono text-slate-300">digital art, dark background, cinematic lighting, no text</span>
                    </p>
                  </div>

                  {imageError && (
                    <div className="mb-3 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      {imageError}
                    </div>
                  )}

                  <button
                    onClick={generateImage}
                    disabled={generatingImage || !imagePrompt.trim()}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 py-2.5 text-sm font-bold text-white transition hover:bg-violet-500 disabled:opacity-50"
                  >
                    {generatingImage ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        جارٍ التوليد… (30–60 ثانية)
                      </>
                    ) : (
                      <>
                        <Wand2 className="h-4 w-4" />
                        توليد صورة جديدة
                      </>
                    )}
                  </button>
                  <p className="mt-2 text-center text-[11px] text-slate-400">
                    النتيجة تُرفع تلقائياً إلى Cloudinary وتُحفظ كصورة دائمة
                  </p>
                </div>

              </div>
            )}

            {/* ── FAQ tab ── */}
            {activeTab === "faq" && (
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-5 flex items-center justify-between">
                  <h2 className="text-xs font-bold uppercase tracking-wide text-slate-400">الأسئلة الشائعة (FAQ)</h2>
                  <button
                    onClick={() =>
                      setReview({
                        ...review,
                        faq: [...(review.faq ?? []), { question: "", answer: "" }],
                      })
                    }
                    className="rounded-xl bg-[#667eea]/10 px-3 py-1.5 text-xs font-bold text-[#667eea] transition hover:bg-[#667eea]/20"
                  >
                    + إضافة سؤال
                  </button>
                </div>

                {!review.faq || review.faq.length === 0 ? (
                  <div className="rounded-xl border-2 border-dashed border-slate-200 py-10 text-center">
                    <p className="text-sm text-slate-400">لا توجد أسئلة بعد</p>
                    <p className="mt-1 text-xs text-slate-300">اضغط "+ إضافة سؤال" للبدء</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {review.faq.map((item, i) => (
                      <div key={i} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <div className="mb-3 flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-400">سؤال {i + 1}</span>
                          <button
                            onClick={() =>
                              setReview({
                                ...review,
                                faq: review.faq!.filter((_, j) => j !== i),
                              })
                            }
                            className="text-slate-300 transition hover:text-red-400"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                        <input
                          value={item.question}
                          onChange={(e) => {
                            const faq = [...review.faq!];
                            faq[i] = { ...faq[i], question: e.target.value };
                            setReview({ ...review, faq });
                          }}
                          className={`${inp} mb-2`}
                          placeholder="السؤال…"
                        />
                        <textarea
                          value={item.answer}
                          onChange={(e) => {
                            const faq = [...review.faq!];
                            faq[i] = { ...faq[i], answer: e.target.value };
                            setReview({ ...review, faq });
                          }}
                          rows={3}
                          className={`${inp} resize-none leading-relaxed`}
                          placeholder="الإجابة (2–3 جمل تحليلية)…"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>

          {/* ── Sidebar ── */}
          <div className="space-y-4">

            {/* Quick save */}
            <button
              onClick={save}
              disabled={saveStatus === "saving"}
              className={`flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-sm font-bold text-white shadow-md transition disabled:opacity-60 ${saveBg}`}
            >
              {saveStatus === "saving" ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saveLabel}
            </button>

            {/* Publish toggle */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-400">حالة النشر</p>
              <button
                type="button"
                onClick={() => setReview({ ...review, published: !review.published })}
                className={`w-full rounded-xl py-2.5 text-sm font-bold transition ${
                  review.published
                    ? "bg-red-50 text-red-600 hover:bg-red-100"
                    : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                }`}
              >
                {review.published ? "إلغاء النشر" : "نشر التقرير"}
              </button>
              {review.published && review.slug && (
                <a
                  href={`/reviews/${review.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 flex items-center justify-center gap-1.5 text-xs text-[#667eea] hover:underline"
                >
                  <ExternalLink className="h-3 w-3" />
                  فتح التقرير المنشور
                </a>
              )}
            </div>

            {/* Stats */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-400">إحصائيات</p>
              <div className="space-y-2 text-sm">
                {[
                  { label: "المشاهدات", value: review.viewCount.toLocaleString("ar-EG") },
                  { label: "عدد الكلمات", value: wordCount.toLocaleString("ar-EG") },
                  { label: "وقت القراءة", value: `~${Math.max(5, Math.round(wordCount / 200))} دقيقة` },
                  { label: "أسئلة FAQ", value: review.faq?.length ?? 0 },
                  { label: "وسوم", value: review.tags.length },
                  { label: "كلمات مفتاحية", value: (review.keywords ?? []).length },
                ].map((s) => (
                  <div key={s.label} className="flex items-center justify-between">
                    <span className="text-slate-400">{s.label}</span>
                    <span className="font-bold text-slate-700">{s.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Tags preview */}
            {review.tags.length > 0 && (
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-400">الوسوم</p>
                <div className="flex flex-wrap gap-1.5">
                  {review.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-[#667eea]/8 px-2.5 py-0.5 text-xs font-medium text-[#667eea]"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Danger zone */}
            <div className="rounded-2xl border border-red-100 bg-red-50/50 p-4">
              <p className="mb-3 text-xs font-bold uppercase tracking-wide text-red-400">منطقة الخطر</p>
              <button
                onClick={del}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-white py-2 text-sm font-semibold text-red-500 transition hover:bg-red-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
                حذف التقرير نهائياً
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
