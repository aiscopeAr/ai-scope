/**
 * Quality Score — מדד איכות אוטומטי לכל כתבה
 *
 * 0.0 = זבל, 1.0 = מושלם
 *
 * מבוסס על:
 * - viewCount (משקל 40%) — כמה אנשים קראו
 * - avgReadTime (משקל 30%) — כמה זמן בילו
 * - scrollDepth (משקל 20%) — עד כמה גללו
 * - shareCount (משקל 10%) — כמה שיתפו
 *
 * מתעדכן אוטומטית כל פעם שיש views חדשים.
 */

import { prisma } from "@/lib/db";

const BENCHMARKS = {
  viewCount: { good: 200, excellent: 1000 },
  avgReadTime: { good: 120, excellent: 300 }, // שניות
  scrollDepth: { good: 0.5, excellent: 0.8 },
  shareCount: { good: 5, excellent: 20 },
};

function normalize(value: number, good: number, excellent: number): number {
  if (value <= 0) return 0;
  if (value >= excellent) return 1.0;
  if (value >= good) return 0.6 + ((value - good) / (excellent - good)) * 0.4;
  return (value / good) * 0.6;
}

export function calculateQualityScore(metrics: {
  viewCount: number;
  avgReadTime?: number | null;
  scrollDepth?: number | null;
  shareCount?: number | null;
}): number {
  const viewScore = normalize(metrics.viewCount, BENCHMARKS.viewCount.good, BENCHMARKS.viewCount.excellent);
  const readScore = metrics.avgReadTime
    ? normalize(metrics.avgReadTime, BENCHMARKS.avgReadTime.good, BENCHMARKS.avgReadTime.excellent)
    : 0.5; // אין נתון — נניח ממוצע
  const scrollScore = metrics.scrollDepth ?? 0.5;
  const shareScore = metrics.shareCount
    ? normalize(metrics.shareCount, BENCHMARKS.shareCount.good, BENCHMARKS.shareCount.excellent)
    : 0;

  return (
    viewScore * 0.4 +
    readScore * 0.3 +
    scrollScore * 0.2 +
    shareScore * 0.1
  );
}

/**
 * מעדכן את ה-qualityScore של כתבה לאחר שצברה views
 * נקרא מ-ViewTracker כשמגיע view חדש
 */
export async function updateReviewQuality(reviewId: string) {
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    select: { viewCount: true, metrics: true },
  });
  if (!review) return;

  const score = calculateQualityScore({
    viewCount: review.viewCount,
    avgReadTime: review.metrics?.avgReadTime,
    scrollDepth: review.metrics?.scrollDepth,
    shareCount: review.metrics?.shareCount,
  });

  await prisma.reviewMetrics.upsert({
    where: { reviewId },
    create: { reviewId, qualityScore: score },
    update: { qualityScore: score, updatedAt: new Date() },
  });

  // אם הציון גבוה — חזק את הזיכרון של הכותב
  if (score >= 0.7 && review.viewCount % 100 === 0) {
    const { extractMemoryFromReview } = await import("@/lib/author-memory");
    extractMemoryFromReview(reviewId).catch(() => {});
  }
}
