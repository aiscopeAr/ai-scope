"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface PromptData {
  id: string;
  titleAr: string;
  descriptionAr: string;
  promptText: string;
  promptTextAr: string;
  examples: string[] | null;
  useCases: string[] | null;
  culturalNotes: string | null;
  tags: string[];
  difficulty: string;
  copyCount: number;
  viewCount: number;
  category: { nameAr: string; slug: string; icon: string };
  aiModel: { name: string; icon: string };
}

export default function PromptPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [prompt, setPrompt] = useState<PromptData | null>(null);
  const [copied, setCopied] = useState<"en" | "ar" | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/prompts/${slug}`)
      .then((r) => r.json())
      .then((data) => { setPrompt(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [slug]);

  const handleCopy = useCallback(async (text: string, lang: "en" | "ar") => {
    await navigator.clipboard.writeText(text);
    setCopied(lang);
    void fetch(`/api/prompts/${slug}/copy`, { method: "POST" });
    setTimeout(() => setCopied(null), 2000);
  }, [slug]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-20 text-center" dir="rtl">
        <div className="text-slate-400">جاري التحميل...</div>
      </div>
    );
  }

  if (!prompt) {
    return (
      <div className="container mx-auto px-4 py-20 text-center" dir="rtl">
        <div className="mb-4 text-5xl">404</div>
        <p className="text-slate-400">لم يتم العثور على هذا الـ prompt</p>
        <Link href="/tools" className="mt-4 inline-block text-violet-400 hover:underline">العودة للمكتبة</Link>
      </div>
    );
  }

  const diffLabel = prompt.difficulty === "beginner" ? "مبتدئ" : prompt.difficulty === "advanced" ? "متقدم" : "متوسط";
  const diffColor = prompt.difficulty === "beginner" ? "text-emerald-400 border-emerald-400/30 bg-emerald-400/10"
    : prompt.difficulty === "advanced" ? "text-red-400 border-red-400/30 bg-red-400/10"
    : "text-amber-400 border-amber-400/30 bg-amber-400/10";

  return (
    <main className="min-h-screen" dir="rtl">
      <div className="container mx-auto max-w-4xl px-4 py-10">

        {/* Breadcrumb */}
        <nav className="mb-8 flex items-center gap-2 text-sm text-slate-500">
          <Link href="/tools" className="hover:text-violet-400">مكتبة Prompts</Link>
          <span>/</span>
          <Link href={`/tools/category/${prompt.category.slug}`} className="hover:text-violet-400">
            {prompt.category.nameAr}
          </Link>
          <span>/</span>
          <span className="text-slate-300 line-clamp-1">{prompt.titleAr}</span>
        </nav>

        {/* Header */}
        <div className="mb-10">
          <div className="mb-4 flex items-start gap-4">
            <span className="text-4xl">{prompt.category.icon}</span>
            <div>
              <h1 className="text-3xl font-black text-white md:text-4xl">{prompt.titleAr}</h1>
              <p className="mt-2 text-slate-400">{prompt.descriptionAr}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-slate-300">
              {prompt.aiModel.icon} {prompt.aiModel.name}
            </span>
            <span className={`rounded-full border px-3 py-1 text-sm ${diffColor}`}>{diffLabel}</span>
            <span className="text-sm text-slate-500">📋 {prompt.copyCount} نسخة · 👁️ {prompt.viewCount} مشاهدة</span>
          </div>
        </div>

        {/* Arabic Prompt — primary */}
        <section className="mb-8">
          <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-white">
            <span className="text-violet-400">🌍</span> النسخة العربية
          </h2>
          <div className="relative rounded-2xl border border-violet-500/20 bg-violet-500/5">
            <pre className="whitespace-pre-wrap p-6 text-sm leading-relaxed text-slate-200 font-sans overflow-x-auto">
              {prompt.promptTextAr}
            </pre>
            <button
              onClick={() => handleCopy(prompt.promptTextAr, "ar")}
              className="absolute left-4 top-4 rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-700 active:scale-95"
            >
              {copied === "ar" ? "✅ تم النسخ!" : "📋 نسخ"}
            </button>
          </div>
        </section>

        {/* English Prompt */}
        <section className="mb-8">
          <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-white">
            <span>🇬🇧</span> النسخة الإنجليزية
          </h2>
          <div className="relative rounded-2xl border border-white/10 bg-white/3">
            <pre className="whitespace-pre-wrap p-6 text-sm leading-relaxed text-slate-300 font-mono overflow-x-auto" dir="ltr">
              {prompt.promptText}
            </pre>
            <button
              onClick={() => handleCopy(prompt.promptText, "en")}
              className="absolute left-4 top-4 rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/20 active:scale-95"
            >
              {copied === "en" ? "✅ Copied!" : "📋 Copy"}
            </button>
          </div>
        </section>

        {/* Use Cases */}
        {prompt.useCases && prompt.useCases.length > 0 && (
          <section className="mb-8">
            <h2 className="mb-4 text-lg font-bold text-white">💡 حالات الاستخدام</h2>
            <ul className="space-y-2">
              {prompt.useCases.map((uc, i) => (
                <li key={i} className="flex items-start gap-3 rounded-xl border border-white/5 bg-white/3 p-4">
                  <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-violet-500/20 text-xs font-bold text-violet-400">{i + 1}</span>
                  <span className="text-slate-300">{uc}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Examples */}
        {prompt.examples && prompt.examples.length > 0 && (
          <section className="mb-8">
            <h2 className="mb-4 text-lg font-bold text-white">📝 أمثلة</h2>
            <div className="space-y-3">
              {prompt.examples.map((ex, i) => (
                <div key={i} className="rounded-xl border border-sky-500/20 bg-sky-500/5 p-4 text-sm text-slate-300">
                  {ex}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Cultural Notes */}
        {prompt.culturalNotes && (
          <section className="mb-8">
            <h2 className="mb-4 text-lg font-bold text-white">🌙 ملاحظات ثقافية</h2>
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-5 text-sm text-slate-300">
              {prompt.culturalNotes}
            </div>
          </section>
        )}

        {/* Tags */}
        {prompt.tags.length > 0 && (
          <section>
            <h3 className="mb-3 font-semibold text-slate-400">الوسوم</h3>
            <div className="flex flex-wrap gap-2">
              {prompt.tags.map((tag) => (
                <span key={tag} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-400">
                  {tag}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Back */}
        <div className="mt-12 border-t border-white/5 pt-8">
          <Link href="/tools" className="text-sm text-violet-400 hover:text-violet-300">
            ← العودة لمكتبة Prompts
          </Link>
        </div>
      </div>
    </main>
  );
}
