import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function verifyCronSecret(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

const COMPANY_PATTERNS = [
  "OpenAI", "ChatGPT", "GPT-4", "GPT-5", "GPT",
  "Google DeepMind", "DeepMind", "Gemini", "Google AI",
  "Anthropic", "Claude",
  "Meta AI", "LLaMA", "Llama",
  "Microsoft", "Copilot",
  "Mistral",
  "Hugging Face",
  "Stability AI", "Stable Diffusion",
  "Midjourney",
  "DALL-E",
  "Perplexity",
  "xAI", "Grok",
];

function detectCompanies(text: string): string[] {
  const found: string[] = [];
  const lower = text.toLowerCase();
  for (const name of COMPANY_PATTERNS) {
    if (lower.includes(name.toLowerCase())) found.push(name);
  }
  return [...new Set(found)];
}

export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const recentReviews = await prisma.review.findMany({
    where: {
      published: true,
      publishedAt: { gte: sevenDaysAgo },
    },
    select: { tags: true, titleAr: true, summary: true },
  });

  const tagCounts = new Map<string, number>();
  for (const review of recentReviews) {
    for (const tag of review.tags) {
      if (tag.trim()) tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
    }
  }

  const companyCounts = new Map<string, number>();
  for (const review of recentReviews) {
    const combined = `${review.titleAr} ${review.summary.slice(0, 500)}`;
    const companies = detectCompanies(combined);
    for (const company of companies) {
      companyCounts.set(company, (companyCounts.get(company) ?? 0) + 1);
    }
  }

  let tagUpserts = 0;
  let companyUpserts = 0;

  for (const [keyword, count] of tagCounts.entries()) {
    await prisma.trendingKeyword.upsert({
      where: { keyword_type: { keyword, type: "tag" } },
      update: { count },
      create: { keyword, count, type: "tag" },
    });
    tagUpserts++;
  }

  for (const [keyword, count] of companyCounts.entries()) {
    await prisma.trendingKeyword.upsert({
      where: { keyword_type: { keyword, type: "company" } },
      update: { count },
      create: { keyword, count, type: "company" },
    });
    companyUpserts++;
  }

  return NextResponse.json({
    ok: true,
    reviews: recentReviews.length,
    tagUpserts,
    companyUpserts,
  });
}
