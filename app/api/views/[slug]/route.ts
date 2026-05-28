import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { updateReviewQuality } from "@/lib/quality-score";

export const dynamic = "force-dynamic";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  try {
    const review = await prisma.review.update({
      where: { slug },
      data: { viewCount: { increment: 1 } },
      select: { id: true, viewCount: true },
    });

    // עדכן quality score כל 10 views (לא בכל view כדי לא להעמיס)
    if (review.viewCount % 10 === 0) {
      updateReviewQuality(review.id).catch(() => {});
    }
  } catch {
    // article not found — ignore silently
  }

  return NextResponse.json({ ok: true });
}
