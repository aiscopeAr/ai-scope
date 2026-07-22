/**
 * One-time backfill: generate full contentAr (+ pros/cons/useCases/faq/seoTitle/
 * seoDescription/imageAlt) for published tools that only ever got a short
 * descriptionAr at ingestion time. Deliberately does NOT touch slug,
 * toolCategory, or tags — these tools are already live and indexed with real
 * traffic, so their URLs/taxonomy must not shift.
 *
 * Usage: node scripts/backfill-tool-content.mjs [--dry-run] [--only=slug1,slug2]
 */
import { PrismaClient } from "@prisma/client";
import OpenAI from "openai";

const prisma = new PrismaClient();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYSTEM_PROMPT = `You are an expert Arabic tech journalist specializing in AI tools.
Write authentic Arabic content about AI tools — not a literal translation but a well-crafted Arabic review.
Return ONLY valid JSON, no markdown or backticks.`;

function buildPrompt(tool) {
  return `
Generate a comprehensive Arabic review for this AI tool. It already has a short
Arabic description below — expand on it faithfully, don't contradict it.

Tool: ${tool.name}
Website: ${tool.website ?? ""}
Tagline: ${tool.tagline ?? ""}
Existing short description (Arabic): ${tool.descriptionAr}
Pricing: ${tool.pricing}

Return ONLY this JSON (no markdown):
{
  "contentAr": "comprehensive Arabic review (600+ words) — what it is, how it works, who it serves, real-world impact",
  "pros": ["advantage 1 in Arabic", "advantage 2", "advantage 3", "advantage 4"],
  "cons": ["disadvantage 1 in Arabic", "disadvantage 2", "disadvantage 3"],
  "useCases": ["use case 1 in Arabic", "use case 2", "use case 3", "use case 4", "use case 5"],
  "seoTitle": "SEO title in Arabic (50-60 chars)",
  "seoDescription": "SEO description in Arabic (140-160 chars)",
  "imageAlt": "image alt text in Arabic",
  "faq": [
    {"question": "common question about this tool in Arabic?", "answer": "helpful answer (2-3 sentences)"},
    {"question": "second question?", "answer": "answer"},
    {"question": "third question?", "answer": "answer"},
    {"question": "fourth question?", "answer": "answer"}
  ]
}
`.trim();
}

async function generateForTool(tool) {
  const response = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: buildPrompt(tool) },
    ],
    temperature: 0.7,
    max_tokens: 3000,
  });

  const raw = (response.choices[0]?.message?.content ?? "")
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();

  return JSON.parse(raw);
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const onlyArg = process.argv.find((a) => a.startsWith("--only="));
  const onlySlugs = onlyArg ? onlyArg.replace("--only=", "").split(",") : null;

  const where = { published: true, contentAr: null };
  if (onlySlugs) where.slug = { in: onlySlugs };

  const tools = await prisma.aITool.findMany({
    where,
    select: { id: true, slug: true, name: true, website: true, tagline: true, descriptionAr: true, pricing: true },
  });

  console.log(`${dryRun ? "[DRY RUN] " : ""}Backfilling content for ${tools.length} tools`);

  for (const tool of tools) {
    try {
      const content = await generateForTool(tool);
      console.log(`${tool.slug}: generated ${content.contentAr?.length ?? 0} chars`);

      if (!dryRun) {
        await prisma.aITool.update({
          where: { id: tool.id },
          data: {
            contentAr: content.contentAr,
            pros: Array.isArray(content.pros) ? content.pros : [],
            cons: Array.isArray(content.cons) ? content.cons : [],
            useCases: Array.isArray(content.useCases) ? content.useCases : [],
            faq: Array.isArray(content.faq) && content.faq.length > 0 ? content.faq : undefined,
            seoTitle: content.seoTitle ?? undefined,
            seoDescription: content.seoDescription ?? undefined,
            imageAlt: content.imageAlt ?? undefined,
          },
        });
      }
    } catch (err) {
      console.error(`${tool.slug}: FAILED —`, err.message);
    }
  }

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
