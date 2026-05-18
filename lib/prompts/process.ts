import OpenAI from "openai";
import { prisma } from "@/lib/db";

let _client: OpenAI | null = null;
function getClient() {
  if (!_client) _client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return _client;
}

interface QueueItem {
  id: string;
  rawTitle: string;
  rawPrompt: string;
  rawCategory: string | null;
}

interface ProcessResult {
  titleAr: string;
  descriptionAr: string;
  promptTextAr: string;
  examples: string[];
  useCases: string[];
  culturalNotes: string;
  difficulty: string;
  tags: string[];
  score: number;
}

export async function processPromptWithAI(item: QueueItem): Promise<ProcessResult> {
  const completion = await getClient().chat.completions.create({
    model: "gpt-4o-mini",
    max_tokens: 1500,
    messages: [
      {
        role: "system",
        content: `أنت معالج prompts للجمهور العربي. أرجع JSON فقط بدون أي نص إضافي.

مهمتك:
1. ترجم العنوان للعربية بشكل جذاب (5-10 كلمات)
2. اكتب وصف قصير بالعربية (30-60 كلمة)
3. ترجم الـ prompt للعربية مع تكييفه للسياق العربي/الخليجي
4. اقترح 3 أمثلة عملية بالعربية
5. اقترح 3 حالات استخدام عملية
6. أضف ملاحظة ثقافية مفيدة إن وجدت

أرجع JSON بهذا الشكل الدقيق:
{"titleAr":"...","descriptionAr":"...","promptTextAr":"...","examples":["...","...","..."],"useCases":["...","...","..."],"culturalNotes":"...","difficulty":"beginner|intermediate|advanced","tags":["...","..."]}`
      },
      {
        role: "user",
        content: `العنوان: ${item.rawTitle}\nالـ Prompt: ${item.rawPrompt.slice(0, 800)}\nالتصنيف: ${item.rawCategory ?? "writing"}`,
      },
    ],
    response_format: { type: "json_object" },
    temperature: 0.7,
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";
  const result = JSON.parse(raw) as Partial<ProcessResult & { examples: string[]; useCases: string[]; tags: string[] }>;

  const score = calculateScore({
    titleLen: (result.titleAr ?? "").length,
    descLen: (result.descriptionAr ?? "").length,
    hasExamples: (result.examples?.length ?? 0) > 0,
    hasUseCases: (result.useCases?.length ?? 0) > 0,
    hasCultural: !!(result.culturalNotes),
    promptLen: item.rawPrompt.length,
  });

  return {
    titleAr: result.titleAr ?? item.rawTitle,
    descriptionAr: result.descriptionAr ?? "",
    promptTextAr: result.promptTextAr ?? item.rawPrompt,
    examples: result.examples ?? [],
    useCases: result.useCases ?? [],
    culturalNotes: result.culturalNotes ?? "",
    difficulty: result.difficulty ?? "intermediate",
    tags: result.tags ?? [],
    score,
  };
}

function calculateScore(f: { titleLen: number; descLen: number; hasExamples: boolean; hasUseCases: boolean; hasCultural: boolean; promptLen: number }): number {
  let s = 4;
  if (f.titleLen > 5 && f.titleLen < 80) s++;
  if (f.descLen > 30) s++;
  if (f.hasExamples) s++;
  if (f.hasUseCases) s++;
  if (f.hasCultural) s++;
  if (f.promptLen > 100) s++;
  return Math.min(s, 10);
}

export async function autoPublishPrompt(queueId: string): Promise<void> {
  const item = await prisma.promptQueue.findUnique({ where: { id: queueId } });
  if (!item || item.status !== "processed" || !item.titleAr || !item.promptTextAr) return;

  const category = await prisma.promptCategory.findFirst({
    where: { slug: item.rawCategory ?? "writing" },
  }) ?? await prisma.promptCategory.findFirst();

  const aiModel = await prisma.aIModel.findFirst({ where: { slug: "gpt-4o" } })
    ?? await prisma.aIModel.findFirst();

  if (!category || !aiModel) return;

  // Build slug from English title + random suffix (Arabic chars break URLs)
  const base = item.rawTitle
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 60);
  const slug = `${base}-${Math.random().toString(36).slice(2, 7)}`;

  // Check slug uniqueness
  const exists = await prisma.prompt.findUnique({ where: { slug } });
  const finalSlug = exists ? `${slug}-${Date.now()}` : slug;

  await prisma.prompt.create({
    data: {
      title: item.rawTitle,
      titleAr: item.titleAr,
      slug: finalSlug,
      description: item.rawPrompt.slice(0, 300),
      descriptionAr: item.descriptionAr ?? "",
      promptText: item.rawPrompt,
      promptTextAr: item.promptTextAr,
      examples: item.examples ?? [],
      useCases: item.useCases ?? [],
      culturalNotes: item.culturalNotes ?? null,
      sourceUrl: item.sourceUrl,
      sourceName: item.sourceName,
      categoryId: category.id,
      aiModelId: aiModel.id,
      tags: item.tags ?? [],
      difficulty: item.difficulty ?? "intermediate",
      published: true,
      publishedAt: new Date(),
    },
  });

  await prisma.promptQueue.update({
    where: { id: queueId },
    data: { status: "approved" },
  });
}
