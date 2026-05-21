import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const reviews = await prisma.review.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      titleAr: true,
      slug: true,
      authorSlug: true,
      published: true,
      publishedAt: true,
      viewCount: true,
      category: { select: { nameAr: true, slug: true } },
      createdAt: true,
    },
  });

  return NextResponse.json(reviews);
}
