import { NextResponse } from "next/server";
import { ingestTool, type RawToolInput } from "@/lib/tools-ingestion";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function verifyCronSecret(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

// Manually curated seed tools — replace/extend this list or add a real scraper
// Each entry represents an AI tool to ingest if not already in the DB
const SEED_TOOLS: RawToolInput[] = [
  {
    name: "ChatGPT",
    website: "https://chat.openai.com",
    tagline: "The world's most popular AI assistant",
    rawDescription: "ChatGPT is an AI-powered chatbot developed by OpenAI. It can write text, answer questions, summarize documents, write code, and assist with a wide variety of tasks. It uses the GPT-4 model and is available via web, mobile, and API.",
    pricing: "freemium",
    monthlyPrice: 20,
    sourceUrl: "https://chat.openai.com",
    sourceName: "manual",
    tags: ["chatbot", "writing", "coding", "openai", "gpt"],
  },
  {
    name: "Claude",
    website: "https://claude.ai",
    tagline: "Anthropic's AI assistant for safe, helpful conversations",
    rawDescription: "Claude is an AI assistant built by Anthropic, focused on safety and helpfulness. It excels at analysis, writing, coding, math, and nuanced reasoning. Available via web app and API, with a generous free tier.",
    pricing: "freemium",
    monthlyPrice: 20,
    sourceUrl: "https://claude.ai",
    sourceName: "manual",
    tags: ["chatbot", "writing", "coding", "anthropic", "safe-ai"],
  },
  {
    name: "Midjourney",
    website: "https://midjourney.com",
    tagline: "AI art generation at the highest quality",
    rawDescription: "Midjourney is a powerful AI image generation tool operated through Discord. It creates stunning, artistic images from text prompts and is widely considered the highest quality AI image generator available.",
    pricing: "paid",
    monthlyPrice: 10,
    sourceUrl: "https://midjourney.com",
    sourceName: "manual",
    tags: ["image-generation", "art", "creative", "discord"],
  },
  {
    name: "GitHub Copilot",
    website: "https://github.com/features/copilot",
    tagline: "AI pair programmer for faster coding",
    rawDescription: "GitHub Copilot is an AI-powered code completion tool developed by GitHub and OpenAI. It suggests code in real-time within your IDE, supporting dozens of programming languages and frameworks.",
    pricing: "freemium",
    monthlyPrice: 10,
    sourceUrl: "https://github.com/features/copilot",
    sourceName: "manual",
    tags: ["coding", "code-completion", "github", "ide"],
  },
  {
    name: "Perplexity AI",
    website: "https://perplexity.ai",
    tagline: "AI-powered search engine with citations",
    rawDescription: "Perplexity is an AI-powered answer engine that searches the web and provides cited, up-to-date answers. It combines the power of LLMs with real-time web search.",
    pricing: "freemium",
    monthlyPrice: 20,
    sourceUrl: "https://perplexity.ai",
    sourceName: "manual",
    tags: ["search", "research", "citations", "web-search"],
  },
];

export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results: Array<{ name: string; status: string; slug?: string }> = [];

  for (const tool of SEED_TOOLS) {
    const result = await ingestTool(tool);
    results.push({ name: tool.name, status: result.status, slug: result.slug });
    // Small delay between AI calls to avoid rate limiting
    if (result.status === "created") {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  const created = results.filter((r) => r.status === "created").length;
  const duplicates = results.filter((r) => r.status === "duplicate").length;
  const failed = results.filter((r) => r.status === "failed").length;

  return NextResponse.json({ ok: true, created, duplicates, failed, results });
}
