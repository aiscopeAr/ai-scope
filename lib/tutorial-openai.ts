import OpenAI from "openai";
import { AUTHORS } from "@/lib/authors";
import { prisma } from "@/lib/db";
import { SITE_URL } from "@/lib/seo";

let _client: OpenAI | null = null;
function getClient(): OpenAI {
  if (!_client) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("OPENAI_API_KEY is not set");
    _client = new OpenAI({ apiKey });
  }
  return _client;
}

export type TutorialStep = {
  title: string;
  body: string;
  tip?: string;
  imagePrompt?: string;
};

export type TutorialDraft = {
  titleAr: string;
  summaryAr: string;
  contentAr: string;
  tocItems: string[];
  steps: TutorialStep[];
  tags: string[];
  keywords: string[];
  faq: { question: string; answer: string }[];
  seoTitle: string;
  seoDescription: string;
  slug: string;
  featuredImagePrompt: string;
  imageAlt: string;
  toolName: string;
  toolUrl?: string;
  relatedPromptsKeywords: string[];
};

// ─── Related prompts lookup ────────────────────────────────────────────────

async function findRelatedPrompts(keywords: string[]): Promise<Array<{ titleAr: string; slug: string }>> {
  if (keywords.length === 0) return [];
  try {
    const prompts = await prisma.prompt.findMany({
      where: {
        published: true,
        OR: keywords.map((kw) => ({
          OR: [
            { titleAr: { contains: kw, mode: "insensitive" as const } },
            { tags: { has: kw } },
          ],
        })),
      },
      select: { titleAr: true, slug: true },
      take: 3,
    });
    return prompts;
  } catch {
    return [];
  }
}

// ─── Prompt builder ────────────────────────────────────────────────────────

function buildTutorialPrompt(topic: string, relatedPromptsBlock: string): string {
  return `اكتب دليلاً شاملاً وعملياً باللغة العربية عن: "${topic}"

هذا محتوى Evergreen — يجب أن يبقى مفيداً لسنوات. لا تذكر تواريخ محددة أو أرقام إصدارات متغيرة.

البنية المطلوبة لـ contentAr (Markdown، لا تقل عن 1800 كلمة):

## مقدمة
- ما هذه الأداة؟ لماذا يحتاجها القارئ العربي؟
- ماذا ستتعلم في هذا الدليل؟ (قائمة نقطية)

## ما ستحتاجه قبل البدء
- المتطلبات، الحسابات، الإعدادات الأساسية

## خطوة بخطوة: [العنوان الرئيسي]
- **الخطوة 1: [عنوان]** — شرح تفصيلي + ماذا يرى المستخدم على الشاشة
- **الخطوة 2: [عنوان]** — ...
- **الخطوة 3: [عنوان]** — ...
(5 إلى 8 خطوات)

## نصائح احترافية
- 3 إلى 5 نصائح متقدمة لا تذكرها الصفحات الرسمية

## الأخطاء الشائعة وكيف تتجنبها
- أشهر 3 أخطاء + الحل

## الخلاصة والخطوات التالية
- ملخص سريع
- ماذا تفعل بعد إتقان هذه الأداة؟

${relatedPromptsBlock}

أعد JSON فقط (بدون markdown، بدون backticks):
{
  "titleAr": "عنوان يبدأ بـ 'كيف' أو 'دليل' — يجذب الباحثين (أقل من 80 حرف)",
  "summaryAr": "3 جمل تصف ما سيتعلمه القارئ بدقة وتشويق",
  "contentAr": "المحتوى الكامل بتنسيق Markdown — لا تقل عن 1800 كلمة",
  "tocItems": ["عنوان القسم 1", "عنوان القسم 2", "عنوان القسم 3", "..."],
  "steps": [
    { "title": "عنوان الخطوة", "body": "شرح تفصيلي ماذا يفعل المستخدم وماذا يرى", "tip": "نصيحة اختيارية", "imagePrompt": "English scene for DALL-E (max 15 words)" }
  ],
  "tags": ["وسم1", "وسم2", "وسم3", "وسم4", "وسم5"],
  "keywords": ["كلمة مفتاحية 1", "كلمة 2", "كلمة 3", "كلمة 4", "كلمة 5", "كلمة 6", "كلمة 7", "كلمة 8"],
  "seoTitle": "عنوان SEO (50-60 حرف) يبدأ بالكلمة المفتاحية",
  "seoDescription": "وصف SEO (140-160 حرف) يوضح الفائدة العملية",
  "slug": "english-slug-max-6-words-starts-with-how-or-guide",
  "featuredImagePrompt": "Vivid English scene showing someone using the tool on laptop (max 20 words)",
  "imageAlt": "وصف الصورة الرئيسية",
  "toolName": "اسم الأداة بالإنجليزية",
  "toolUrl": "https://... (الرابط الرسمي للأداة إن كنت تعرفه)",
  "relatedPromptsKeywords": ["كلمة بحث 1", "كلمة بحث 2", "كلمة بحث 3"]
}`.trim();
}

// ─── Main function ─────────────────────────────────────────────────────────

export async function writeTutorial(topic: string): Promise<TutorialDraft & { relatedPrompts: Array<{ titleAr: string; slug: string }> }> {
  const client = getClient();
  const author = AUTHORS["team"];

  // First pass: generate content
  const response = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL ?? "gpt-4o",
    messages: [
      { role: "system", content: author.systemPrompt },
      { role: "user", content: buildTutorialPrompt(topic, "") },
    ],
    temperature: 0.75,
    max_tokens: 14000,
  });

  const raw = response.choices[0]?.message?.content ?? "";
  const jsonText = raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();

  const parsed = JSON.parse(jsonText) as Partial<TutorialDraft>;

  // Find related prompts from our DB
  const promptKeywords = Array.isArray(parsed.relatedPromptsKeywords) ? parsed.relatedPromptsKeywords : [];
  const relatedPrompts = await findRelatedPrompts(promptKeywords);

  // If we found related prompts, append internal links to the content
  let contentAr = parsed.contentAr ?? "";
  if (relatedPrompts.length > 0) {
    const linksBlock = relatedPrompts
      .map((p) => `- [${p.titleAr}](${SITE_URL}/prompts/${p.slug})`)
      .join("\n");
    contentAr += `\n\n## برومبتس مقترحة من لوميك\nجرّب هذه البرومبتس المصممة خصيصاً لتحقيق أقصى استفادة:\n${linksBlock}`;
  }

  return {
    titleAr: parsed.titleAr ?? topic,
    summaryAr: parsed.summaryAr ?? "",
    contentAr,
    tocItems: Array.isArray(parsed.tocItems) ? parsed.tocItems : [],
    steps: Array.isArray(parsed.steps) ? parsed.steps : [],
    tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 8) : [],
    keywords: Array.isArray(parsed.keywords) ? parsed.keywords.slice(0, 10) : [],
    faq: Array.isArray(parsed.faq) ? parsed.faq.slice(0, 6) : [],
    seoTitle: parsed.seoTitle ?? parsed.titleAr ?? topic,
    seoDescription: parsed.seoDescription ?? parsed.summaryAr ?? "",
    slug: parsed.slug ?? "",
    featuredImagePrompt: parsed.featuredImagePrompt ?? "",
    imageAlt: parsed.imageAlt ?? "",
    toolName: parsed.toolName ?? "",
    toolUrl: parsed.toolUrl,
    relatedPromptsKeywords: promptKeywords,
    relatedPrompts,
  };
}
