import type { Metadata } from "next";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db";
import { SITE_NAME_AR, absoluteUrl } from "@/lib/seo";

export const revalidate = 300;

export const metadata: Metadata = {
  title: `حالة النظام | ${SITE_NAME_AR}`,
  description: "حالة النشر الآلي للتقارير، آخر تشغيل لكل مرحلة من مراحل pipeline المحتوى.",
  alternates: { canonical: absoluteUrl("/status") },
};

function fmtDate(d: Date | null | undefined): string {
  if (!d) return "—";
  return new Intl.DateTimeFormat("ar-SA", { dateStyle: "short", timeStyle: "short", timeZone: "UTC" }).format(new Date(d));
}

function minutesAgo(d: Date | null | undefined): number | null {
  if (!d) return null;
  return Math.floor((Date.now() - new Date(d).getTime()) / 60_000);
}

function freshness(mins: number | null): { label: string; color: string } {
  if (mins === null) return { label: "لم يعمل بعد", color: "var(--text-muted)" };
  if (mins < 180) return { label: "يعمل ✓", color: "#16a34a" };
  if (mins < 1440) return { label: "تأخر قليلاً", color: "#b45309" };
  return { label: "متوقف", color: "#be123c" };
}

const getData = unstable_cache(
  async () => {
  try {
    const [sourcesCount, lastSyncedSource, pendingNews, clusteredNews, pendingQueue, processedQueue, publishedToday, totalPublished, lastReview, pendingSocialPosts] = await Promise.all([
      prisma.source.count({ where: { enabled: true } }),
      prisma.source.findFirst({ where: { enabled: true, lastSyncedAt: { not: null } }, orderBy: { lastSyncedAt: "desc" }, select: { name: true, lastSyncedAt: true } }),
      prisma.newsItem.count({ where: { status: "pending" } }),
      prisma.newsItem.count({ where: { status: "clustered" } }),
      prisma.reviewQueue.count({ where: { status: "pending" } }),
      prisma.reviewQueue.count({ where: { status: "processed" } }),
      prisma.review.count({ where: { published: true, publishedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } } }),
      prisma.review.count({ where: { published: true } }),
      prisma.review.findFirst({ where: { published: true }, orderBy: { publishedAt: "desc" }, select: { titleAr: true, slug: true, publishedAt: true, authorSlug: true } }),
      prisma.socialPost.count({ where: { status: "pending" } }),
    ]);
    return { sourcesCount, lastSyncedSource, pendingNews, clusteredNews, pendingQueue, processedQueue, publishedToday, totalPublished, lastReview, pendingSocialPosts };
  } catch { return null; }
  },
  ["status-page"],
  { revalidate: 300 },
);

export default async function StatusPage() {
  const data = await getData();

  if (!data) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-20 text-center" dir="rtl">
        <p style={{ color: "var(--text-muted)" }}>تعذّر الاتصال بقاعدة البيانات.</p>
      </div>
    );
  }

  const syncMins = minutesAgo(data.lastSyncedSource?.lastSyncedAt);
  const syncStatus = freshness(syncMins);

  const stages = [
    { step: "01", name: "جلب الأخبار", schedule: "06:00 UTC يومياً", stat: `${data.sourcesCount} مصدر مفعّل`, detail: data.lastSyncedSource ? `آخر جلب: ${fmtDate(data.lastSyncedSource.lastSyncedAt)} — ${data.lastSyncedSource.name}` : "لم يُنفَّذ بعد", status: syncStatus, queue: `${data.pendingNews} خبر في الانتظار` },
    { step: "02", name: "تجميع الأخبار", schedule: "06:30 UTC يومياً", stat: `${data.clusteredNews} خبر مُجمَّع`, detail: `${data.pendingQueue} مجموعة تنتظر المعالجة`, status: { label: data.pendingQueue > 0 ? "في الطابور" : "لا يوجد طابور", color: data.pendingQueue > 0 ? "#b45309" : "#16a34a" }, queue: null },
    { step: "03", name: "كتابة التقارير", schedule: "07:00 UTC يومياً", stat: `${data.processedQueue} تقرير جاهز للنشر`, detail: data.lastReview ? `آخر تقرير: "${data.lastReview.titleAr.slice(0, 50)}…"` : "لم يُنفَّذ بعد", status: { label: data.processedQueue > 0 ? "جاهز للنشر" : "لا يوجد جاهز", color: data.processedQueue > 0 ? "var(--accent)" : "var(--text-muted)" }, queue: null },
    { step: "04", name: "النشر التلقائي", schedule: "09:00 UTC يومياً", stat: `${data.publishedToday} / 3 منشورة اليوم`, detail: data.lastReview ? `آخر نشر: ${fmtDate(data.lastReview.publishedAt)}` : "لم يُنشر شيء بعد", status: { label: data.publishedToday >= 3 ? "وصل الحد اليومي" : data.publishedToday > 0 ? "يعمل ✓" : "لم يعمل اليوم", color: data.publishedToday >= 3 ? "#b45309" : data.publishedToday > 0 ? "#16a34a" : "var(--text-muted)" }, queue: null },
    { step: "05", name: "السوشيال ميديا", schedule: "09:30 UTC يومياً", stat: `${data.pendingSocialPosts} منشور ينتظر الموافقة`, detail: "المنشورات تُرسَل بعد موافقة يدوية", status: { label: data.pendingSocialPosts > 0 ? "ينتظر المراجعة" : "لا يوجد معلّق", color: data.pendingSocialPosts > 0 ? "#b45309" : "var(--text-muted)" }, queue: null },
  ];

  return (
    <div dir="rtl">
      <section className="border-b py-20" style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-subtle)" }}>
        <div className="container mx-auto max-w-3xl px-4">
          <div className="mb-4 inline-flex items-center gap-2 rounded-[3px] border px-4 py-1.5 text-xs font-semibold"
            style={{ borderColor: "#bbf7d0", backgroundColor: "#f0fdf4", color: "#16a34a" }}>
            <span className="h-2 w-2 animate-pulse rounded-full" style={{ backgroundColor: "#16a34a" }} />
            النظام يعمل
          </div>
          <h1 className="mb-3 text-4xl font-bold md:text-5xl" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>حالة النظام</h1>
          <p style={{ color: "var(--text-secondary)" }}>
            مراحل pipeline النشر التلقائي — تحديث كل 5 دقائق من قاعدة البيانات.
          </p>
        </div>
      </section>

      <div className="container mx-auto max-w-3xl px-4 py-16 space-y-10">
        {/* Numbers */}
        <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: "إجمالي التقارير", value: data.totalPublished },
            { label: "نُشرت اليوم", value: data.publishedToday },
            { label: "تنتظر النشر", value: data.processedQueue },
            { label: "منشورات سوشيال", value: data.pendingSocialPosts },
          ].map((item) => (
            <div key={item.label} className="rounded-[6px] border p-4 text-center" style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-surface)" }}>
              <p className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>{item.value}</p>
              <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>{item.label}</p>
            </div>
          ))}
        </section>

        {/* Pipeline stages */}
        <section>
          <h2 className="mb-5 text-lg font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>مراحل الـ Pipeline</h2>
          <div className="space-y-3">
            {stages.map((stage) => (
              <div key={stage.step} className="flex flex-col gap-2 rounded-[6px] border p-5 sm:flex-row sm:items-center" style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-surface)" }}>
                <span className="w-8 shrink-0 text-2xl font-black" style={{ color: "var(--accent)", opacity: 0.4 }}>{stage.step}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="font-bold" style={{ color: "var(--text-primary)" }}>{stage.name}</span>
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>{stage.schedule}</span>
                  </div>
                  <p className="mt-0.5 text-xs truncate" style={{ color: "var(--text-muted)" }}>{stage.detail}</p>
                  {stage.queue && <p className="mt-0.5 text-xs" style={{ color: "var(--text-muted)" }}>{stage.queue}</p>}
                </div>
                <div className="text-left sm:text-right shrink-0">
                  <p className="text-sm font-semibold" style={{ color: stage.status.color }}>{stage.status.label}</p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>{stage.stat}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Last review */}
        {data.lastReview && (
          <section className="rounded-[6px] border p-5" style={{ borderColor: "var(--accent)", backgroundColor: "var(--accent-bg)" }}>
            <p className="mb-1 text-xs font-semibold" style={{ color: "var(--accent)" }}>آخر تقرير منشور</p>
            <a href={`/reviews/${data.lastReview.slug}`} className="block font-bold transition hover:opacity-75" style={{ color: "var(--text-primary)" }}>
              {data.lastReview.titleAr}
            </a>
            <div className="mt-2 flex items-center gap-3 text-xs" style={{ color: "var(--text-muted)" }}>
              <span>بقلم {data.lastReview.authorSlug === "zayd" ? "زيد" : "لينا"}</span>
              <span>·</span>
              <span>{fmtDate(data.lastReview.publishedAt)}</span>
            </div>
          </section>
        )}

        <p className="text-center text-xs" style={{ color: "var(--text-muted)" }}>
          جميع الأوقات بتوقيت UTC · تحديث كل 5 دقائق
        </p>
      </div>
    </div>
  );
}
