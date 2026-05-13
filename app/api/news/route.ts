import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const limit = Number.parseInt(searchParams.get("limit") || "10", 10);

  const articles = await prisma.article.findMany({
    where: {
      published: true,
      ...(category ? { category: { slug: category } } : {}),
    },
    orderBy: { publishedAt: "desc" },
    take: limit,
    include: { category: true },
  });

  return NextResponse.json(articles);
}

export async function POST(request: Request) {
  const data = await request.json();

  const article = await prisma.article.create({
    data: {
      ...data,
      slug: data.titleAr.toLowerCase().replace(/\s+/g, "-"),
    },
    include: { category: true },
  });

  return NextResponse.json(article);
}
