import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import OpenAI from "openai";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function verifyCronSecret(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Last 7 days
  const weekEnd = new Date();
  weekEnd.setUTCHours(0, 0, 0, 0);
  const weekStart = new Date(weekEnd.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Check if already generated this week
  const existing = await prisma.weeklyReport.findFirst({
    where: { weekStart: { gte: weekStart } },
  });
  if (existing) {
    return NextResponse.json({ ok: true, message: "Report already generated this week" });
  }

  // Gather data
  const [dailyStats, topArticles, topPrompts, totalViews, newSubscribers] = await Promise.all([
    prisma.dailyStats.findMany({
      where: { date: { gte: weekStart, lt: weekEnd } },
      orderBy: { date: "asc" },
    }),
    prisma.review.findMany({
      where: { published: true },
      orderBy: { viewCount: "desc" },
      take: 5,
      select: { slug: true, titleAr: true, viewCount: true, authorSlug: true, category: { select: { nameAr: true } } },
    }),
    prisma.prompt.findMany({
      where: { published: true },
      orderBy: { viewCount: "desc" },
      take: 5,
      select: { slug: true, titleAr: true, viewCount: true, category: true },
    }),
    prisma.review.aggregate({ _sum: { viewCount: true } }),
    prisma.newsletterSubscriber.count({
      where: { createdAt: { gte: weekStart }, status: "active" },
    }),
  ]);

  const weekStats = {
    totalPageViews: dailyStats.reduce((s, d) => s + d.pageViews, 0),
    articlesPublished: dailyStats.reduce((s, d) => s + d.articlesPublished, 0),
    promptsGenerated: dailyStats.reduce((s, d) => s + d.promptsGenerated, 0),
    allTimeViews: totalViews._sum.viewCount ?? 0,
    newSubscribers,
    avgDailyViews: dailyStats.length
      ? Math.round(dailyStats.reduce((s, d) => s + d.pageViews, 0) / dailyStats.length)
      : 0,
  };

  // AI analysis
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `أنت محلل بيانات متخصص في مواقع الذكاء الاصطناعي العربية.
مهمتك: تحليل بيانات أسبوع موقع "لوميك" وإنتاج تقرير باللغة العربية.
أعد JSON بهذا الشكل:
{
  "summary": "ملخص عام للأسبوع في 3-4 جمل",
  "insights": [
    {"title": "عنوان التوجه", "body": "شرح مختصر", "type": "win|warning|tip"},
    ...3-5 insights
  ]
}`,
      },
      {
        role: "user",
        content: `بيانات الأسبوع من ${weekStart.toLocaleDateString("ar-SA")} إلى ${weekEnd.toLocaleDateString("ar-SA")}:

إجمالي المشاهدات هذا الأسبوع: ${weekStats.totalPageViews}
متوسط المشاهدات اليومية: ${weekStats.avgDailyViews}
مقالات نُشرت: ${weekStats.articlesPublished}
برومبتس جديدة: ${weekStats.promptsGenerated}
مشتركون جدد في النشرة: ${weekStats.newSubscribers}
إجمالي المشاهدات الكلية: ${weekStats.allTimeViews}

أكثر 5 مقالات مشاهدة:
${topArticles.map((a, i) => `${i + 1}. "${a.titleAr}" — ${a.viewCount} مشاهدة`).join("\n")}

أكثر 5 برومبتس استخداماً:
${topPrompts.map((p, i) => `${i + 1}. "${p.titleAr}" — ${p.viewCount} مشاهدة`).join("\n")}

البيانات اليومية:
${dailyStats.map(d => `${new Date(d.date).toLocaleDateString("ar-SA")}: ${d.pageViews} مشاهدة، ${d.articlesPublished} مقال`).join("\n")}`,
      },
    ],
  });

  const aiData = JSON.parse(completion.choices[0].message.content!);

  const report = await prisma.weeklyReport.create({
    data: {
      weekStart,
      weekEnd,
      summary: aiData.summary,
      insights: aiData.insights,
      topContent: { articles: topArticles, prompts: topPrompts },
      stats: weekStats,
    },
  });

  // Send email
  const adminEmail = process.env.ADMIN_REPORT_EMAIL ?? "hanna.obead@gmail.com";
  await sendReportEmail(report, adminEmail);

  return NextResponse.json({ ok: true, reportId: report.id });
}

async function sendReportEmail(report: any, to: string) {
  const stats = report.stats as any;
  const insights = report.insights as any[];
  const topContent = report.topContent as any;

  const insightIcons: Record<string, string> = { win: "✅", warning: "⚠️", tip: "💡" };

  const html = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="utf-8"><style>
  body { font-family: Arial, sans-serif; background: #f8fafc; color: #1e293b; }
  .container { max-width: 600px; margin: 0 auto; padding: 24px; }
  .header { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 32px; border-radius: 16px; text-align: center; margin-bottom: 24px; }
  .card { background: white; border-radius: 12px; padding: 20px; margin-bottom: 16px; border: 1px solid #e2e8f0; }
  .stat { display: inline-block; text-align: center; padding: 12px 20px; background: #f1f5f9; border-radius: 8px; margin: 6px; }
  .stat-num { font-size: 28px; font-weight: 900; color: #6366f1; }
  .stat-label { font-size: 12px; color: #64748b; }
  .insight { padding: 12px 16px; border-right: 4px solid #6366f1; margin-bottom: 10px; background: #f8fafc; border-radius: 0 8px 8px 0; }
  .article { padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
</style></head>
<body>
<div class="container">
  <div class="header">
    <h1 style="margin:0;font-size:24px">📊 التقرير الأسبوعي</h1>
    <p style="margin:8px 0 0;opacity:0.9">${new Date(report.weekStart).toLocaleDateString("ar-SA")} — ${new Date(report.weekEnd).toLocaleDateString("ar-SA")}</p>
  </div>

  <div class="card">
    <h2 style="margin:0 0 16px;font-size:16px">ملخص الأسبوع</h2>
    <p style="line-height:1.8;color:#475569">${report.summary}</p>
  </div>

  <div class="card" style="text-align:center">
    <div class="stat"><div class="stat-num">${stats.totalPageViews?.toLocaleString("ar-SA")}</div><div class="stat-label">مشاهدات الأسبوع</div></div>
    <div class="stat"><div class="stat-num">${stats.articlesPublished}</div><div class="stat-label">مقالات نُشرت</div></div>
    <div class="stat"><div class="stat-num">${stats.promptsGenerated}</div><div class="stat-label">برومبتس جديدة</div></div>
    <div class="stat"><div class="stat-num">${stats.newSubscribers}</div><div class="stat-label">مشتركون جدد</div></div>
  </div>

  <div class="card">
    <h2 style="margin:0 0 16px;font-size:16px">التوجهات والتوصيات</h2>
    ${insights.map(i => `<div class="insight">${insightIcons[i.type] ?? "•"} <strong>${i.title}</strong><br><span style="font-size:13px;color:#64748b">${i.body}</span></div>`).join("")}
  </div>

  <div class="card">
    <h2 style="margin:0 0 12px;font-size:16px">🏆 أكثر المقالات مشاهدة</h2>
    ${topContent.articles?.slice(0, 5).map((a: any, i: number) => `<div class="article">${i + 1}. ${a.titleAr} <span style="float:left;color:#6366f1;font-weight:bold">${a.viewCount}</span></div>`).join("") ?? ""}
  </div>

  <p style="text-align:center;font-size:12px;color:#94a3b8;margin-top:24px">
    لوميك — نظام التقارير التلقائي<br>
    <a href="https://www.lumiq.news/admin/analytics" style="color:#6366f1">عرض لوحة الإحصاءات</a>
  </p>
</div>
</body>
</html>`;

  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "لوميك <reports@lumiq.news>",
        to,
        subject: `📊 التقرير الأسبوعي — ${new Date(report.weekStart).toLocaleDateString("ar-SA")}`,
        html,
      }),
    });
    await prisma.weeklyReport.update({ where: { id: report.id }, data: { sentAt: new Date() } });
  } catch (err) {
    console.error("[weekly-report] Email failed:", err);
  }
}
