/**
 * scripts/enrich-prompts.ts
 *
 * Prompts-library redesign P3 — curate & AI-enrich the top prompts into
 * "featured" quality (specific prompt + variations + pro tips + use-cases +
 * model hint; for image prompts, an example output image via Replicate).
 *
 * Fully AI-driven (D4). Reads the top prompts by viewCount, asks gpt-4o to
 * upgrade each per a quality rubric, generates an example image for the
 * "image" category, and marks them featured (quality=2). Idempotent: skips
 * prompts already at quality>=2 unless --force.
 *
 * Usage:
 *   npx tsx scripts/enrich-prompts.ts --dry-run --limit 2   # preview only, no writes, no image gen
 *   npx tsx scripts/enrich-prompts.ts --limit 40            # enrich + write + images + feature
 *   npx tsx scripts/enrich-prompts.ts --limit 40 --force    # re-enrich already-done ones too
 */

import { PrismaClient } from "@prisma/client";
import OpenAI from "openai";
import { generateReviewImage } from "../lib/images";

process.loadEnvFile?.(".env");

const prisma = new PrismaClient();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const FORCE = args.includes("--force");
const LIMIT = (() => {
  const i = args.indexOf("--limit");
  const n = i >= 0 ? parseInt(args[i + 1], 10) : 40;
  return Number.isFinite(n) && n > 0 ? n : 40;
})();

interface Enrichment {
  body: string;
  bodyAr: string;
  description: string;
  modelHint: string;
  variations: { label: string; text: string }[];
  tips: string[];
  useCases: string[];
  imagePrompt: string | null;
}

const SYSTEM = `أنت محرّر خبير في مكتبة برومبتات عربية احترافية (مثل promptlibrary لكن بالعربية).
مهمتك: ترقية مُدخَل برومبت موجود إلى جودة عالية حقيقية — برومبت محدد وعملي، لا نص عام فضفاض.

القواعد:
- body: النسخة الإنجليزية المحسّنة من البرومبت — محددة وجاهزة للّصق، مع تفاصيل/معاملات مناسبة للأداة. ليست وصفًا عن البرومبت، بل البرومبت نفسه.
- bodyAr: النسخة العربية المكيّفة (ليست ترجمة حرفية).
- description: جملتان-ثلاث بالعربية تشرحان لماذا هذا البرومبت مفيد ومتى يُستخدم.
- modelHint: الأدوات/النماذج الأنسب. استخدم أحدث الإصدارات (مثل "Midjourney v6 · DALL·E 3" للصور، أو "ChatGPT · Claude · Gemini" للنصوص). لا تستخدم إصدارات قديمة (لا v5).
- variations: 2 إلى 4 تنويعات جاهزة، كلٌّ {label بالعربية, text برومبت كامل}.
- tips: 2 إلى 4 نصائح احترافية قصيرة بالعربية (ماذا تغيّر، أخطاء شائعة، معاملات).
- useCases: 3 إلى 5 حالات استخدام قصيرة بالعربية (كلمتان لكل واحدة).
- imagePrompt: للفئة "image" فقط — برومبت إنجليزي محدّد وملموس لتوليد صورة مثال تُظهر فعليًا أفضل نتيجة لهذا البرومبت (موضوع محدّد + نمط + إضاءة + تكوين)، وليس مشهدًا عامًا مبهمًا. إن كان البرومبت الأصلي قالبًا/مُنشئًا، فاملأه بمثال واحد قوي وملموس. لغير فئة الصور: null.

أعد JSON فقط بهذا الشكل:
{"body":"...","bodyAr":"...","description":"...","modelHint":"...","variations":[{"label":"...","text":"..."}],"tips":["..."],"useCases":["..."],"imagePrompt":"... or null"}`;

async function enrichOne(p: {
  id: string;
  slug: string;
  title: string;
  titleAr: string;
  body: string;
  category: string;
  toolName: string | null;
}): Promise<Enrichment | null> {
  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    temperature: 0.6,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM },
      {
        role: "user",
        content: `الفئة: ${p.category}
${p.toolName ? `الأداة: ${p.toolName}` : "عام (أي نموذج)"}
العنوان: ${p.titleAr} / ${p.title}
البرومبت الحالي:
${p.body}

رقِّه إلى جودة احترافية حسب القواعد.`,
      },
    ],
  });
  const raw = completion.choices[0].message.content;
  if (!raw) return null;
  const d = JSON.parse(raw);
  if (!d.body || !d.bodyAr) return null;
  return {
    body: d.body,
    bodyAr: d.bodyAr,
    description: d.description ?? "",
    modelHint: d.modelHint ?? "",
    variations: Array.isArray(d.variations)
      ? d.variations.filter((v: { label?: string; text?: string }) => v && v.text).slice(0, 4)
      : [],
    tips: Array.isArray(d.tips) ? d.tips.filter(Boolean).slice(0, 4) : [],
    useCases: Array.isArray(d.useCases) ? d.useCases.filter(Boolean).slice(0, 5) : [],
    imagePrompt: p.category === "image" && typeof d.imagePrompt === "string" ? d.imagePrompt : null,
  };
}

async function main() {
  console.log(`enrich-prompts: dryRun=${DRY_RUN} force=${FORCE} limit=${LIMIT}`);

  const candidates = await prisma.prompt.findMany({
    where: { published: true, ...(FORCE ? {} : { quality: { lt: 2 } }) },
    orderBy: { viewCount: "desc" },
    take: LIMIT,
    select: {
      id: true, slug: true, title: true, titleAr: true, body: true,
      category: true, viewCount: true,
      tool: { select: { name: true } },
    },
  });

  console.log(`selected ${candidates.length} prompts (by viewCount)\n`);

  let done = 0;
  let images = 0;
  for (const p of candidates) {
    try {
      const e = await enrichOne({
        id: p.id, slug: p.slug, title: p.title, titleAr: p.titleAr,
        body: p.body, category: p.category, toolName: p.tool?.name ?? null,
      });
      if (!e) {
        console.log(`SKIP (no enrichment): ${p.slug}`);
        continue;
      }

      if (DRY_RUN) {
        console.log("────────────────────────────────────────");
        console.log(`#${p.viewCount}  ${p.slug}  [${p.category}]`);
        console.log(`modelHint: ${e.modelHint}`);
        console.log(`bodyAr:\n${e.bodyAr}`);
        console.log(`variations: ${e.variations.map((v) => v.label).join(" · ")}`);
        console.log(`tips: ${e.tips.join(" | ")}`);
        console.log(`useCases: ${e.useCases.join(" · ")}`);
        console.log(`imagePrompt: ${e.imagePrompt ?? "(none)"}`);
        done++;
        continue;
      }

      let exampleImageUrl: string | null = null;
      if (e.imagePrompt) {
        exampleImageUrl = await generateReviewImage(e.imagePrompt, { reviewId: p.slug });
        if (exampleImageUrl) images++;
      }

      await prisma.prompt.update({
        where: { id: p.id },
        data: {
          body: e.body,
          bodyAr: e.bodyAr,
          description: e.description || undefined,
          modelHint: e.modelHint || null,
          variations: e.variations.length ? e.variations : undefined,
          tips: e.tips,
          useCases: e.useCases,
          imagePrompt: e.imagePrompt,
          exampleImageUrl,
          featured: true,
          quality: 2,
          // Image prompts stay unpublished until a human approves the hero
          // image (review/replace via scripts/prompt-images.ts). Text prompts
          // have nothing to review, so they publish immediately.
          ...(p.category === "image" ? { published: false } : {}),
        },
      });
      done++;
      console.log(`✓ ${p.slug}${exampleImageUrl ? " (+image)" : ""}${p.category === "image" ? " [draft — needs image review]" : ""}`);
    } catch (err) {
      console.error(`✗ ${p.slug}:`, err instanceof Error ? err.message : err);
    }
  }

  console.log(`\nDONE. enriched=${done}${DRY_RUN ? " (dry-run, no writes)" : `, images=${images}, featured+quality:2 set`}`);
  await prisma.$disconnect();
  process.exit(0);
}

main();
