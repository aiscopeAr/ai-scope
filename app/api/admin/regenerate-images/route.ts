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
    // Test each step separately to find where it fails
    let replicateUrl: string | null = null;
    let cloudinaryTest: string | null = null;
    let cloudinaryError: string | null = null;
    let replicateError: string | null = null;

    // Step 1: Replicate
    try {
      const Replicate = (await import("replicate")).default;
      const client = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });
      const output = await client.run("black-forest-labs/flux-schnell", {
        input: { prompt: "AI technology test", num_outputs: 1, aspect_ratio: "16:9", output_format: "webp", go_fast: true },
      }) as unknown[];
      const first = output?.[0];
      if (typeof first === "string") replicateUrl = first;
      else if (first instanceof URL) replicateUrl = first.toString();
      else if (first && typeof (first as {url?:()=>unknown}).url === "function") {
        const u = (first as {url:()=>unknown}).url();
        replicateUrl = u instanceof URL ? u.toString() : String(u);
      } else if (first) replicateUrl = String(first);
    } catch (e) {
      replicateError = e instanceof Error ? e.message : JSON.stringify(e);
    }

    // Step 2: Cloudinary
    if (replicateUrl) {
      try {
        const { v2: cld } = await import("cloudinary");
        cld.config({ cloud_name: process.env.CLOUDINARY_CLOUD_NAME, api_key: process.env.CLOUDINARY_API_KEY, api_secret: process.env.CLOUDINARY_API_SECRET, secure: true });
        const result = await cld.uploader.upload(replicateUrl, { folder: "aiscope/test", format: "webp" });
        cloudinaryTest = result.secure_url;
      } catch (e) {
        cloudinaryError = e instanceof Error ? e.message : JSON.stringify(e);
      }
    }

    return NextResponse.json({
      total: allArticles.length,
      needsImage: needsImage.length,
      cloudinaryOk: allArticles.length - needsImage.length,
      cloudinaryEnvSet: !!process.env.CLOUDINARY_CLOUD_NAME,
      replicateEnvSet: !!process.env.REPLICATE_API_TOKEN,
      replicateUrl,
      replicateError,
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
