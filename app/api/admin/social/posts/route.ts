import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  const posts = await prisma.socialPost.findMany({
    where: status ? { status } : undefined,
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      platform: true,
      caption: true,
      status: true,
      sentAt: true,
      errorMsg: true,
      createdAt: true,
      reviewId: true,
    },
  });

  // Attach review titles
  const reviewIds = [...new Set(posts.map((p) => p.reviewId))];
  const reviews = await prisma.review.findMany({
    where: { id: { in: reviewIds } },
    select: { id: true, titleAr: true, slug: true },
  });
  const reviewMap = Object.fromEntries(reviews.map((r) => [r.id, r]));

  return NextResponse.json(
    posts.map((p) => ({ ...p, review: reviewMap[p.reviewId] ?? null }))
  );
}
