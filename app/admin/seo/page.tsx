"use client";

import * as React from "react";
import Link from "next/link";
import {
  Loader2, RefreshCw, Search, TrendingUp, AlertTriangle,
  CheckCircle, Lightbulb, Target, BarChart2, Sparkles,
} from "lucide-react";

/* ─── types ─── */
interface MissingArticle {
  id: string; titleAr: string; slug: string; viewCount: number;
  category: string; missing: string[];
}
interface MissingTool {
  id: string; name: string; slug: string; viewCount: number;
  toolCategory: string; missing: string[];
}
interface Keyword { keyword: string; count: number; type?: string }
interface CategoryCoverage { nameAr: string; slug: string; articleCount: number }
interface SeoData {
  summary: {
    overallScore: number; articleSeoScore: number; toolSeoScore: number;
    totalArticles: number; totalTools: number;
    articlesMissingSeoCount: number; toolsMissingSeoCount: number;
    uncoveredKeywordsCount: number;
  };
  articlesMissingSeo: MissingArticle[];
  toolsMissingSeo: MissingTool[];
  topKeywords: Keyword[];
  uncoveredKeywords: Keyword[];
  categoryCoverage: CategoryCoverage[];
}
interface Recommendation { title: string; description: string; priority: "high" | "medium" | "low" }
interface ContentIdea { topic: string; keywords: string[]; reason: string }
interface AiAnalysis {
  summary: string;
  strengths: string[];
  gaps: string[];
  recommendations: Recommendation[];
  contentIdeas: ContentIdea[];
}

/* ─── helpers ─── */
function ScoreRing({ score, size = 80 }: { score: number; size?: number }) {
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const color = score >= 80 ? "#10b981" : score >= 60 ? "#f59e0b" : "#ef4444";
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e2e8f0" strokeWidth={8} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={8}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        style={{ transition: "stroke-dasharray 0.8s ease" }} />
      <text x={size / 2} y={size / 2 + 5} textAnchor="middle"
        style={{ transform: "rotate(90deg)", transformOrigin: `${size / 2}px ${size / 2}px`, fontSize: 18, fontWeight: 900, fill: color }}>
        {score}
      </text>
    </svg>
  );
}

function MissingBadge({ field }: { field: string }) {
  const labels: Record<string, string> = {
    seoTitle: "عنوان SEO", seoDescription: "وصف SEO", imageAlt: "وصف الصورة", keywords: "كلمات مفتاحية",
  };
  return (
    <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-600 border border-red-100">
      {labels[field] ?? field}
    </span>
  );
}

function PriorityBadge({ p }: { p: string }) {
  const styles: Record<string, string> = {
    high: "bg-red-50 text-red-700 border-red-100",
    medium: "bg-amber-50 text-amber-700 border-amber-100",
    low: "bg-emerald-50 text-emerald-700 border-emerald-100",
  };
  const labels: Record<string, string> = { high: "عالية", medium: "متوسطة", low: "منخفضة" };
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${styles[p] ?? ""}`}>
      {labels[p] ?? p}
    </span>
  );
}

/* ─── main page ─── */
export default function AdminSeoPage() {
  const [data, setData] = React.useState<SeoData | null>(null);
  const [ai, setAi] = React.useState<AiAnalysis | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [analyzing, setAnalyzing] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<"overview" | "articles" | "tools" | "keywords">("overview");

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/seo");
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  const runAnalysis = React.useCallback(async () => {
    if (!data) return;
    setAnalyzing(true);
    try {
      const res = await fetch("/api/admin/seo/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topKeywords: data.topKeywords,
          uncoveredKeywords: data.uncoveredKeywords,
          categoryCoverage: data.categoryCoverage,
          overallScore: data.summary.overallScore,
        }),
      });
      if (res.ok) setAi(await res.json());
    } finally {
      setAnalyzing(false);
    }
  }, [data]);

  React.useEffect(() => { fetchData(); }, [fetchData]);

  const tabs = [
    { key: "overview", label: "نظرة عامة", icon: BarChart2 },
    { key: "articles", label: `المقالات (${data?.summary.articlesMissingSeoCount ?? 0})`, icon: AlertTriangle },
    { key: "tools", label: `الأدوات (${data?.summary.toolsMissingSeoCount ?? 0})`, icon: AlertTriangle },
    { key: "keywords", label: "الكلمات المفتاحية", icon: Search },
  ] as const;

  return (
    <div className="container mx-auto px-4 py-8" dir="rtl">

      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 rounded-[2rem] bg-white p-6 shadow-lg shadow-slate-200/60 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="mb-2 text-sm font-semibold text-[#667eea]">لوحة الإدارة</p>
          <h1 className="text-3xl font-black text-slate-900">تحليل SEO</h1>
          <p className="mt-1 text-slate-500">مراقبة وتحسين محركات البحث لجميع المحتوى</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/admin" className="rounded-2xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200">الرئيسية</Link>
          <button onClick={fetchData} disabled={loading}
            className="flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200 disabled:opacity-50">
            <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
            تحديث
          </button>
          <button onClick={runAnalysis} disabled={analyzing || !data || loading}
            className="flex items-center gap-2 rounded-2xl bg-[#667eea] px-4 py-2 text-sm font-semibold text-white hover:bg-[#667eea]/90 disabled:opacity-50">
            {analyzing ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
            {analyzing ? "جارٍ التحليل..." : "تحليل AI"}
          </button>
        </div>
      </div>

      {loading && !data ? (
        <div className="flex items-center justify-center py-32">
          <Loader2 className="size-8 animate-spin text-[#667eea]" />
        </div>
      ) : !data ? (
        <p className="text-center text-slate-500">فشل تحميل البيانات</p>
      ) : (
        <div className="space-y-6">

          {/* Score cards */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <div className="col-span-2 lg:col-span-1 flex flex-col items-center justify-center rounded-[2rem] bg-white p-6 shadow-lg shadow-slate-200/60">
              <ScoreRing score={data.summary.overallScore} size={90} />
              <p className="mt-3 text-sm font-black text-slate-700">نقاط SEO الإجمالية</p>
            </div>
            <div className="rounded-[2rem] bg-white p-5 shadow-lg shadow-slate-200/60">
              <p className="text-xs font-semibold text-slate-400 mb-3">المقالات</p>
              <p className="text-3xl font-black text-slate-900">{data.summary.articleSeoScore}%</p>
              <p className="mt-1 text-xs text-slate-400">
                {data.summary.articlesMissingSeoCount} من {data.summary.totalArticles} تحتاج تحسين
              </p>
            </div>
            <div className="rounded-[2rem] bg-white p-5 shadow-lg shadow-slate-200/60">
              <p className="text-xs font-semibold text-slate-400 mb-3">الأدوات</p>
              <p className="text-3xl font-black text-slate-900">{data.summary.toolSeoScore}%</p>
              <p className="mt-1 text-xs text-slate-400">
                {data.summary.toolsMissingSeoCount} من {data.summary.totalTools} تحتاج تحسين
              </p>
            </div>
            <div className="rounded-[2rem] bg-white p-5 shadow-lg shadow-slate-200/60">
              <p className="text-xs font-semibold text-slate-400 mb-3">كلمات غير مغطاة</p>
              <p className="text-3xl font-black text-amber-500">{data.summary.uncoveredKeywordsCount}</p>
              <p className="mt-1 text-xs text-slate-400">فرص تحسين محتوى</p>
            </div>
          </div>

          {/* AI Analysis panel */}
          {ai && (
            <div className="rounded-[2rem] bg-gradient-to-br from-[#667eea]/5 to-violet-50 border border-[#667eea]/20 p-6 shadow-lg shadow-slate-200/60">
              <div className="mb-5 flex items-center gap-2">
                <Sparkles className="size-5 text-[#667eea]" />
                <h2 className="font-black text-slate-900">تحليل AI — التوصيات</h2>
              </div>

              <p className="mb-5 text-sm text-slate-600 leading-relaxed">{ai.summary}</p>

              <div className="grid gap-5 lg:grid-cols-2">
                {/* Strengths */}
                <div>
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-black text-slate-700">
                    <CheckCircle className="size-4 text-emerald-500" /> نقاط القوة
                  </h3>
                  <ul className="space-y-2">
                    {ai.strengths.map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                        <span className="mt-0.5 size-1.5 shrink-0 rounded-full bg-emerald-400" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
                {/* Gaps */}
                <div>
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-black text-slate-700">
                    <AlertTriangle className="size-4 text-amber-500" /> الفجوات
                  </h3>
                  <ul className="space-y-2">
                    {ai.gaps.map((g, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                        <span className="mt-0.5 size-1.5 shrink-0 rounded-full bg-amber-400" />
                        {g}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Recommendations */}
              <div className="mt-5">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-black text-slate-700">
                  <Target className="size-4 text-[#667eea]" /> التوصيات
                </h3>
                <div className="space-y-3">
                  {ai.recommendations.map((r, i) => (
                    <div key={i} className="rounded-2xl bg-white/80 p-4 border border-white">
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <p className="font-semibold text-slate-800 text-sm">{r.title}</p>
                        <PriorityBadge p={r.priority} />
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed">{r.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Content Ideas */}
              <div className="mt-5">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-black text-slate-700">
                  <Lightbulb className="size-4 text-amber-500" /> أفكار محتوى مقترحة
                </h3>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {ai.contentIdeas.map((idea, i) => (
                    <div key={i} className="rounded-2xl bg-white/80 p-4 border border-white">
                      <p className="font-semibold text-slate-800 text-sm mb-1">{idea.topic}</p>
                      <p className="text-xs text-slate-400 mb-2">{idea.reason}</p>
                      <div className="flex flex-wrap gap-1">
                        {idea.keywords.map((kw) => (
                          <span key={kw} className="rounded-full bg-[#667eea]/10 px-2 py-0.5 text-xs text-[#667eea] font-medium">
                            {kw}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="rounded-[2rem] bg-white shadow-lg shadow-slate-200/60 overflow-hidden">
            <div className="flex border-b border-slate-100 overflow-x-auto">
              {tabs.map(({ key, label, icon: Icon }) => (
                <button key={key} onClick={() => setActiveTab(key)}
                  className={`flex items-center gap-2 px-5 py-4 text-sm font-semibold whitespace-nowrap transition border-b-2 ${
                    activeTab === key
                      ? "border-[#667eea] text-[#667eea]"
                      : "border-transparent text-slate-500 hover:text-slate-700"
                  }`}>
                  <Icon className="size-4" />
                  {label}
                </button>
              ))}
            </div>

            <div className="p-6">

              {/* Overview tab */}
              {activeTab === "overview" && (
                <div className="grid gap-6 lg:grid-cols-2">
                  {/* Category coverage */}
                  <div>
                    <h3 className="mb-4 font-black text-slate-900">تغطية التصنيفات</h3>
                    <div className="space-y-3">
                      {data.categoryCoverage
                        .sort((a, b) => b.articleCount - a.articleCount)
                        .map((cat) => {
                          const max = Math.max(...data.categoryCoverage.map((c) => c.articleCount), 1);
                          return (
                            <div key={cat.slug}>
                              <div className="mb-1 flex items-center justify-between text-sm">
                                <span className="font-semibold text-slate-700">{cat.nameAr}</span>
                                <span className="text-xs text-slate-400">{cat.articleCount} مقال</span>
                              </div>
                              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                                <div className="h-full rounded-full bg-[#667eea] transition-all duration-500"
                                  style={{ width: `${(cat.articleCount / max) * 100}%` }} />
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>

                  {/* Uncovered keywords */}
                  <div>
                    <h3 className="mb-4 font-black text-slate-900">كلمات شائعة غير مغطاة</h3>
                    {data.uncoveredKeywords.length === 0 ? (
                      <div className="flex items-center gap-2 text-emerald-600 text-sm font-semibold">
                        <CheckCircle className="size-4" /> ممتاز! جميع الكلمات مغطاة
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {data.uncoveredKeywords.map((kw) => (
                          <span key={kw.keyword}
                            className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-sm font-medium text-amber-700">
                            <TrendingUp className="size-3" />
                            {kw.keyword}
                            <span className="text-xs opacity-60">({kw.count})</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Articles tab */}
              {activeTab === "articles" && (
                <div>
                  <p className="mb-4 text-sm text-slate-500">
                    {data.articlesMissingSeo.length === 0
                      ? "جميع المقالات لديها بيانات SEO كاملة"
                      : `${data.summary.articlesMissingSeoCount} مقال تحتاج إلى تحسين SEO`}
                  </p>
                  <div className="space-y-3">
                    {data.articlesMissingSeo.map((art) => (
                      <div key={art.id} className="flex items-start gap-4 rounded-2xl border border-slate-100 p-4 hover:border-slate-200 transition">
                        <div className="min-w-0 flex-1">
                          <div className="mb-1 flex items-start justify-between gap-2">
                            <a href={`/news/${art.slug}`} target="_blank"
                              className="text-sm font-semibold text-slate-800 hover:text-[#667eea] transition line-clamp-1">
                              {art.titleAr}
                            </a>
                            <span className="shrink-0 text-xs text-slate-400">{art.viewCount} 👁</span>
                          </div>
                          <p className="mb-2 text-xs text-slate-400">{art.category}</p>
                          <div className="flex flex-wrap gap-1">
                            {art.missing.map((f) => <MissingBadge key={f} field={f} />)}
                          </div>
                        </div>
                        <Link href={`/admin/articles/${art.id}/edit`}
                          className="shrink-0 rounded-xl bg-[#667eea]/10 px-3 py-1.5 text-xs font-semibold text-[#667eea] hover:bg-[#667eea]/20 transition">
                          تحرير
                        </Link>
                      </div>
                    ))}
                    {data.articlesMissingSeo.length === 0 && (
                      <div className="flex items-center gap-2 text-emerald-600 font-semibold">
                        <CheckCircle className="size-5" /> لا توجد مقالات تحتاج تحسين
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tools tab */}
              {activeTab === "tools" && (
                <div>
                  <p className="mb-4 text-sm text-slate-500">
                    {data.toolsMissingSeo.length === 0
                      ? "جميع الأدوات لديها بيانات SEO كاملة"
                      : `${data.summary.toolsMissingSeoCount} أداة تحتاج إلى تحسين SEO`}
                  </p>
                  <div className="space-y-3">
                    {data.toolsMissingSeo.map((tool) => (
                      <div key={tool.id} className="flex items-start gap-4 rounded-2xl border border-slate-100 p-4 hover:border-slate-200 transition">
                        <div className="min-w-0 flex-1">
                          <div className="mb-1 flex items-start justify-between gap-2">
                            <a href={`/ai-tools/${tool.slug}`} target="_blank"
                              className="text-sm font-semibold text-slate-800 hover:text-[#667eea] transition">
                              {tool.name}
                            </a>
                            <span className="shrink-0 text-xs text-slate-400">{tool.viewCount} 👁</span>
                          </div>
                          <p className="mb-2 text-xs text-slate-400">{tool.toolCategory}</p>
                          <div className="flex flex-wrap gap-1">
                            {tool.missing.map((f) => <MissingBadge key={f} field={f} />)}
                          </div>
                        </div>
                        <Link href={`/admin/ai-tools`}
                          className="shrink-0 rounded-xl bg-[#667eea]/10 px-3 py-1.5 text-xs font-semibold text-[#667eea] hover:bg-[#667eea]/20 transition">
                          تحرير
                        </Link>
                      </div>
                    ))}
                    {data.toolsMissingSeo.length === 0 && (
                      <div className="flex items-center gap-2 text-emerald-600 font-semibold">
                        <CheckCircle className="size-5" /> لا توجد أدوات تحتاج تحسين
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Keywords tab */}
              {activeTab === "keywords" && (
                <div className="grid gap-6 lg:grid-cols-2">
                  <div>
                    <h3 className="mb-4 font-black text-slate-900">أبرز الكلمات المفتاحية</h3>
                    <div className="space-y-2">
                      {data.topKeywords.map((kw, i) => {
                        const max = data.topKeywords[0]?.count ?? 1;
                        return (
                          <div key={kw.keyword} className="flex items-center gap-3">
                            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#667eea]/10 text-xs font-black text-[#667eea]">
                              {i + 1}
                            </span>
                            <div className="flex-1 min-w-0">
                              <div className="mb-0.5 flex items-center justify-between gap-2 text-sm">
                                <span className="font-semibold text-slate-700 truncate">{kw.keyword}</span>
                                <span className="shrink-0 text-xs text-slate-400">{kw.count}</span>
                              </div>
                              <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                                <div className="h-full rounded-full bg-[#667eea]"
                                  style={{ width: `${(kw.count / max) * 100}%` }} />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <h3 className="mb-4 font-black text-slate-900">كلمات شائعة تحتاج محتوى</h3>
                    {data.uncoveredKeywords.length === 0 ? (
                      <div className="flex items-center gap-2 text-emerald-600 text-sm font-semibold">
                        <CheckCircle className="size-4" /> جميع الكلمات الشائعة مغطاة
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {data.uncoveredKeywords.map((kw) => (
                          <div key={kw.keyword} className="flex items-center justify-between rounded-xl border border-amber-100 bg-amber-50/50 px-4 py-2.5">
                            <div className="flex items-center gap-2">
                              <TrendingUp className="size-3.5 text-amber-500" />
                              <span className="text-sm font-semibold text-slate-700">{kw.keyword}</span>
                            </div>
                            <span className="text-xs text-amber-600 font-semibold">{kw.count} بحث</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>
          </div>

        </div>
      )}
    </div>
  );
}
