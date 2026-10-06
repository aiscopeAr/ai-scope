/**
 * scripts/prune-remap-prompts.ts
 *
 * Prompts-library redesign P4:
 *  --prune   : unpublish thin, low-value prompts (viewCount < threshold, not
 *              featured) → published:false. Drops them from the hub + sitemap
 *              without deleting (recoverable). Default threshold 5 (i.e. ≤4 views).
 *  --remap   : re-classify the overgrown "general" category (268) into the real
 *              categories (image/writing/code/marketing) via gpt-4o-mini, so
 *              "general" is retired. Only touches still-published generals.
 *
 * Both support --dry-run (no writes; prints what WOULD change).
 *
 * Usage:
 *   npx tsx scripts/prune-remap-prompts.ts --prune --dry-run
 *   npx tsx scripts/prune-remap-prompts.ts --prune            [--threshold 5]
 *   npx tsx scripts/prune-remap-prompts.ts --remap --dry-run
 *   npx tsx scripts/prune-remap-prompts.ts --remap
 */

import { PrismaClient } from "@prisma/client";
import OpenAI from "openai";

process.loadEnvFile?.(".env");
const prisma = new PrismaClient();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const args = process.argv.slice(2);
const has = (f: string) => args.includes(f);
const val = (f: string) => {
  const i = args.indexOf(f);
  return i >= 0 ? args[i + 1] : undefined;
};
const DRY = has("--dry-run");

const REAL_CATEGORIES = ["image", "writing", "code", "marketing"] as const;
type RealCategory = (typeof REAL_CATEGORIES)[number];

async function prune() {
  const threshold = Number.parseInt(val("--threshold") ?? "5", 10) || 5;
  const where = { published: true, featured: false, viewCount: { lt: threshold } };
  const victims = await prisma.prompt.findMany({
    where,
    orderBy: { viewCount: "asc" },
    select: { slug: true, viewCount: true, category: true },
  });

  console.log(`PRUNE: ${victims.length} prompts with viewCount < ${threshold} and not featured.`);
  const byCat: Record<string, number> = {};
  for (const v of victims) byCat[v.category] = (byCat[v.category] ?? 0) + 1;
  console.log("by category:", JSON.stringify(byCat));
  console.log("sample:", victims.slice(0, 15).map((v) => `${v.slug}(${v.viewCount})`).join(", "));

  if (DRY) {
    console.log("\nDRY RUN — no changes. Re-run without --dry-run to unpublish these.");
    return;
  }
  const res = await prisma.prompt.updateMany({ where, data: { published: false } });
  console.log(`\n✓ unpublished ${res.count} prompts (published:false). Recoverable.`);
}

async function classify(p: { titleAr: string; title: string; body: string; tags: string[] }): Promise<RealCategory> {
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `صنّف البرومبت في فئة واحدة بالضبط من: image, writing, code, marketing.
- image: توليد الصور/التصميم المرئي.
- code: البرمجة/التطوير/قواعد البيانات.
- marketing: التسويق/السوشال ميديا/المبيعات/الأعمال/SEO.
- writing: الكتابة/المحتوى/البحث/كل ما تبقّى.
أعد JSON: {"category":"image|writing|code|marketing"}`,
      },
      { role: "user", content: `العنوان: ${p.titleAr} / ${p.title}\nالوسوم: ${p.tags.join(", ")}\nالبرومبت:\n${p.body.slice(0, 600)}` },
    ],
  });
  const raw = completion.choices[0]?.message.content;
  try {
    const c = JSON.parse(raw ?? "{}").category;
    return (REAL_CATEGORIES as readonly string[]).includes(c) ? (c as RealCategory) : "writing";
  } catch {
    return "writing";
  }
}

async function remap() {
  const all = await prisma.prompt.findMany({
    where: { category: "general", published: true },
    select: { id: true, slug: true, titleAr: true, title: true, body: true, tags: true },
  });
  // Dry-run previews a cheap sample (default 30) unless --limit given; a real
  // run classifies all of them.
  const limit = val("--limit") ? Number.parseInt(val("--limit")!, 10) : DRY ? 30 : all.length;
  const generals = all.slice(0, limit);
  console.log(`REMAP: ${all.length} published "general" prompts${DRY ? ` — previewing ${generals.length}` : " to classify"}.\n`);

  const counts: Record<string, number> = {};
  let i = 0;
  for (const g of generals) {
    const cat = await classify(g);
    counts[cat] = (counts[cat] ?? 0) + 1;
    i++;
    if (DRY) {
      console.log(`${g.slug} → ${cat}`);
    } else {
      await prisma.prompt.update({ where: { id: g.id }, data: { category: cat } });
      if (i % 25 === 0) console.log(`…updated ${i}/${generals.length}`);
    }
  }
  console.log(`\n${DRY ? "DRY RUN — " : "✓ "}distribution: ${JSON.stringify(counts)}`);
  if (DRY) console.log("Re-run without --dry-run to apply.");
}

async function main() {
  if (has("--prune")) await prune();
  else if (has("--remap")) await remap();
  else console.log("pass --prune or --remap (with optional --dry-run).");
  await prisma.$disconnect();
  process.exit(0);
}

main();
