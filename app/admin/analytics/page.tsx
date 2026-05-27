"use client";

import { useEffect, useState } from "react";
import {
  Users, Eye, MousePointerClick, TrendingUp,
  Clock, ArrowUpRight, RefreshCw, BarChart2,
  Globe, FileText,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Overview {
  sessions:      number;
  users:         number;
  pageviews:     number;
  bounceRate:    number;
  avgSessionSec: number;
  newUsers:      number;
}
interface TopPage   { path: string; title: string; pageviews: number; users: number }
interface Source    { channel: string; sessions: number; users: number }
interface DailyRow  { date: string; sessions: number; pageviews: number }

interface AnalyticsData {
  overview:  Overview;
  topPages:  TopPage[];
  sources:   Source[];
  daily:     DailyRow[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtNum(n: number) {
  return n.toLocaleString("ar-EG");
}

function fmtDuration(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return `${m}د ${s}ث`;
}

function fmtDate(raw: string) {
  // raw = "20241115"
  return `${raw.slice(6, 8)}/${raw.slice(4, 6)}`;
}

const CHANNEL_AR: Record<string, string> = {
  "Organic Search":  "بحث طبيعي",
  "Direct":          "مباشر",
  "Referral":        "إحالة",
  "Organic Social":  "سوشيال طبيعي",
  "Paid Search":     "بحث مدفوع",
  "Email":           "بريد إلكتروني",
  "Paid Social":     "سوشيال مدفوع",
  "Display":         "إعلانات ظاهرة",
  "(other)":         "أخرى",
  "Unassigned":      "غير محدد",
};

const RANGE_OPTIONS = [
  { value: "7daysAgo",  label: "7 أيام"   },
  { value: "28daysAgo", label: "28 يوماً" },
  { value: "90daysAgo", label: "90 يوماً" },
];

// ─── Sparkline ───────────────────────────────────────────────────────────────

function Sparkline({ data, color = "#6366f1" }: { data: number[]; color?: string }) {
  if (!data.length) return null;
  const max = Math.max(...data, 1);
  const W = 200; const H = 40;
  const step = W / (data.length - 1 || 1);
  const pts = data.map((v, i) => `${i * step},${H - (v / max) * (H - 4) - 2}`).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-10" preserveAspectRatio="none">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [range, setRange]     = useState("28daysAgo");
  const [data,  setData]      = useState<AnalyticsData | null>(null);
  const [error, setError]     = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch(`/api/admin/analytics?range=${range}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "فشل جلب البيانات");
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [range]);  // eslint-disable-line react-hooks/exhaustive-deps

  const ov = data?.overview;

  // Stats cards config
  const stats = ov ? [
    {
      label: "الجلسات",
      value: fmtNum(ov.sessions),
      icon: MousePointerClick,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
      spark: data?.daily.map(d => d.sessions),
      sparkColor: "#6366f1",
    },
    {
      label: "المستخدمون",
      value: fmtNum(ov.users),
      sub: `${fmtNum(ov.newUsers)} جديد`,
      icon: Users,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      label: "مشاهدات الصفحات",
      value: fmtNum(ov.pageviews),
      icon: Eye,
      color: "text-sky-600",
      bg: "bg-sky-50",
      spark: data?.daily.map(d => d.pageviews),
      sparkColor: "#0ea5e9",
    },
    {
      label: "معدل الارتداد",
      value: `${(ov.bounceRate * 100).toFixed(1)}%`,
      icon: TrendingUp,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      label: "متوسط مدة الجلسة",
      value: fmtDuration(ov.avgSessionSec),
      icon: Clock,
      color: "text-violet-600",
      bg: "bg-violet-50",
    },
  ] : [];

  return (
    <div className="p-6 space-y-6" dir="rtl">

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900">إحصاءات Google Analytics</h1>
          <p className="mt-0.5 text-sm text-slate-500">بيانات GA4 مباشرة من لوحة التحكم</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Range selector */}
          <div className="flex rounded-lg border border-slate-200 overflow-hidden">
            {RANGE_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setRange(opt.value)}
                className={`px-3 py-1.5 text-xs font-semibold transition ${
                  range === opt.value
                    ? "bg-indigo-600 text-white"
                    : "bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            تحديث
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <strong>خطأ:</strong> {error}
          {error.includes("credentials") && (
            <p className="mt-1 text-xs">يرجى إضافة متغيرات البيئة: <code>GA_PROPERTY_ID</code>، <code>GA_CLIENT_EMAIL</code>، <code>GA_PRIVATE_KEY</code> في Vercel.</p>
          )}
          {error.includes("permission") && (
            <p className="mt-1 text-xs">يرجى منح حساب الخدمة صلاحية Viewer في GA4.</p>
          )}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && !data && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-28 rounded-xl border border-slate-200 bg-slate-100 animate-pulse" />
          ))}
        </div>
      )}

      {/* Stats row */}
      {stats.length > 0 && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-500">{s.label}</p>
                    <p className={`mt-1 text-2xl font-black tracking-tight ${s.color}`}>{s.value}</p>
                    {s.sub && <p className="mt-0.5 text-[11px] text-slate-400">{s.sub}</p>}
                  </div>
                  <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${s.bg}`}>
                    <Icon className={`h-4 w-4 ${s.color}`} />
                  </div>
                </div>
                {s.spark && s.spark.length > 1 && (
                  <div className="mt-3 opacity-70">
                    <Sparkline data={s.spark} color={s.sparkColor} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Daily chart */}
      {data && data.daily.length > 1 && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <BarChart2 className="h-4 w-4 text-slate-400" />
            <h3 className="text-sm font-bold text-slate-900">الجلسات اليومية (آخر 28 يوماً)</h3>
          </div>
          <div className="flex items-end gap-0.5" style={{ height: 80 }}>
            {data.daily.map((row) => {
              const max = Math.max(...data.daily.map(d => d.sessions), 1);
              const pct  = (row.sessions / max) * 100;
              return (
                <div
                  key={row.date}
                  className="group relative flex flex-1 flex-col items-center justify-end"
                  style={{ height: "100%" }}
                >
                  <div
                    className="w-full rounded-t-sm bg-indigo-500 transition-all group-hover:bg-indigo-400"
                    style={{ height: `${Math.max(pct, 2)}%` }}
                  />
                  <span className="absolute -top-5 hidden whitespace-nowrap rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-white group-hover:block">
                    {fmtDate(row.date)}: {fmtNum(row.sessions)}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="mt-2 flex justify-between text-[10px] text-slate-400">
            <span>{data.daily[0] ? fmtDate(data.daily[0].date) : ""}</span>
            <span>{data.daily[data.daily.length - 1] ? fmtDate(data.daily[data.daily.length - 1].date) : ""}</span>
          </div>
        </div>
      )}

      {/* Bottom grid */}
      {data && (
        <div className="grid gap-5 lg:grid-cols-2">

          {/* Top pages */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4">
              <FileText className="h-4 w-4 text-slate-400" />
              <h3 className="text-sm font-bold text-slate-900">الصفحات الأكثر زيارة</h3>
            </div>
            <div className="divide-y divide-slate-50">
              {data.topPages.length === 0 && (
                <p className="px-5 py-4 text-sm text-slate-400">لا توجد بيانات</p>
              )}
              {data.topPages.map((page, i) => {
                const maxPv = data.topPages[0]?.pageviews ?? 1;
                return (
                  <div key={page.path} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50">
                    <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-black ${
                      i === 0 ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-500"
                    }`}>{i + 1}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1">
                        <p className="truncate text-xs font-medium text-slate-700">{page.path}</p>
                        <a
                          href={page.path}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="shrink-0 text-slate-300 hover:text-indigo-500"
                        >
                          <ArrowUpRight className="h-3 w-3" />
                        </a>
                      </div>
                      <div className="mt-1 h-1 w-full rounded-full bg-slate-100">
                        <div
                          className="h-1 rounded-full bg-indigo-400"
                          style={{ width: `${(page.pageviews / maxPv) * 100}%` }}
                        />
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <span className="block text-xs font-bold text-slate-700">{fmtNum(page.pageviews)}</span>
                      <span className="block text-[10px] text-slate-400">{fmtNum(page.users)} مستخدم</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Traffic sources */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4">
              <Globe className="h-4 w-4 text-slate-400" />
              <h3 className="text-sm font-bold text-slate-900">مصادر الزيارات</h3>
            </div>
            <div className="divide-y divide-slate-50">
              {data.sources.length === 0 && (
                <p className="px-5 py-4 text-sm text-slate-400">لا توجد بيانات</p>
              )}
              {data.sources.map((src, i) => {
                const total   = data.sources.reduce((a, s) => a + s.sessions, 0) || 1;
                const pct     = ((src.sessions / total) * 100).toFixed(1);
                const COLORS  = ["bg-indigo-500","bg-sky-500","bg-emerald-500","bg-amber-500","bg-rose-500","bg-violet-500","bg-pink-500","bg-teal-500"];
                const color   = COLORS[i % COLORS.length];
                return (
                  <div key={src.channel} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50">
                    <div className={`h-2.5 w-2.5 shrink-0 rounded-full ${color}`} />
                    <p className="flex-1 text-xs font-medium text-slate-700">
                      {CHANNEL_AR[src.channel] ?? src.channel}
                    </p>
                    <div className="w-28">
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-[10px] text-slate-400">{fmtNum(src.sessions)} جلسة</span>
                        <span className="text-[10px] font-bold text-slate-600">{pct}%</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-slate-100">
                        <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

      {/* GA4 link */}
      <div className="flex justify-end">
        <a
          href="https://analytics.google.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-indigo-600 transition-colors"
        >
          <BarChart2 className="h-3.5 w-3.5" />
          فتح Google Analytics
          <ArrowUpRight className="h-3 w-3" />
        </a>
      </div>

    </div>
  );
}
