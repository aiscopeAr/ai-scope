import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

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
  ]);

  return NextResponse.json({
    stats: {
      newsItems: { pending: newsPending, skipped: newsSkipped, clustered: newsClustered, total: newsTotal },
      queue: { pending: qPending, processing: qProcessing, processed: qProcessed, approved: qApproved, rejected: qRejected, failed: qFailed },
      reviews: { published: reviewsPublished, todayPublished, dailyLimit: 3 },
    },
    skipped: skippedItems,
  });
}
