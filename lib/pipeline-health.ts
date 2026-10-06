/**
 * lib/pipeline-health.ts
 *
 * Pure evaluator for the content-pipeline health monitor. The pipeline
 * (fetch-news → cluster-news → process-review → publish-review) once stopped
 * silently for ~2 days with no alert. This turns a few raw signals (last
 * publish time, last fetch time, stuck/failed queue counts) into a health
 * report; the cron route gathers the signals from Prisma and emails an alert
 * only when something is wrong. Pure + side-effect free so it is easy to test.
 */

export type Severity = "ok" | "warn" | "critical";

export interface HealthCheck {
  id: string;
  labelAr: string;
  severity: Severity;
  detailAr: string;
}

export interface PipelineSignals {
  now: Date;
  /** Max publishedAt among published reviews, or null if none ever. */
  lastPublishAt: Date | null;
  /** Max SourceRun.createdAt (last time news was fetched), or null. */
  lastFetchAt: Date | null;
  /** ReviewQueue items pending/processing that have not moved for a while. */
  stuckQueueCount: number;
  /** ReviewQueue items that failed within the recent window. */
  failedQueueCountRecent: number;
  /** Reviews published in the last 48h (informational). */
  publishedLast48h: number;
}

export interface Thresholds {
  maxHoursSincePublish: number;
  maxHoursSinceFetch: number;
}

export const DEFAULT_THRESHOLDS: Thresholds = {
  // publish-review runs daily at 09:00 UTC; allow ~1.5 missed days before alarm.
  maxHoursSincePublish: 36,
  // fetch-news runs daily at 06:00 UTC; ~1.25 days.
  maxHoursSinceFetch: 30,
};

export interface HealthReport {
  healthy: boolean;
  worst: Severity;
  checks: HealthCheck[];
}

const SEVERITY_RANK: Record<Severity, number> = { ok: 0, warn: 1, critical: 2 };

function hoursBetween(a: Date, b: Date): number {
  return Math.abs(a.getTime() - b.getTime()) / 3_600_000;
}

function fmtHours(h: number): string {
  return h >= 24 ? `${Math.floor(h / 24)} يوم و${Math.round(h % 24)} ساعة` : `${Math.round(h)} ساعة`;
}

export function evaluatePipelineHealth(
  signals: PipelineSignals,
  thresholds: Thresholds = DEFAULT_THRESHOLDS,
): HealthReport {
  const checks: HealthCheck[] = [];

  // 1) Last article published.
  if (!signals.lastPublishAt) {
    checks.push({ id: "publish", labelAr: "نشر المقالات", severity: "critical", detailAr: "لم يُنشر أي مقال بعد." });
  } else {
    const h = hoursBetween(signals.now, signals.lastPublishAt);
    checks.push(
      h > thresholds.maxHoursSincePublish
        ? { id: "publish", labelAr: "نشر المقالات", severity: "critical", detailAr: `آخر مقال نُشر منذ ${fmtHours(h)} (الحد ${thresholds.maxHoursSincePublish} ساعة).` }
        : { id: "publish", labelAr: "نشر المقالات", severity: "ok", detailAr: `آخر نشر منذ ${fmtHours(h)}.` },
    );
  }

  // 2) Last news fetch (upstream).
  if (!signals.lastFetchAt) {
    checks.push({ id: "fetch", labelAr: "جلب الأخبار", severity: "critical", detailAr: "لا توجد عمليات جلب أخبار مسجّلة." });
  } else {
    const h = hoursBetween(signals.now, signals.lastFetchAt);
    checks.push(
      h > thresholds.maxHoursSinceFetch
        ? { id: "fetch", labelAr: "جلب الأخبار", severity: "critical", detailAr: `آخر جلب أخبار منذ ${fmtHours(h)} (الحد ${thresholds.maxHoursSinceFetch} ساعة).` }
        : { id: "fetch", labelAr: "جلب الأخبار", severity: "ok", detailAr: `آخر جلب منذ ${fmtHours(h)}.` },
    );
  }

  // 3) Stuck queue items.
  checks.push(
    signals.stuckQueueCount > 0
      ? { id: "stuck", labelAr: "عناصر عالقة", severity: "warn", detailAr: `${signals.stuckQueueCount} عنصرًا عالقًا في قائمة المراجعة دون تقدّم.` }
      : { id: "stuck", labelAr: "عناصر عالقة", severity: "ok", detailAr: "لا عناصر عالقة." },
  );

  // 4) Recent failures.
  checks.push(
    signals.failedQueueCountRecent > 0
      ? { id: "failed", labelAr: "حالات فشل حديثة", severity: "warn", detailAr: `${signals.failedQueueCountRecent} حالة فشل خلال آخر 48 ساعة.` }
      : { id: "failed", labelAr: "حالات فشل حديثة", severity: "ok", detailAr: "لا فشل حديث." },
  );

  const worst = checks.reduce<Severity>((acc, c) => (SEVERITY_RANK[c.severity] > SEVERITY_RANK[acc] ? c.severity : acc), "ok");
  return { healthy: worst === "ok", worst, checks };
}
