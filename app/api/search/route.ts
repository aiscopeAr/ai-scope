import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim();
  const tag = (searchParams.get("tag") ?? "").trim();
  const source = (searchParams.get("source") ?? "").trim();
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const limit = Math.min(30, Math.max(1, Number(searchParams.get("limit") ?? "12")));

  if (!q && !tag && !source) {
    return NextResponse.json({ articles: [], total: 0, page, limit });
  }

  const where = {
    published: true,
    AND: [
      q
        ? {
            OR: [
              { titleAr: { contains: q, mode: "insensitive" as const } },
              { title: { contains: q, mode: "insensitive" as const } },
              { contentAr: { contains: q, mode: "insensitive" as const } },
              { excerpt: { contains: q, mode: "insensitive" as const } },
            ],
          }
        : {},
      tag ? { tags: { has: tag } } : {},
      source ? { sourceName: { contains: source, mode: "insensitive" as const } } : {},
    ],
  };

  const [articles, total] = await Promise.all([
    prisma.article.findMany({
      where,
      select: {
        id: true,
        slug: true,
        titleAr: true,
        title: true,
        excerpt: true,
        imageUrl: true,
        sourceName: true,
        publishedAt: true,
        tags: true,
        category: { select: { nameAr: true, slug: true } },
      },
      orderBy: { publishedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.article.count({ where }),
  ]);

  return NextResponse.json({ articles, total, page, limit });
}
