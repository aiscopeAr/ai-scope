"use client";

import { useEffect, useState, useCallback } from "react";
import {
  RefreshCw, Play, Loader2, CheckCircle2, XCircle,
  AlertTriangle, Trash2, ChevronDown, ChevronUp, Zap,
} from "lucide-react";

interface PipelineStats {
  newsItems: { pending: number; skipped: number; clustered: number; total: number };
  queue: { pending: number; processing: number; processed: number; failed: number; rejected: number; approved: number };
  reviews: { published: number; todayPublished: number; dailyLimit: number };
}

interface SkippedItem {
  id: string;
  title: string;
  sourceName: string;
  sourceUrl: string;
  createdAt: string;
}

interface CronResult {
  ok: boolean;
  message?: string;
  error?: string;
  totalAdded?: number;
  clustersCreated?: number;
  processed?: number;
  rejected?: number;
  failed?: number;
  published?: number;
  results?: Array<{ name?: string; added?: number; skipped?: number; title?: string; status?: string; error?: string }>;
}

const CRON_STEPS = [
  {
    key: "fetch-news",
    label: "جلب الأخبار",
    desc: "يسحب آخر الأخبار من مصادر RSS",
    icon: "📥",
    color: "bg-sky-50 border-sky-200 text-sky-700",
    btnColor: "bg-sky-600 hover:bg-sky-700",
  },
  {
    key: "cluster-news",
    label: "تجميع المواضيع",
    desc: "يجمّع الأخبار المتشابهة في موضوع واحد",
    icon: "🧩",
    color: "bg-violet-50 border-violet-200 text-violet-700",
    btnColor: "bg-violet-600 hover:bg-violet-700",
  },
  {
    key: "process-review",
    label: "كتابة التقارير (AI)",
    desc: "يكتب تقارير عميقة باستخدام AI (حتى 3 في المرة)",
    icon: "✍️",
    color: "bg-amber-50 border-amber-200 text-amber-700",
    btnColor: "bg-amber-600 hover:bg-amber-700",
  },
  {
    key: "publish-review",
    label: "نشر التقارير",
    desc: "ينشر التقارير الجاهزة تلقائياً (حد 3/يوم)",
    icon: "🚀",
    color: "bg-emerald-50 border-emerald-200 text-emerald-700",
    btnColor: "bg-emerald-600 hover:bg-emerald-700",
  },
] as const;

export default function PipelinePage() {
  const [stats, setStats] = useState<PipelineStats | null>(null);
  const [skipped, setSkipped] = useState<SkippedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, CronResult>>({});
  const [showSkipped, setShowSkipped] = useState(false);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [deleteAllLoading, setDeleteAllLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/pipeline");
    const data = await res.json();
    setStats(data.stats);
    setSkipped(data.skipped ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function runCron(key: string) {
    setRunning(key);
    setResults((p) => ({ ...p, [key]: { ok: false, message: "جارٍ التشغيل..." } }));
    try {
      // proxy דרך admin API — ה-secret נשמר בצד השרת
      const res = await fetch("/api/admin/pipeline/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cronKey: key }),
      });
      const data: CronResult = await res.json();
      setResults((p) => ({ ...p, [key]: data }));
    } catch (err) {
      setResults((p) => ({ ...p, [key]: { ok: false, error: String(err) } }));
    } finally {
      setRunning(null);
      await load();
    }
  }

  async function deleteSkipped(id: string) {
    setDeletingIds((p) => new Set(p).add(id));
    await fetch(`/api/admin/pipeline/skipped/${id}`, { method: "DELETE" });
    setSkipped((p) => p.filter((s) => s.id !== id));
    setDeletingIds((p) => { const n = new Set(p); n.delete(id); return n; });
  }

  async function deleteAllSkipped() {
    if (!confirm(`حذف جميع الأخبار غير الرلوانطة (${skipped.length})؟`)) return;
    setDeleteAllLoading(true);
    await fetch("/api/admin/pipeline/skipped", { method: "DELETE" });
    setSkipped([]);
    setDeleteAllLoading(false);
  }

  const q = stats?.queue;
  const n = stats?.newsItems;

  return (
    <div className="p-6 space-y-6" dir="rtl">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50">
            <Zap className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">Pipeline التحرير</h1>
            <p className="text-xs text-slate-500">تشغيل يدوي ومتابعة حالة النظام</p>
          </div>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          تحديث
        </button>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "أخبار معلّقة",    value: n?.pending ?? 0,       color: "text-sky-600",     bg: "bg-sky-50",     note: `${n?.total ?? 0} إجمالي` },
            { label: "في الطابور",      value: (q?.pending ?? 0) + (q?.processed ?? 0), color: "text-violet-600", bg: "bg-violet-50", note: `${q?.processing ?? 0} قيد المعالجة` },
            { label: "فشل / مرفوض",     value: (q?.failed ?? 0) + (q?.rejected ?? 0),  color: "text-red-600",    bg: "bg-red-50",    note: `${q?.failed ?? 0} فشل · ${q?.rejected ?? 0} مرفوض` },
            { label: "نُشر اليوم",      value: stats.reviews.todayPublished,             color: "text-emerald-600",bg: "bg-emerald-50", note: `حد ${stats.reviews.dailyLimit}/يوم` },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs text-slate-500">{s.label}</p>
              <p className={`mt-1 text-3xl font-black ${s.color}`}>{s.value}</p>
              <p className="mt-0.5 text-[11px] text-slate-400">{s.note}</p>
            </div>
          ))}
        </div>
      )}

      {/* Pipeline flow */}
      <div className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">خطوات Pipeline</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {CRON_STEPS.map((step) => {
            const isRunning = running === step.key;
            const result = results[step.key];
            return (
              <div key={step.key} className={`rounded-xl border p-4 ${step.color}`}>
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{step.icon}</span>
                    <div>
                      <p className="font-bold text-sm">{step.label}</p>
                      <p className="text-xs opacity-70">{step.desc}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => runCron(step.key)}
                    disabled={running !== null}
                    className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold text-white transition disabled:opacity-40 ${step.btnColor}`}
                  >
                    {isRunning
                      ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> جارٍ...</>
                      : <><Play className="h-3.5 w-3.5" /> تشغيل</>
                    }
                  </button>
                </div>

                {/* Result */}
                {result && (
                  <div className={`rounded-lg border p-2.5 text-xs ${result.ok ? "bg-white/60 border-white/80" : "bg-red-50 border-red-200"}`}>
                    <div className="flex items-center gap-1.5 mb-1">
                      {result.ok
                        ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                        : <XCircle className="h-3.5 w-3.5 text-red-500" />
                      }
                      <span className="font-semibold">{result.ok ? "نجح" : "فشل"}</span>
                      {result.message && <span className="opacity-70">— {result.message}</span>}
                    </div>
                    {result.totalAdded !== undefined && <p>✅ أضاف: {result.totalAdded} خبر</p>}
                    {result.clustersCreated !== undefined && <p>🧩 مجموعات: {result.clustersCreated}</p>}
                    {result.processed !== undefined && <p>✍️ كُتب: {result.processed} · رُفض: {result.rejected} · فشل: {result.failed}</p>}
                    {result.published !== undefined && <p>🚀 نُشر: {result.published}</p>}
                    {result.error && <p className="text-red-600 mt-1">{result.error}</p>}
                    {/* Per-source breakdown for fetch-news */}
                    {result.results && result.results.length > 0 && step.key === "fetch-news" && (
                      <div className="mt-2 space-y-0.5 border-t pt-2 opacity-80">
                        {result.results.map((r, i) => (
                          <p key={i}>
                            {r.name}: +{r.added ?? 0} /{r.skipped ?? 0} تخطّى
                            {r.error && <span className="text-red-500"> ⚠ {r.error}</span>}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Queue status bar */}
      {q && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-bold text-slate-900">حالة الطابور</h2>
          <div className="space-y-2.5">
            {[
              { label: "معلّق",            value: q.pending,    color: "bg-amber-500",   track: "bg-amber-100"   },
              { label: "قيد المعالجة",     value: q.processing, color: "bg-sky-500",     track: "bg-sky-100"     },
              { label: "جاهز للمراجعة",    value: q.processed,  color: "bg-violet-500",  track: "bg-violet-100"  },
              { label: "تمت الموافقة",     value: q.approved,   color: "bg-emerald-500", track: "bg-emerald-100" },
              { label: "مرفوض",            value: q.rejected,   color: "bg-slate-400",   track: "bg-slate-100"   },
              { label: "فشل",              value: q.failed,     color: "bg-red-500",     track: "bg-red-100"     },
            ].map((row) => {
              const total = Object.values(q).reduce((a, b) => a + b, 0) || 1;
              return (
                <div key={row.label} className="flex items-center gap-3">
                  <p className="w-32 shrink-0 text-xs text-slate-500">{row.label}</p>
                  <div className={`flex-1 rounded-full h-2 ${row.track}`}>
                    <div className={`h-2 rounded-full transition-all ${row.color}`}
                      style={{ width: `${Math.min(100, (row.value / total) * 100)}%` }} />
                  </div>
                  <span className="w-6 shrink-0 text-right text-xs font-bold text-slate-700">{row.value}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Skipped / Junk news items */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <button
          onClick={() => setShowSkipped((v) => !v)}
          className="flex w-full items-center justify-between px-5 py-4 text-sm font-bold text-slate-900 hover:bg-slate-50 transition"
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            أخبار غير رلوانطة (زبالة)
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700">
              {skipped.length}
            </span>
          </div>
          {showSkipped ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
        </button>

        {showSkipped && (
          <>
            {skipped.length === 0 ? (
              <div className="flex items-center justify-center py-10 text-sm text-slate-400">
                لا يوجد أخبار زبالة 🎉
              </div>
            ) : (
              <>
                <div className="border-t border-slate-100 px-5 py-3 flex items-center justify-between">
                  <p className="text-xs text-slate-500">{skipped.length} عنصر</p>
                  <button
                    onClick={deleteAllSkipped}
                    disabled={deleteAllLoading}
                    className="flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-bold text-red-600 transition hover:bg-red-100 disabled:opacity-50"
                  >
                    {deleteAllLoading
                      ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      : <Trash2 className="h-3.5 w-3.5" />
                    }
                    حذف الكل
                  </button>
                </div>
                <div className="divide-y divide-slate-50 max-h-96 overflow-y-auto">
                  {skipped.map((item) => (
                    <div key={item.id} className="flex items-start gap-3 px-5 py-3 hover:bg-slate-50 transition">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-700 line-clamp-1">{item.title}</p>
                        <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-400">
                          <span>{item.sourceName}</span>
                          <span>·</span>
                          <span>{new Date(item.createdAt).toLocaleDateString("ar-EG")}</span>
                          <a
                            href={item.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-500 hover:underline"
                          >
                            رابط ↗
                          </a>
                        </div>
                      </div>
                      <button
                        onClick={() => deleteSkipped(item.id)}
                        disabled={deletingIds.has(item.id)}
                        className="shrink-0 rounded p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-500 disabled:opacity-40"
                      >
                        {deletingIds.has(item.id)
                          ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          : <Trash2 className="h-3.5 w-3.5" />
                        }
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>

    </div>
  );
}
