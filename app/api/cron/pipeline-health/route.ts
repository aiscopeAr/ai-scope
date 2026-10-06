import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { evaluatePipelineHealth, type HealthReport, type Severity } from "@/lib/pipeline-health";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function verifyCronSecret(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

const STUCK_HOURS = 24;
const RECENT_FAIL_HOURS = 48;

export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const stuckBefore = new Date(now.getTime() - STUCK_HOURS * 3_600_000);
  const failAfter = new Date(now.getTime() - RECENT_FAIL_HOURS * 3_600_000);

  const [lastPublish, lastFetch, stuckQueueCount, failedQueueCountRecent, publishedLast48h] = await Promise.all([
    prisma.review.findFirst({
      where: { published: true, publishedAt: { not: null } },
      orderBy: { publishedAt: "desc" },
      select: { publishedAt: true },
    }),
    prisma.sourceRun.findFirst({ orderBy: { createdAt: "desc" }, select: { createdAt: true } }),
    prisma.reviewQueue.count({ where: { status: { in: ["pending", "processing"] }, updatedAt: { lt: stuckBefore } } }),
    prisma.reviewQueue.count({ where: { status: "failed", updatedAt: { gt: failAfter } } }),
    prisma.review.count({ where: { published: true, publishedAt: { gt: failAfter } } }),
  ]);

  const report = evaluatePipelineHealth({
    now,
    lastPublishAt: lastPublish?.publishedAt ?? null,
    lastFetchAt: lastFetch?.createdAt ?? null,
    stuckQueueCount,
    failedQueueCountRecent,
    publishedLast48h,
  });

  let emailed = false;
  if (!report.healthy) {
    emailed = await sendAlertEmail(report, now);
  }

  return NextResponse.json({
    ok: true,
    healthy: report.healthy,
    worst: report.worst,
    emailed,
    checks: report.checks,
  });
}

const SEVERITY_ICON: Record<Severity, string> = { ok: "✅", warn: "⚠️", critical: "🔴" };

async function sendAlertEmail(report: HealthReport, now: Date): Promise<boolean> {
  const to = process.env.ADMIN_EMAIL ?? process.env.ADMIN_REPORT_EMAIL ?? "hanna.obead@gmail.com";
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("[pipeline-health] RESEND_API_KEY missing; cannot send alert.");
    return false;
  }

  const rows = report.checks
    .map(
      (c) =>
        `<tr><td style="padding:8px 12px;font-size:20px">${SEVERITY_ICON[c.severity]}</td><td style="padding:8px 12px"><strong>${c.labelAr}</strong><br><span style="font-size:13px;color:#64748b">${c.detailAr}</span></td></tr>`,
    )
    .join("");

  const title = report.worst === "critical" ? "🔴 توقّف محتمل في خط النشر" : "⚠️ تنبيه بشأن خط النشر";
  const html = `<!DOCTYPE html>
<html dir="rtl" lang="ar"><head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;background:#f8fafc;color:#1e293b">
  <div style="max-width:600px;margin:0 auto;padding:24px">
    <div style="background:${report.worst === "critical" ? "#dc2626" : "#d97706"};color:#fff;padding:24px;border-radius:12px;text-align:center">
      <h1 style="margin:0;font-size:20px">${title}</h1>
      <p style="margin:8px 0 0;opacity:.9">${now.toLocaleString("ar-SA")}</p>
    </div>
    <div style="background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:12px;margin-top:16px">
      <table style="width:100%;border-collapse:collapse">${rows}</table>
    </div>
    <p style="text-align:center;font-size:12px;color:#94a3b8;margin-top:20px">
      لوميك — مراقبة خط النشر التلقائية<br>
      <a href="https://www.lumiq.news/admin/analytics" style="color:#6366f1">لوحة التحكم</a>
    </p>
  </div>
</body></html>`;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: "لوميك <reports@lumiq.news>", to, subject: title, html }),
    });
    if (!res.ok) {
      console.error("[pipeline-health] Resend returned", res.status);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[pipeline-health] Email failed:", err);
    return false;
  }
}
