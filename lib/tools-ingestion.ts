import { prisma } from "@/lib/db";
import OpenAI from "openai";

let _client: OpenAI | null = null;
function getClient(): OpenAI {
  if (!_client) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("OPENAI_API_KEY is not set");
    _client = new OpenAI({ apiKey });
  }
  return _client;
}

export interface RawToolInput {
  name: string;
  website: string;
  logoUrl?: string;
  tagline?: string;
  rawDescription: string; // English description from source
  pricing?: string; // "free" | "freemium" | "paid"
  monthlyPrice?: number;
  sourceUrl: string;
  sourceName: string; // "ProductHunt" | "Futurepedia" | "manual" etc.
  tags?: string[];
}

interface AiToolContent {
  descriptionAr: string;
  contentAr: string;
  pros: string[];
  cons: string[];
  useCases: string[];
  tags: string[];
  toolCategory: string;
  seoTitle: string;
  seoDescription: string;
  imageAlt: string;
  faq: Array<{ question: string; answer: string }>;
  slug: string;
  relatedTopics: string[];
  arabicSupport: boolean;
  hasApi: boolean;
}

const SYSTEM_PROMPT = `You are an expert Arabic tech journalist specializing in AI tools.
Write authentic Arabic content about AI tools — not a literal translation but a well-crafted Arabic review.
Return ONLY valid JSON, no markdown or backticks.`;

const TOOL_CATEGORIES = [
  "writing", "coding", "image", "video", "voice", "marketing", "education",
  "startups", "ecommerce", "automation", "customer-support", "productivity",
  "legal", "finance", "healthcare", "students", "no-code", "presentations", "other",
];

function buildToolPrompt(tool: RawToolInput): string {
  return `
Generate a comprehensive Arabic review for this AI tool:

Tool: ${tool.name}
Website: ${tool.website}
Tagline: ${tool.tagline ?? ""}
Description: ${tool.rawDescription.slice(0, 3000)}
Pricing: ${tool.pricing ?? "freemium"}
Tags: ${(tool.tags ?? []).join(", ")}

Return ONLY this JSON (no markdown):
{
  "descriptionAr": "short Arabic description (2-3 sentences, 80-120 words)",
  "contentAr": "comprehensive Arabic review (600+ words) — explain what it is, how it works, who it serves, impact on users",
  "pros": ["advantage 1 in Arabic", "advantage 2", "advantage 3", "advantage 4"],
  "cons": ["disadvantage 1 in Arabic", "disadvantage 2", "disadvantage 3"],
  "useCases": ["use case 1 in Arabic", "use case 2", "use case 3", "use case 4", "use case 5"],
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "toolCategory": "one of: ${TOOL_CATEGORIES.join(" | ")}",
  "seoTitle": "SEO title in Arabic (50-60 chars)",
  "seoDescription": "SEO description in Arabic (140-160 chars)",
  "imageAlt": "image alt text in Arabic",
  "faq": [
    {"question": "common question about this tool in Arabic?", "answer": "helpful answer (2-3 sentences)"},
    {"question": "second question?", "answer": "answer"},
    {"question": "third question?", "answer": "answer"},
    {"question": "fourth question?", "answer": "answer"}
  ],
  "slug": "tool-name-english-slug-max-5-words",
  "relatedTopics": ["related topic 1", "related topic 2", "related topic 3"],
  "arabicSupport": true or false based on whether this tool supports Arabic language,
  "hasApi": true or false based on whether this tool offers an API
}
`.trim();
}

/** Generate Arabic content for a tool using OpenAI. */
export async function generateToolContent(tool: RawToolInput): Promise<AiToolContent | null> {
  const client = getClient();
  try {
    const response = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildToolPrompt(tool) },
      ],
      temperature: 0.7,
      max_tokens: 3000,
    });

    const raw = (response.choices[0]?.message?.content ?? "")
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();

    const parsed = JSON.parse(raw) as Partial<AiToolContent>;

    return {
      descriptionAr: parsed.descriptionAr ?? tool.rawDescription.slice(0, 200),
      contentAr: parsed.contentAr ?? "",
      pros: Array.isArray(parsed.pros) ? parsed.pros.slice(0, 8) : [],
      cons: Array.isArray(parsed.cons) ? parsed.cons.slice(0, 6) : [],
      useCases: Array.isArray(parsed.useCases) ? parsed.useCases.slice(0, 8) : [],
      tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 8) : [],
      toolCategory: TOOL_CATEGORIES.includes(parsed.toolCategory ?? "") ? (parsed.toolCategory ?? "other") : "other",
      seoTitle: parsed.seoTitle ?? `${tool.name} - AI Tool Review`,
      seoDescription: parsed.seoDescription ?? "",
      imageAlt: parsed.imageAlt ?? tool.name,
      faq: Array.isArray(parsed.faq)
        ? parsed.faq.filter((f) => f.question && f.answer).slice(0, 5)
        : [],
      slug: parsed.slug ?? tool.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").slice(0, 50),
      relatedTopics: Array.isArray(parsed.relatedTopics) ? parsed.relatedTopics.slice(0, 5) : [],
      arabicSupport: parsed.arabicSupport ?? false,
      hasApi: parsed.hasApi ?? false,
    };
  } catch (err) {
    console.error("[tools-ingestion] AI generation failed:", err);
    return null;
  }
}

/** Ingest a single tool: check for duplicate, generate AI content, save to DB. */
export async function ingestTool(input: RawToolInput): Promise<{ status: "created" | "duplicate" | "failed"; slug?: string }> {
  // Dedup by website URL (normalized)
  const normalizedUrl = input.website.replace(/\/$/, "").toLowerCase();
  const existing = await prisma.aITool.findFirst({
    where: { website: { contains: normalizedUrl.replace(/https?:\/\//, "") } },
    select: { id: true, slug: true },
  });
  if (existing) return { status: "duplicate", slug: existing.slug };

  // Generate AI content
  const content = await generateToolContent(input);
  if (!content) return { status: "failed" };

  // Ensure slug is unique
  let slug = content.slug || input.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").slice(0, 50);
  const slugExists = await prisma.aITool.findUnique({ where: { slug }, select: { id: true } });
  if (slugExists) slug = `${slug}-${Date.now().toString(36)}`;

  try {
    await prisma.aITool.create({
      data: {
        name: input.name,
        slug,
        tagline: input.tagline ?? null,
        descriptionAr: content.descriptionAr,
        contentAr: content.contentAr,
        website: input.website,
        logoUrl: input.logoUrl ?? null,
        toolCategory: content.toolCategory,
        category: content.toolCategory, // keep compat field in sync
        pricing: input.pricing ?? "freemium",
        monthlyPrice: input.monthlyPrice ?? null,
        pros: content.pros,
        cons: content.cons,
        useCases: content.useCases,
        tags: content.tags,
        arabicSupport: content.arabicSupport,
        hasApi: content.hasApi,
        faq: content.faq.length > 0 ? content.faq : undefined,
        seoTitle: content.seoTitle,
        seoDescription: content.seoDescription,
        imageAlt: content.imageAlt,
        relatedTopics: content.relatedTopics,
        sourceUrl: input.sourceUrl,
        published: false, // needs admin approval by default
      },
    });
    return { status: "created", slug };
  } catch (err) {
    console.error("[tools-ingestion] DB save failed:", err);
    return { status: "failed" };
  }
}
