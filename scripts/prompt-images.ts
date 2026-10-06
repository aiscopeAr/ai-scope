/**
 * scripts/prompt-images.ts
 *
 * Human review + manual-image workflow for image-category prompts (redesign).
 * Image prompts get a Replicate candidate during enrichment but stay
 * UNPUBLISHED until a human approves the hero image — a bad AI showcase image
 * hurts more than none. If the auto image is poor, generate one manually
 * (Gemini / ChatGPT, free) and upload it here. Keeps the whole flow ~free.
 *
 * Modes:
 *   --list                     list image prompts: published state + image URL + imagePrompt
 *   --unpublish-pending        set every enriched (quality:2) image prompt → published:false (one-time corrective)
 *   --slug X --approve         publish X as-is (keep current Replicate image)
 *   --slug X --upload <file|url> [--approve]   upload a manual image → exampleImageUrl, optionally publish
 *   --slug X --unpublish       keep X unpublished
 *
 * Usage: npx tsx scripts/prompt-images.ts <mode...>
 */

import { PrismaClient } from "@prisma/client";
import { v2 as cloudinary } from "cloudinary";
import { existsSync } from "node:fs";
import { uploadImageFromUrl } from "../lib/cloudinary";

process.loadEnvFile?.(".env");
const prisma = new PrismaClient();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const args = process.argv.slice(2);
const has = (f: string) => args.includes(f);
const val = (f: string) => {
  const i = args.indexOf(f);
  return i >= 0 ? args[i + 1] : undefined;
};

async function list() {
  const rows = await prisma.prompt.findMany({
    where: { category: "image", quality: { gte: 1 } },
    orderBy: { viewCount: "desc" },
    select: { slug: true, titleAr: true, published: true, featured: true, exampleImageUrl: true, imagePrompt: true },
  });
  for (const r of rows) {
    console.log(`\n[${r.published ? "PUBLISHED" : "draft    "}] ${r.slug}  —  ${r.titleAr}`);
    console.log(`  image : ${r.exampleImageUrl ?? "(none)"}`);
    console.log(`  prompt: ${r.imagePrompt ?? "(none)"}`);
  }
  console.log(`\n${rows.length} image prompts (quality>=1).`);
}

async function unpublishPending() {
  const res = await prisma.prompt.updateMany({
    where: { category: "image", quality: 2 },
    data: { published: false },
  });
  console.log(`Unpublished ${res.count} enriched image prompts (now pending image review).\n`);
  await list();
}

async function setOne() {
  const slug = val("--slug")!;
  const uploadArg = val("--upload");
  const p = await prisma.prompt.findFirst({ where: { slug }, select: { id: true } });
  if (!p) {
    console.log("NOT FOUND:", slug);
    return;
  }
  const data: { exampleImageUrl?: string; published?: boolean } = {};

  if (uploadArg) {
    let url: string | null = null;
    if (/^https?:\/\//.test(uploadArg)) {
      url = await uploadImageFromUrl(uploadArg, { reviewId: slug });
    } else if (existsSync(uploadArg)) {
      const up = await cloudinary.uploader.upload(uploadArg, { folder: "lumiq/prompts" });
      url = up.secure_url ?? null;
    } else {
      console.log("file not found:", uploadArg);
      return;
    }
    if (!url) {
      console.log("upload failed.");
      return;
    }
    data.exampleImageUrl = url;
    console.log("uploaded:", url);
  }

  if (has("--approve")) data.published = true;
  if (has("--unpublish")) data.published = false;

  if (Object.keys(data).length === 0) {
    console.log("nothing to do — pass --upload <file|url>, --approve, and/or --unpublish.");
    return;
  }
  await prisma.prompt.update({ where: { id: p.id }, data });
  console.log(`✓ ${slug} updated${data.exampleImageUrl ? " (+image)" : ""}${data.published !== undefined ? ` published=${data.published}` : ""}`);
}

async function main() {
  if (has("--unpublish-pending")) await unpublishPending();
  else if (val("--slug")) await setOne();
  else await list(); // default / --list
  await prisma.$disconnect();
  process.exit(0);
}

main();
