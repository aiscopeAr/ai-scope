import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import OpenAI from "openai";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const CATEGORIES = ["image", "writing", "code", "marketing", "general"] as const;
type Category = typeof CATEGORIES[number];

const CATEGORY_LABELS: Record<Category, string> = {
  image: "توليد الصور",
  writing: "الكتابة الإبداعية",
  code: "البرمجة",
  marketing: "التسويق",
  general: "عام",
};

function verifyCronSecret(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Pick 3 random tools to attach prompts to + 2 general prompts
  const tools = await prisma.aITool.findMany({
    where: { published: true },
    select: { id: true, name: true, tagline: true, toolCategory: true },
    orderBy: { viewCount: "desc" },
    take: 20,
  });

  // Shuffle and pick 3
  const shuffled = tools.sort(() => Math.random() - 0.5).slice(0, 3);

  const generated: string[] = [];
  const failed: string[] = [];

  // Generate tool-specific prompts
  for (const tool of shuffled) {
    try {
      const result = await generatePromptForTool(tool);
      if (result) generated.push(result);
    } catch (err) {
      console.error(`[generate-prompts] Failed for tool ${tool.name}:`, err);
      failed.push(tool.name);
    }
  }

  // Generate 2 general prompts
  for (let i = 0; i < 2; i++) {
    try {
      const category = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
      const result = await generateGeneralPrompt(category);
      if (result) generated.push(result);
    } catch (err) {
      console.error("[generate-prompts] Failed for general prompt:", err);
      failed.push("general");
    }
  }

  return NextResponse.json({ ok: true, generated: generated.length, failed: failed.length });
}

async function generatePromptForTool(tool: { id: string; name: string; tagline: string | null; toolCategory: string }) {
  const category = mapToolCategoryToPromptCategory(tool.toolCategory);

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `أنت خبير في كتابة الـ prompts للذكاء الاصطناعي.
مهمتك: اكتب prompt احترافي يمكن استخدامه مع أداة "${tool.name}".
أعد JSON بهذا الشكل:
{
  "title": "عنوان قصير بالإنجليزية (5-8 كلمات)",
  "titleAr": "عنوان قصير بالعربية (5-8 كلمات)",
  "body": "نص الـ prompt الكامل بالإنجليزية (50-200 كلمة)",
  "description": "شرح قصير بالعربية لماذا هذا الـ prompt مفيد (2-3 جمل)",
  "tags": ["tag1", "tag2", "tag3"]
}`,
      },
      {
        role: "user",
        content: `اكتب prompt احترافي ومفيد لاستخدام أداة "${tool.name}"${tool.tagline ? ` (${tool.tagline})` : ""}.
يجب أن يكون الـ prompt عملي ومحدد وقابل للتطبيق مباشرة.`,
      },
    ],
  });

  const raw = completion.choices[0].message.content;
  if (!raw) return null;

  const data = JSON.parse(raw);
  if (!data.title || !data.titleAr || !data.body) return null;

  const baseSlug = slugify(data.title);
  const slug = await ensureUniqueSlug(baseSlug);

  await prisma.prompt.create({
    data: {
      title: data.title,
      titleAr: data.titleAr,
      body: data.body,
      description: data.description ?? null,
      category,
      toolId: tool.id,
      tags: Array.isArray(data.tags) ? data.tags.slice(0, 5) : [],
      slug,
      published: true,
    },
  });

  return slug;
}

async function generateGeneralPrompt(category: Category) {
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `أنت خبير في كتابة الـ prompts للذكاء الاصطناعي.
مهمتك: اكتب prompt احترافي في مجال "${CATEGORY_LABELS[category]}" يعمل مع أي أداة ذكاء اصطناعي.
أعد JSON بهذا الشكل:
{
  "title": "عنوان قصير بالإنجليزية (5-8 كلمات)",
  "titleAr": "عنوان قصير بالعربية (5-8 كلمات)",
  "body": "نص الـ prompt الكامل بالإنجليزية (50-200 كلمة)",
  "description": "شرح قصير بالعربية لماذا هذا الـ prompt مفيد (2-3 جمل)",
  "tags": ["tag1", "tag2", "tag3"]
}`,
      },
      {
        role: "user",
        content: `اكتب prompt احترافي ومفيد في مجال "${CATEGORY_LABELS[category]}". يجب أن يكون عملي ومحدد وقابل للتطبيق مباشرة مع ChatGPT أو Claude أو أي LLM.`,
      },
    ],
  });

  const raw = completion.choices[0].message.content;
  if (!raw) return null;

  const data = JSON.parse(raw);
  if (!data.title || !data.titleAr || !data.body) return null;

  const baseSlug = slugify(data.title);
  const slug = await ensureUniqueSlug(baseSlug);

  await prisma.prompt.create({
    data: {
      title: data.title,
      titleAr: data.titleAr,
      body: data.body,
      description: data.description ?? null,
      category,
      toolId: null,
      tags: Array.isArray(data.tags) ? data.tags.slice(0, 5) : [],
      slug,
      published: true,
    },
  });

  return slug;
}

async function ensureUniqueSlug(base: string): Promise<string> {
  let slug = base;
  let i = 1;
  while (await prisma.prompt.findUnique({ where: { slug } })) {
    slug = `${base}-${i++}`;
  }
  return slug;
}

function mapToolCategoryToPromptCategory(toolCategory: string): Category {
  const map: Record<string, Category> = {
    "image-generation": "image",
    design: "image",
    writing: "writing",
    copywriting: "writing",
    coding: "code",
    development: "code",
    marketing: "marketing",
    seo: "marketing",
  };
  return map[toolCategory] ?? "general";
}
