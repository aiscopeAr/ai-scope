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
      articleId: true,
    },
  });

  // Attach article titles
  const articleIds = [...new Set(posts.map((p) => p.articleId))];
  const articles = await prisma.article.findMany({
    where: { id: { in: articleIds } },
    select: { id: true, titleAr: true, slug: true },
  });
  const articleMap = Object.fromEntries(articles.map((a) => [a.id, a]));

  return NextResponse.json(
    posts.map((p) => ({ ...p, article: articleMap[p.articleId] ?? null }))
  );
}
