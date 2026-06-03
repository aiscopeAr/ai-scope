"use client";

import { useEffect, useState } from "react";
import { TrendingUp, RefreshCw, Loader2, ArrowUpRight, BarChart2 } from "lucide-react";

interface Insight { title: string; body: string; type: "win" | "warning" | "tip" }
interface ArticleTop { slug: string; titleAr: string; viewCount: number; authorSlug: string }
interface PromptTop { slug: string; titleAr: string; viewCount: number; category: string }

interface WeeklyReport {
  id: string;
  weekStart: string;
  weekEnd: string;
  summary: string;
  insights: Insight[];
  topContent: { articles: ArticleTop[]; prompts: PromptTop[] };
  stats: { totalPageViews: number; articlesPublished: number; promptsGenerated: number; newSubscribers: number; avgDailyViews: number; allTimeViews: number };
  sentAt: string | null;
  createdAt: string;
}

interface DailyStats {
  date: string;
  pageViews: number;
  articlesPublished: number;
  promptsGenerated: number;
}

const INSIGHT_STYLE: Record<string, { bg: string; border: string; icon: string }> = {
  win:     { bg: "bg-emerald-50", border: "border-emerald-400", icon: "✅" },
  warning: { bg: "bg-amber-50",   border: "border-amber-400",   icon: "⚠️" },
  tip:     { bg: "bg-indigo-50",  border: "border-indigo-400",  icon: "💡" },
};

export default function ReportsPage() {
  const [reports, setReports] = useState<WeeklyReport[]>([]);
  const [daily, setDaily] = useState<DailyStats[]>([]);
  const [selected, setSelected] = useState<WeeklyReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/reports");
      const d = await res.json();
      setReports(d.reports ?? []);
      setDaily(d.daily ?? []);
      if (d.reports?.length > 0) setSelected(d.reports[0]);
    } finally { setLoading(false); }
  }

  async function generate() {
    setGenerating(true);
    try {
      const res = await fetch("/api/admin/reports/generate", { method: "POST" });
      const d = await res.json();
      if (d.ok) { await load(); }
    } finally { setGenerating(false); }
  }

  useEffect(() => { load(); }, []);

  const maxViews = Math.max(...daily.map(d => d.pageViews), 1);

  return (
    <div className="p-6 space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900">التقارير الأسبوعية</h1>
          <p className="text-sm text-slate-500 mt-0.5">تحليل AI لأداء الموقع أسبوعياً</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50">
            <RefreshCw className="h-3.5 w-3.5" /> تحديث
          </button>
          <button onClick={generate} disabled={generating}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60">
            {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <TrendingUp className="h-4 w-4" />}
            توليد تقرير الآن
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-indigo-500" /></div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">

          {/* Sidebar — report list */}
          <div className="space-y-2">
            {reports.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-white p-6 text-center">
                <p className="text-4xl mb-2">📊</p>
                <p className="text-sm text-slate-500">لا توجد تقارير بعد</p>
                <p className="text-xs text-slate-400 mt-1">اضغط "توليد تقرير الآن"</p>
              </div>
            ) : reports.map(r => (
              <button key={r.id} onClick={() => setSelected(r)}
                className={`w-full rounded-xl border p-4 text-right transition-all ${selected?.id === r.id ? "border-indigo-300 bg-indigo-50 ring-1 ring-indigo-300" : "border-slate-200 bg-white hover:border-slate-300"}`}>
                <p className="text-xs font-bold text-slate-800">
                  {new Date(r.weekStart).toLocaleDateString("ar-SA")} — {new Date(r.weekEnd).toLocaleDateString("ar-SA")}
                </p>
                <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-500">
                  <span>👁 {r.stats.totalPageViews?.toLocaleString("ar-SA")}</span>
                  <span>📝 {r.stats.articlesPublished} مقال</span>
                  {r.sentAt && <span className="text-emerald-600">✓ أُرسل</span>}
                </div>
              </button>
            ))}
          </div>

          {/* Main — selected report */}
          <div className="space-y-5">
            {/* Daily chart */}
            {daily.length > 0 && (
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart2 className="h-4 w-4 text-slate-400" />
                  <h3 className="text-sm font-bold text-slate-900">المشاهدات اليومية (آخر 30 يوماً)</h3>
                </div>
                <div className="flex items-end gap-0.5" style={{ height: 80 }}>
                  {daily.map(row => {
                    const pct = (row.pageViews / maxViews) * 100;
                    return (
                      <div key={row.date} className="group relative flex flex-1 flex-col items-center justify-end" style={{ height: "100%" }}>
                        <div className="w-full rounded-t-sm bg-indigo-500 transition-all group-hover:bg-indigo-400"
                          style={{ height: `${Math.max(pct, 2)}%` }} />
                        <span className="absolute -top-6 hidden whitespace-nowrap rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-white group-hover:block z-10">
                          {new Date(row.date).toLocaleDateString("ar-SA", { month: "short", day: "numeric" })}: {row.pageViews}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {selected ? (
              <>
                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[
                    { label: "مشاهدات الأسبوع", value: selected.stats.totalPageViews?.toLocaleString("ar-SA"), color: "text-indigo-600" },
                    { label: "مقالات نُشرت",    value: selected.stats.articlesPublished, color: "text-emerald-600" },
                    { label: "برومبتس جديدة",   value: selected.stats.promptsGenerated, color: "text-violet-600" },
                    { label: "مشتركون جدد",     value: selected.stats.newSubscribers, color: "text-sky-600" },
                  ].map(s => (
                    <div key={s.label} className="rounded-xl border border-slate-200 bg-white p-4 text-center shadow-sm">
                      <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
                      <p className="text-xs text-slate-500 mt-1">{s.label}</p>
                    </div>
                  ))}
                </div>

                {/* Summary */}
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-900 mb-3">ملخص الأسبوع</h3>
                  <p className="text-sm leading-relaxed text-slate-600">{selected.summary}</p>
                </div>

                {/* Insights */}
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-900 mb-4">التوجهات والتوصيات</h3>
                  <div className="space-y-3">
                    {selected.insights.map((ins, i) => {
                      const style = INSIGHT_STYLE[ins.type] ?? INSIGHT_STYLE.tip;
                      return (
                        <div key={i} className={`rounded-lg border-r-4 p-4 ${style.bg} ${style.border}`}>
                          <p className="text-sm font-bold text-slate-800">{style.icon} {ins.title}</p>
                          <p className="text-xs text-slate-600 mt-1 leading-relaxed">{ins.body}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Top content */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-900 mb-3">🏆 أكثر المقالات مشاهدة</h3>
                    <ol className="space-y-2">
                      {selected.topContent.articles?.slice(0, 5).map((a, i) => (
                        <li key={a.slug} className="flex items-center gap-2">
                          <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-black ${i === 0 ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-500"}`}>{i + 1}</span>
                          <a href={`/reviews/${a.slug}`} target="_blank" rel="noopener noreferrer"
                            className="flex-1 truncate text-xs text-slate-700 hover:text-indigo-600">
                            {a.titleAr}
                          </a>
                          <span className="text-[10px] font-bold text-emerald-600">{a.viewCount}</span>
                        </li>
                      ))}
                    </ol>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-900 mb-3">✨ أكثر البرومبتس استخداماً</h3>
                    <ol className="space-y-2">
                      {selected.topContent.prompts?.slice(0, 5).map((p, i) => (
                        <li key={p.slug} className="flex items-center gap-2">
                          <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-black ${i === 0 ? "bg-violet-600 text-white" : "bg-slate-100 text-slate-500"}`}>{i + 1}</span>
                          <a href={`/prompts/${p.slug}`} target="_blank" rel="noopener noreferrer"
                            className="flex-1 truncate text-xs text-slate-700 hover:text-violet-600">
                            {p.titleAr}
                          </a>
                          <span className="text-[10px] font-bold text-violet-600">{p.viewCount}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
              </>
            ) : (
              <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
                <p className="text-slate-400">اختر تقريراً من القائمة</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
