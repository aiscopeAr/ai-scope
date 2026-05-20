import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const categoryId = searchParams.get("categoryId") ?? "";
  const take = Math.min(24, parseInt(searchParams.get("take") ?? "12", 10));

  try {
    const articles = await prisma.article.findMany({
      where: {
        published: true,
        ...(categoryId ? { categoryId } : {}),
      },
      orderBy: { publishedAt: "desc" },
      take,
      select: {
        id: true,
        slug: true,
        titleAr: true,
        excerpt: true,
        imageUrl: true,
        publishedAt: true,
        sourceName: true,
        viewCount: true,
        category: { select: { id: true, nameAr: true, slug: true } },
      },
    });
    return NextResponse.json(articles);
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}
