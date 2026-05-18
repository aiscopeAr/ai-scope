import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getProvider } from "@/lib/social";
import type { SocialPlatform } from "@/lib/social";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function verifyCronSecret(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get approved pending posts
  const posts = await prisma.socialPost.findMany({
    where: { status: "approved" },
    include: { account: true },
    orderBy: { createdAt: "asc" },
    take: 10,
  });

  if (posts.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, failed: 0 });
  }

  const results: Array<{ id: string; status: "sent" | "failed"; error?: string }> = [];

  for (const post of posts) {
    const article = await prisma.article.findUnique({
      where: { id: post.articleId },
      select: { slug: true, imageUrl: true },
    });

    const articleUrl = article
      ? `https://ai-news-ar.vercel.app/news/${article.slug}`
      : "https://ai-news-ar.vercel.app";

    try {
      const credentials = JSON.parse(post.account.credentials) as Record<string, string>;
      const provider = getProvider(post.platform as SocialPlatform);

      await provider.send(
        {
          caption: post.caption,
          articleUrl,
          imageUrl: article?.imageUrl ?? undefined,
        },
        credentials
      );

      await prisma.socialPost.update({
        where: { id: post.id },
        data: { status: "sent", sentAt: new Date() },
      });

      results.push({ id: post.id, status: "sent" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      await prisma.socialPost.update({
        where: { id: post.id },
        data: { status: "failed", errorMsg: message },
      });
      results.push({ id: post.id, status: "failed", error: message });
    }
  }

  return NextResponse.json({
    ok: true,
    sent: results.filter((r) => r.status === "sent").length,
    failed: results.filter((r) => r.status === "failed").length,
    results,
  });
}
