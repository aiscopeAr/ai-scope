/**
 * scripts/add-curated-prompt.ts
 *
 * Add a hand-curated, high-quality prompt to the library from a data module
 * (scripts/curated-prompts/<name>.ts, default-exporting a CuratedPrompt). This
 * is the manual path for excellent prompts you provide; the auto-generator
 * stays off.
 *
 * Image prompts are created as drafts (published:false) — approve the hero
 * image afterwards via scripts/prompt-images.ts (upload the real reference
 * image, then --approve). Text prompts publish immediately.
 *
 * Usage:
 *   npx tsx scripts/add-curated-prompt.ts --file scripts/curated-prompts/family-portrait.ts --dry-run
 *   npx tsx scripts/add-curated-prompt.ts --file scripts/curated-prompts/family-portrait.ts
 *   npx tsx scripts/add-curated-prompt.ts --file ... --gen-image   # also auto-generate a Replicate example
 */

import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import { PrismaClient } from "@prisma/client";
import { generateReviewImage } from "../lib/images";

process.loadEnvFile?.(".env");
const prisma = new PrismaClient();

export interface CuratedPrompt {
  slug: string;
  title: string;
  titleAr: string;
  category: "image" | "writing" | "code" | "marketing";
  modelHint?: string;
  description?: string;
  body: string;
  bodyAr?: string;
  variations?: { label: string; text: string }[];
  tips?: string[];
  useCases?: string[];
  imagePrompt?: string;
}

const args = process.argv.slice(2);
const has = (f: string) => args.includes(f);
const val = (f: string) => {
  const i = args.indexOf(f);
  return i >= 0 ? args[i + 1] : undefined;
};
const DRY = has("--dry-run");

async function main() {
  const file = val("--file");
  if (!file) {
    console.log("pass --file scripts/curated-prompts/<name>.ts");
    return;
  }
  const mod = await import(pathToFileURL(resolve(file)).href);
  const p: CuratedPrompt = mod.default;
  if (!p?.slug || !p.title || !p.titleAr || !p.body || !p.category) {
    console.log("invalid curated prompt (need slug, title, titleAr, body, category).");
    return;
  }

  const existing = await prisma.prompt.findUnique({ where: { slug: p.slug }, select: { id: true } });
  if (existing) {
    console.log(`SLUG EXISTS: ${p.slug} — aborting (no duplicate).`);
    return;
  }

  const willPublish = p.category !== "image"; // image prompts stay draft for hero-image review

  console.log(`ADD: ${p.slug} [${p.category}]  title=${p.titleAr}`);
  console.log(`  variations=${p.variations?.length ?? 0} tips=${p.tips?.length ?? 0} useCases=${p.useCases?.length ?? 0}`);
  console.log(`  published=${willPublish}${p.category === "image" ? " (draft — approve image via prompt-images.ts)" : ""}`);

  if (DRY) {
    console.log("\nDRY RUN — no write. bodyAr preview:\n" + (p.bodyAr ?? p.body).slice(0, 220) + "…");
    return;
  }

  let exampleImageUrl: string | null = null;
  if (has("--gen-image") && p.imagePrompt && p.category === "image") {
    exampleImageUrl = await generateReviewImage(p.imagePrompt, { reviewId: p.slug });
    if (exampleImageUrl) console.log("generated image:", exampleImageUrl);
  }

  await prisma.prompt.create({
    data: {
      slug: p.slug,
      title: p.title,
      titleAr: p.titleAr,
      body: p.body,
      bodyAr: p.bodyAr ?? null,
      description: p.description ?? null,
      category: p.category,
      modelHint: p.modelHint ?? null,
      variations: p.variations?.length ? p.variations : undefined,
      tips: p.tips ?? [],
      useCases: p.useCases ?? [],
      imagePrompt: p.imagePrompt ?? null,
      exampleImageUrl,
      tags: [],
      featured: true,
      quality: 2,
      published: willPublish,
    },
  });

  console.log(`\n✓ created ${p.slug}.`);
  if (p.category === "image") {
    console.log(`Next: upload the real example image + publish:`);
    console.log(`  npx tsx scripts/prompt-images.ts --slug ${p.slug} --upload <file-or-url> --approve`);
  }
  await prisma.$disconnect();
  process.exit(0);
}

main();
