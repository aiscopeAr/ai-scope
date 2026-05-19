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

function needsNewImage(imageUrl: string | null): boolean {
  if (!imageUrl) return true;
  // Keep only Cloudinary images — regenerate everything else
  return !imageUrl.includes("res.cloudinary.com");
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const debugOnly = searchParams.get("debug") === "1";

  // Debug mode is public — just shows env/count status, no writes
  if (!debugOnly && !verify(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Find articles that don't have a permanent Cloudinary image yet
  const allArticles = await prisma.article.findMany({
    where: { published: true },
    select: { id: true, title: true, titleAr: true, imageUrl: true },
    orderBy: { createdAt: "desc" },
  });

  const needsImage = allArticles.filter((a) => needsNewImage(a.imageUrl));

  if (debugOnly) {
    // Test: generate a fresh image with Replicate and upload to Cloudinary
    let cloudinaryTest: string | null = null;
    let cloudinaryError: string | null = null;
    try {
      const { generateArticleImage } = await import("@/lib/replicate");
      cloudinaryTest = await generateArticleImage("artificial intelligence technology test");
    } catch (e) {
      cloudinaryError = e instanceof Error ? e.message : JSON.stringify(e);
    }

    return NextResponse.json({
      total: allArticles.length,
      needsImage: needsImage.length,
      cloudinaryOk: allArticles.length - needsImage.length,
      cloudinaryEnvSet: !!process.env.CLOUDINARY_CLOUD_NAME,
      replicateEnvSet: !!process.env.REPLICATE_API_TOKEN,
      cloudinaryTest,
      cloudinaryError,
      sample: needsImage.slice(0, 3).map((a) => ({ id: a.id, imageUrl: a.imageUrl })),
    });
  }

  const toProcess = needsImage.slice(0, 2);

  if (toProcess.length === 0) {
    return NextResponse.json({
      ok: true,
      message: "All articles already have Cloudinary images",
      updated: 0,
      remaining: 0,
    });
  }

  const results: Array<{ id: string; ok: boolean; url?: string; error?: string }> = [];

  for (const article of toProcess) {
    const prompt = `${article.title}, artificial intelligence technology news, futuristic digital concept`;
    try {
      const imageUrl = await generateArticleImage(prompt);
      if (imageUrl) {
        await prisma.article.update({ where: { id: article.id }, data: { imageUrl } });
        results.push({ id: article.id, ok: true, url: imageUrl });
      } else {
        results.push({ id: article.id, ok: false, error: "generateArticleImage returned null" });
      }
    } catch (e) {
      results.push({ id: article.id, ok: false, error: e instanceof Error ? e.message : String(e) });
    }
  }

  const remaining = needsImage.length - toProcess.length;

  return NextResponse.json({
    ok: true,
    processed: results.length,
    updated: results.filter((r) => r.ok).length,
    failed: results.filter((r) => !r.ok).length,
    remaining,
    results,
  });
}
