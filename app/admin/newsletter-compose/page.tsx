"use client";

import { useState } from "react";
import { Mail, Sparkles, Send, Eye, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

interface ArticlePreview {
  titleAr: string;
  summary: string;
  slug: string;
  imageUrl?: string | null;
  category: string;
}

interface ToolPreview {
  name: string;
  slug: string;
  tagline?: string | null;
  logoUrl?: string | null;
}

interface NewsletterData {
  weekLabel: string;
  articles: ArticlePreview[];
  tools: ToolPreview[];
}

export default function NewsletterComposePage() {
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [data, setData] = useState<NewsletterData | null>(null);
  const [html, setHtml] = useState("");
  const [tab, setTab] = useState<"preview" | "html">("preview");
  const [toEmail, setToEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [status, setStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  async function generate() {
    setGenerating(true);
    setStatus(null);
    try {
      const res = await fetch("/api/admin/newsletter-send");
      const json = await res.json();
      setData(json.data);
      setHtml(json.html);
      if (!subject) setSubject(`نشرة لوميك الأسبوعية — أبرز أخبار الذكاء الاصطناعي`);
    } catch {
      setStatus({ type: "error", msg: "فشل في توليد النشرة" });
    } finally {
      setGenerating(false);
    }
  }

  async function sendEmail() {
    if (!toEmail || !html) return;
    setSending(true);
    setStatus(null);
    try {
      const res = await fetch("/api/admin/newsletter-send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: toEmail, html, subject }),
      });
      const json = await res.json();
      if (json.ok) {
        setStatus({ type: "success", msg: `✅ أُرسلت النشرة إلى ${toEmail}` });
      } else {
        setStatus({ type: "error", msg: json.error ?? "فشل الإرسال" });
      }
    } catch {
      setStatus({ type: "error", msg: "خطأ في الإرسال" });
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="p-6 space-y-6" dir="rtl">

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50">
          <Mail className="h-5 w-5 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-slate-900">إنشاء النشرة الأسبوعية</h1>
          <p className="text-xs text-slate-500">توليد نشرة بريدية من أبرز محتوى الأسبوع</p>
        </div>
      </div>

      {/* Generate button */}
      {!data && (
        <div className="rounded-xl border border-dashed border-indigo-200 bg-indigo-50 p-10 text-center">
          <Sparkles className="h-10 w-10 text-indigo-400 mx-auto mb-4" />
          <p className="text-sm font-semibold text-slate-700 mb-2">
            اضغط لتوليد نشرة أسبوعية تلقائية
          </p>
          <p className="text-xs text-slate-500 mb-6">
            يسحب أبرز التقارير والأدوات من آخر 7 أيام ويبني النشرة تلقائياً
          </p>
          <button
            onClick={generate}
            disabled={generating}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-50 transition"
          >
            {generating
              ? <><Loader2 className="h-4 w-4 animate-spin" /> جارٍ التوليد...</>
              : <><Sparkles className="h-4 w-4" /> توليد النشرة</>
            }
          </button>
        </div>
      )}

      {/* Content summary */}
      {data && (
        <>
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4 text-center shadow-sm">
              <p className="text-2xl font-black text-indigo-600">{data.articles.length}</p>
              <p className="text-xs text-slate-500 mt-1">تقارير مختارة</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 text-center shadow-sm">
              <p className="text-2xl font-black text-violet-600">{data.tools.length}</p>
              <p className="text-xs text-slate-500 mt-1">أدوات AI</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 text-center shadow-sm">
              <p className="text-sm font-bold text-slate-700 mt-1">{data.weekLabel}</p>
              <p className="text-xs text-slate-500 mt-1">فترة النشرة</p>
            </div>
          </div>

          {/* Articles list */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-bold text-slate-700 mb-3">📰 التقارير المختارة</p>
            <div className="space-y-2">
              {data.articles.map((a, i) => (
                <div key={i} className="flex items-start gap-3 rounded-lg bg-slate-50 p-3">
                  {a.imageUrl && (
                    <img src={a.imageUrl} alt="" className="h-12 w-16 rounded-lg object-cover shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-indigo-600 mb-0.5">{a.category}</p>
                    <p className="text-sm font-semibold text-slate-800 line-clamp-1">{a.titleAr}</p>
                    <p className="text-xs text-slate-500 line-clamp-1">{a.summary}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tools list */}
          {data.tools.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-bold text-slate-700 mb-3">🛠️ أدوات الأسبوع</p>
              <div className="flex flex-wrap gap-2">
                {data.tools.map((t, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                    {t.logoUrl
                      ? <img src={t.logoUrl} alt="" className="h-6 w-6 rounded object-cover" />
                      : <span className="text-base">🤖</span>
                    }
                    <span className="text-sm font-semibold text-slate-700">{t.name}</span>
                    {t.tagline && <span className="text-xs text-slate-400 hidden sm:block">— {t.tagline.slice(0, 30)}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Preview / HTML tabs */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="flex border-b border-slate-100">
              <button
                onClick={() => setTab("preview")}
                className={`flex items-center gap-1.5 px-4 py-3 text-sm font-semibold transition ${tab === "preview" ? "border-b-2 border-indigo-600 text-indigo-600" : "text-slate-500 hover:text-slate-700"}`}
              >
                <Eye className="h-4 w-4" /> معاينة
              </button>
              <button
                onClick={() => setTab("html")}
                className={`flex items-center gap-1.5 px-4 py-3 text-sm font-semibold transition ${tab === "html" ? "border-b-2 border-indigo-600 text-indigo-600" : "text-slate-500 hover:text-slate-700"}`}
              >
                HTML
              </button>
            </div>
            {tab === "preview" ? (
              <iframe
                srcDoc={html}
                className="w-full border-0"
                style={{ height: "600px" }}
                title="newsletter preview"
              />
            ) : (
              <textarea
                value={html}
                onChange={(e) => setHtml(e.target.value)}
                className="w-full font-mono text-xs p-4 text-slate-600 outline-none resize-none"
                style={{ height: "400px" }}
                dir="ltr"
              />
            )}
          </div>

          {/* Send section */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-bold text-slate-700 mb-4">📤 إرسال النشرة</p>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">إرسال إلى (بريد اختبار)</label>
                <input
                  type="email"
                  value={toEmail}
                  onChange={(e) => setToEmail(e.target.value)}
                  placeholder="hanna.obead@gmail.com"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
                  dir="ltr"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">عنوان البريد</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
                />
              </div>
              <button
                onClick={sendEmail}
                disabled={sending || !toEmail}
                className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50 transition"
              >
                {sending
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> جارٍ الإرسال...</>
                  : <><Send className="h-4 w-4" /> إرسال النشرة</>
                }
              </button>

              {status && (
                <div className={`flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold ${status.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
                  {status.type === "success"
                    ? <CheckCircle2 className="h-4 w-4 shrink-0" />
                    : <AlertCircle className="h-4 w-4 shrink-0" />
                  }
                  {status.msg}
                </div>
              )}
            </div>
          </div>

          {/* Regenerate */}
          <div className="flex justify-center">
            <button
              onClick={() => { setData(null); setHtml(""); setStatus(null); }}
              className="text-xs text-slate-400 hover:text-slate-600 underline transition"
            >
              إعادة التوليد من البداية
            </button>
          </div>
        </>
      )}
    </div>
  );
}
