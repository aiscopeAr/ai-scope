import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { getAllPipelineSettings, setSetting, SETTING_KEYS } from "@/lib/settings";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [
    newsPending, newsSkipped, newsClustered, newsTotal,
    qPending, qProcessing, qProcessed, qApproved, qRejected, qFailed,
    reviewsPublished, todayPublished,
    skippedItems,
    settings,
  ] = await Promise.all([
    prisma.newsItem.count({ where: { status: "pending" } }),
    prisma.newsItem.count({ where: { status: "skipped" } }),
    prisma.newsItem.count({ where: { status: "clustered" } }),
    prisma.newsItem.count(),
    prisma.reviewQueue.count({ where: { status: "pending" } }),
    prisma.reviewQueue.count({ where: { status: "processing" } }),
    prisma.reviewQueue.count({ where: { status: "processed" } }),
    prisma.reviewQueue.count({ where: { status: "approved" } }),
    prisma.reviewQueue.count({ where: { status: "rejected" } }),
    prisma.reviewQueue.count({ where: { status: "failed" } }),
    prisma.review.count({ where: { published: true } }),
    prisma.review.count({ where: { published: true, publishedAt: { gte: todayStart } } }),
    prisma.newsItem.findMany({
      where: { status: "skipped" },
      orderBy: { createdAt: "desc" },
      take: 200,
      select: { id: true, title: true, sourceName: true, sourceUrl: true, createdAt: true },
    }),
    getAllPipelineSettings(),
  ]);

  return NextResponse.json({
    stats: {
      newsItems: { pending: newsPending, skipped: newsSkipped, clustered: newsClustered, total: newsTotal },
      queue: { pending: qPending, processing: qProcessing, processed: qProcessed, approved: qApproved, rejected: qRejected, failed: qFailed },
      reviews: { published: reviewsPublished, todayPublished, dailyLimit: settings.dailyPublishLimit },
    },
    settings,
    skipped: skippedItems,
  });
}

// PATCH — update pipeline settings
export async function PATCH(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as { dailyPublishLimit?: number; maxPerRun?: number };

  if (body.dailyPublishLimit !== undefined) {
    const val = Math.max(1, Math.min(50, Number(body.dailyPublishLimit)));
    await setSetting(SETTING_KEYS.DAILY_PUBLISH_LIMIT, val);
  }
  if (body.maxPerRun !== undefined) {
    const val = Math.max(1, Math.min(20, Number(body.maxPerRun)));
    await setSetting(SETTING_KEYS.MAX_PER_RUN, val);
  }

  return NextResponse.json({ ok: true });
}
