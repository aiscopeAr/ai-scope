"use client";

import * as React from "react";
import Link from "next/link";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { Loader2, TrendingUp, FileText, Eye, Calendar, RefreshCw } from "lucide-react";

/* ─── types ─── */
interface DayData { date: string; articles: number; views: number }
interface TopArticle { id: string; titleAr: string; slug: string; viewCount: number; sourceName: string; publishedAt: string | null; category: { nameAr: string } }
interface CategoryStat { id: string; nameAr: string; slug: string; articleCount: number; totalViews: number }
interface SourceStat { sourceName: string; articleCount: number; totalViews: number }
interface Summary { totalViews: number; totalArticles: number; publishedArticles: number; articlesLast7d: number; articlesLast30d: number }
interface AnalyticsData {
  summary: Summary;
  days: DayData[];
  topArticles: TopArticle[];
  categoryStats: CategoryStat[];
  sourceStats: SourceStat[];
  queueBreakdown: Record<string, number>;
}

/* ─── SVG bar chart ─── */
function BarChart({ days, metric }: { days: DayData[]; metric: "articles" | "views" }) {
  const values = days.map((d) => d[metric]);
  const max = Math.max(...values, 1);
  const W = 600; const H = 120; const BAR_W = Math.floor(W / days.length) - 2;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 120 }}>
      {days.map((d, i) => {
        const h = Math.max(2, (values[i] / max) * (H - 20));
        const x = i * (W / days.length);
        const y = H - h;
        const isWeekend = new Date(d.date).getDay() === 0 || new Date(d.date).getDay() === 6;
        return (
          <g key={d.date}>
            <rect
              x={x + 1} y={y} width={BAR_W} height={h}
              rx={3}
              fill={values[i] === 0 ? "rgba(255,255,255,0.04)" : isWeekend ? "rgba(139,92,246,0.5)" : "rgba(139,92,246,0.8)"}
              className="transition-all duration-300"
            />
            {values[i] > 0 && (
              <title>{d.date}: {values[i]} {metric === "articles" ? "مقال" : "مشاهدة"}</title>
            )}
          </g>
        );
      })}
      {/* x-axis labels every 5 days */}
      {days.filter((_, i) => i % 5 === 0).map((d, i) => (
        <text key={d.date} x={i * 5 * (W / days.length) + BAR_W / 2} y={H - 2}
          fontSize={8} fill="rgba(148,163,184,0.6)" textAnchor="middle">
          {d.date.slice(5)}
        </text>
      ))}
    </svg>
  );
}

/* ─── horizontal bar ─── */
function HBar({ value, max, color = "bg-violet-500" }: { value: number; max: number; color?: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/6">
      <div className={`h-full rounded-full ${color} transition-all duration-500`} style={{ width: `${pct}%` }} />
    </div>
  );
}

/* ─── stat card ─── */
function StatCard({ label, value, sub, icon: Icon, color }: { label: string; value: string | number; sub?: string; icon: React.ElementType; color: string }) {
  return (
    <div className="rounded-[1.5rem] bg-white p-5 shadow-md shadow-slate-200/60">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-semibold text-slate-400">{label}</p>
        <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${color}`}>
          <Icon className="size-4" />
        </div>
      </div>
      <p className="text-3xl font-black text-slate-900">{typeof value === "number" ? value.toLocaleString("ar-EG") : value}</p>
      {sub && <p className="mt-1 text-xs text-slate-400">{sub}</p>}
    </div>
  );
}

/* ─── main page ─── */
export default function AdminAnalyticsPage() {
  const [data, setData] = React.useState<AnalyticsData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [metric, setMetric] = React.useState<"articles" | "views">("articles");

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/analytics");
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { fetchData(); }, [fetchData]);

  const maxCatViews = data ? Math.max(...data.categoryStats.map((c) => c.totalViews), 1) : 1;
  const maxSrcViews = data ? Math.max(...data.sourceStats.map((s) => s.totalViews), 1) : 1;
  const maxTopViews = data ? Math.max(...data.topArticles.map((a) => a.viewCount), 1) : 1;

  return (
    <div className="container mx-auto px-4 py-8" dir="rtl">

      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 rounded-[2rem] bg-white p-6 shadow-lg shadow-slate-200/60 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="mb-2 text-sm font-semibold text-[#667eea]">لوحة الإدارة</p>
          <h1 className="text-3xl font-black text-slate-900">تحليلات الموقع</h1>
          <p className="mt-1 text-slate-500">بيانات المقالات والمشاهدات — آخر 30 يوم</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/admin" className="rounded-2xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200">الرئيسية</Link>
          <button onClick={fetchData} disabled={loading}
            className="flex items-center gap-2 rounded-2xl bg-[#667eea]/10 px-4 py-2 text-sm font-semibold text-[#667eea] hover:bg-[#667eea]/20 disabled:opacity-50">
            <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
            تحديث
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

          {/* Summary stats */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
            <StatCard label="إجمالي المشاهدات" value={data.summary.totalViews} icon={Eye} color="bg-violet-100 text-violet-600" />
            <StatCard label="المقالات المنشورة" value={data.summary.publishedArticles} sub={`من ${data.summary.totalArticles} إجمالي`} icon={FileText} color="bg-emerald-100 text-emerald-600" />
            <StatCard label="نُشر آخر 7 أيام" value={data.summary.articlesLast7d} icon={TrendingUp} color="bg-blue-100 text-blue-600" />
            <StatCard label="نُشر آخر 30 يوم" value={data.summary.articlesLast30d} icon={Calendar} color="bg-amber-100 text-amber-600" />
            <StatCard
              label="الطابور"
              value={(data.queueBreakdown["pending"] ?? 0) + (data.queueBreakdown["processed"] ?? 0)}
              sub={data.queueBreakdown["failed"] ? `${data.queueBreakdown["failed"]} فشل` : "لا أخطاء"}
              icon={RefreshCw}
              color={data.queueBreakdown["failed"] ? "bg-red-100 text-red-600" : "bg-slate-100 text-slate-600"}
            />
          </div>

          {/* Daily chart */}
          <div className="rounded-[2rem] bg-white p-6 shadow-lg shadow-slate-200/60">
            <div className="mb-4 flex items-center justify-between flex-wrap gap-3">
              <h2 className="font-black text-slate-900">النشاط اليومي — آخر 30 يوم</h2>
              <div className="flex items-center gap-1 rounded-xl border border-slate-200 p-1">
                <button onClick={() => setMetric("articles")}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${metric === "articles" ? "bg-[#667eea] text-white" : "text-slate-500 hover:text-slate-800"}`}>
                  المقالات
                </button>
                <button onClick={() => setMetric("views")}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${metric === "views" ? "bg-[#667eea] text-white" : "text-slate-500 hover:text-slate-800"}`}>
                  المشاهدات
                </button>
              </div>
            </div>
            <BarChart days={data.days} metric={metric} />
            <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
              <span>{data.days[0]?.date}</span>
              <span className="text-slate-300">
                المجموع: {data.days.reduce((s, d) => s + d[metric], 0).toLocaleString("ar-EG")} {metric === "articles" ? "مقال" : "مشاهدة"}
              </span>
              <span>{data.days[data.days.length - 1]?.date}</span>
            </div>
          </div>

          {/* Categories + Sources side by side */}
          <div className="grid gap-6 lg:grid-cols-2">

            {/* By category */}
            <div className="rounded-[2rem] bg-white p-6 shadow-lg shadow-slate-200/60">
              <h2 className="mb-5 font-black text-slate-900">حسب التصنيف</h2>
              <div className="space-y-4">
                {data.categoryStats.filter((c) => c.articleCount > 0).map((cat) => (
                  <div key={cat.id}>
                    <div className="mb-1.5 flex items-center justify-between text-sm">
                      <Link href={`/category/${cat.slug}`} target="_blank"
                        className="font-semibold text-slate-800 hover:text-[#667eea] transition">
                        {cat.nameAr}
                      </Link>
                      <div className="flex items-center gap-3 text-xs text-slate-400">
                        <span>{cat.articleCount} مقال</span>
                        <span className="font-semibold text-slate-700">{cat.totalViews.toLocaleString("ar-EG")} 👁</span>
                      </div>
                    </div>
                    <HBar value={cat.totalViews} max={maxCatViews} color="bg-violet-500" />
                  </div>
                ))}
                {data.categoryStats.every((c) => c.articleCount === 0) && (
                  <p className="text-sm text-slate-400">لا توجد بيانات بعد</p>
                )}
              </div>
            </div>

            {/* By source */}
            <div className="rounded-[2rem] bg-white p-6 shadow-lg shadow-slate-200/60">
              <h2 className="mb-5 font-black text-slate-900">حسب المصدر</h2>
              <div className="space-y-4">
                {data.sourceStats.slice(0, 10).map((src) => (
                  <div key={src.sourceName}>
                    <div className="mb-1.5 flex items-center justify-between text-sm">
                      <span className="font-semibold text-slate-800 truncate max-w-[160px]">{src.sourceName}</span>
                      <div className="flex items-center gap-3 text-xs text-slate-400 shrink-0">
                        <span>{src.articleCount} مقال</span>
                        <span className="font-semibold text-slate-700">{src.totalViews.toLocaleString("ar-EG")} 👁</span>
                      </div>
                    </div>
                    <HBar value={src.totalViews} max={maxSrcViews} color="bg-blue-500" />
                  </div>
                ))}
                {data.sourceStats.length === 0 && (
                  <p className="text-sm text-slate-400">لا توجد بيانات بعد</p>
                )}
              </div>
            </div>
          </div>

          {/* Top articles */}
          <div className="rounded-[2rem] bg-white p-6 shadow-lg shadow-slate-200/60">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-black text-slate-900">أكثر المقالات مشاهدةً</h2>
              <Link href="/admin/articles?sortBy=viewCount&sortOrder=desc"
                className="text-xs font-semibold text-[#667eea] hover:underline">
                عرض الكل
              </Link>
            </div>
            {data.topArticles.length === 0 ? (
              <p className="text-sm text-slate-400">لا توجد مشاهدات بعد</p>
            ) : (
              <div className="space-y-3">
                {data.topArticles.map((art, i) => (
                  <div key={art.id} className="flex items-center gap-4">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#667eea]/10 text-xs font-black text-[#667eea]">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <a href={`/news/${art.slug}`} target="_blank"
                          className="truncate text-sm font-semibold text-slate-800 hover:text-[#667eea] transition">
                          {art.titleAr}
                        </a>
                        <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
                          {art.viewCount.toLocaleString("ar-EG")} 👁
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span>{art.category.nameAr}</span>
                        <span>·</span>
                        <span>{art.sourceName}</span>
                        {art.publishedAt && (
                          <>
                            <span>·</span>
                            <span>{format(new Date(art.publishedAt), "d MMM yyyy", { locale: ar })}</span>
                          </>
                        )}
                      </div>
                      <HBar value={art.viewCount} max={maxTopViews} color="bg-emerald-400" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Queue breakdown */}
          <div className="rounded-[2rem] bg-white p-6 shadow-lg shadow-slate-200/60">
            <h2 className="mb-5 font-black text-slate-900">حالة الطابور</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {[
                { key: "pending",    label: "انتظار",       color: "bg-amber-50  text-amber-700  border-amber-100"  },
                { key: "processing", label: "جارٍ",         color: "bg-blue-50   text-blue-700   border-blue-100"   },
                { key: "processed",  label: "جاهز",         color: "bg-violet-50 text-violet-700 border-violet-100" },
                { key: "approved",   label: "معتمد",        color: "bg-emerald-50 text-emerald-700 border-emerald-100" },
                { key: "rejected",   label: "مرفوض",        color: "bg-slate-50  text-slate-500  border-slate-200"  },
                { key: "failed",     label: "فشل",          color: "bg-red-50    text-red-700    border-red-200"    },
              ].map(({ key, label, color }) => (
                <div key={key} className={`rounded-2xl border p-4 text-center ${color}`}>
                  <p className="text-2xl font-black">{(data.queueBreakdown[key] ?? 0).toLocaleString("ar-EG")}</p>
                  <p className="mt-1 text-xs font-semibold">{label}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
