import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateArticleImage } from "@/lib/replicate";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function verify(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!verify(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Process up to 2 articles per call (each image ~15-20s, 2 = ~40s, under 60s limit)
  const articles = await prisma.article.findMany({
    where: {
      published: true,
      OR: [
        { imageUrl: null },
        // Non-Replicate images (from RSS sources — old articles)
        {
          AND: [
            { imageUrl: { not: { contains: "replicate.delivery" } } },
            { imageUrl: { not: { contains: "pbxt.replicate.delivery" } } },
          ],
        },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 2,
    select: { id: true, title: true, titleAr: true, tags: true, imageUrl: true },
  });

  if (articles.length === 0) {
    return NextResponse.json({ ok: true, message: "All articles have Replicate images", updated: 0 });
  }

  const results: Array<{ id: string; ok: boolean; url?: string; error?: string }> = [];

  for (const article of articles) {
    const prompt = `${article.title}, artificial intelligence technology concept, futuristic digital illustration`;
    try {
      const imageUrl = await generateArticleImage(prompt);
      if (imageUrl) {
        await prisma.article.update({ where: { id: article.id }, data: { imageUrl } });
        results.push({ id: article.id, ok: true, url: imageUrl });
      } else {
        results.push({ id: article.id, ok: false, error: "No URL returned from Replicate" });
      }
    } catch (e) {
      results.push({ id: article.id, ok: false, error: e instanceof Error ? e.message : "Unknown error" });
    }
  }

  const remaining = await prisma.article.count({
    where: {
      published: true,
      OR: [
        { imageUrl: null },
        {
          AND: [
            { imageUrl: { not: { contains: "replicate.delivery" } } },
            { imageUrl: { not: { contains: "pbxt.replicate.delivery" } } },
          ],
        },
      ],
    },
  });

  return NextResponse.json({
    ok: true,
    processed: results.length,
    updated: results.filter((r) => r.ok).length,
    failed: results.filter((r) => !r.ok).length,
    remainingAfter: remaining,
    results,
  });
}
