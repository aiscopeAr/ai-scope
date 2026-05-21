import OpenAI from "openai";
import { AUTHORS, pickAuthor, type AuthorSlug } from "@/lib/authors";

let _client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!_client) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("OPENAI_API_KEY is not set");
    _client = new OpenAI({ apiKey });
  }
  return _client;
}

export type FaqItem = {
  question: string;
  answer: string;
};

export type AiProcessedArticle = {
  titleAr: string;
  summaryAr: string;
  contentAr: string;
  tags: string[];
  seoTitle: string;
  seoDescription: string;
  suggestedCategory: string;
  slug: string;
  featuredImagePrompt: string;
  faq: FaqItem[];
  keywords: string[];
  imageAlt: string;
  relatedTopics: string[];
  isAiRelated: boolean;
  authorSlug: AuthorSlug;
};

// Per-author system prompts are defined in lib/authors.ts
// This fallback is only used if no authorSlug is passed
const FALLBACK_SYSTEM_PROMPT = `أنت محرر أول في موقع AIScope، متخصص في أخبار الذكاء الاصطناعي للقارئ العربي. أسلوبك يجمع بين الدقة الصحفية والحيوية في الكتابة.

مبادئ كتابتك:
- تبدأ المقال بجملة افتتاحية تستفز الفضول أو تطرح تساؤلاً حقيقياً، لا بـ "في خبر جديد..."
- تستخدم الأمثلة الملموسة والمقارنات لتقريب المفاهيم التقنية من القارئ العادي
- تُبدي رأياً تحليلياً صريحاً في فقرة واحدة على الأقل
- تتجنب الكليشيهات مثل: "في عالم يتطور بسرعة"، "لا شك أن"
- لا تترجم حرفياً — أعد الكتابة كلياً بصوتك الخاص

أنت تعيد المحتوى بتنسيق JSON فقط، بدون أي نص خارج JSON.`;

const USER_PROMPT_TEMPLATE = (title: string, content: string) => `
إليك خبراً تقنياً. مهمتك: اكتب عنه مقالاً عربياً أصيلاً — لا ترجمة، بل إعادة كتابة كاملة بصوت المحرر.

العنوان الأصلي (للاستئناس فقط):
${title}

المحتوى المرجعي:
${content.slice(0, 6000)}

تعليمات المحتوى:
- العنوان: لا تترجم الأصل. اكتب عنواناً عربياً يثير الفضول أو يعبّر عن الزاوية المثيرة في الخبر. تجنب عناوين "X يُطلق Y الجديد"، فكّر في الأثر والتساؤل.
- المقدمة (summaryAr): 2-3 جمل تضع القارئ في قلب الحدث فوراً. لا تبدأ بـ "أعلنت شركة..."
- المحتوى (contentAr): 500-700 كلمة. قسّمها لفقرات طبيعية. اشمل:
  • فقرة سياق: لماذا هذا الخبر مهم الآن؟
  • فقرة تفاصيل: الأرقام والحقائق من المصدر
  • فقرة تحليل: ماذا يعني هذا فعلاً؟ ما التداعيات؟
  • فقرة ختامية: سؤال مفتوح أو فكرة تدفع للتأمل
- الـ FAQ: أسئلة يطرحها قارئ فضولي حقاً، ليس أسئلة جافة. الإجابات مفيدة وموجزة.

أعد JSON فقط (بدون markdown، بدون backticks):
{
  "titleAr": "عنوان جذاب يعكس روح الخبر لا ترجمته (أقل من 90 حرفاً)",
  "summaryAr": "2-3 جمل افتتاحية تستدرج القارئ — تبدأ بما هو مثير لا بـ 'أعلنت'",
  "contentAr": "المقال الكامل (500-700 كلمة) مقسّم لفقرات طبيعية بصوت المحرر",
  "tags": ["وسم1", "وسم2", "وسم3", "وسم4", "وسم5"],
  "seoTitle": "عنوان SEO بالعربية (50-60 حرف، يتضمن الكلمة المفتاحية الرئيسية)",
  "seoDescription": "وصف SEO جذاب (150-160 حرف) يحفّز النقر",
  "isAiRelated": true,
  "suggestedCategory": "أحد هذه التصنيفات فقط: ai-models | research | companies | tools | policy",
  "slug": "english-slug-from-title-max-6-words",
  "featuredImagePrompt": "Vivid English prompt for image generation, describe the scene not the concept (max 20 words)",
  "faq": [
    { "question": "سؤال يطرحه قارئ فضولي؟", "answer": "إجابة مفيدة وواضحة في 2-3 جمل" },
    { "question": "سؤال ثانٍ عملي؟", "answer": "إجابة مباشرة" },
    { "question": "سؤال ثالث عن التداعيات؟", "answer": "إجابة تحليلية موجزة" },
    { "question": "سؤال رابع؟", "answer": "إجابة مفيدة" }
  ],
  "keywords": ["كلمة مفتاحية 1", "كلمة مفتاحية 2", "كلمة مفتاحية 3", "كلمة مفتاحية 4", "كلمة مفتاحية 5", "كلمة مفتاحية 6"],
  "imageAlt": "وصف دقيق وطبيعي للصورة بالعربية — كأنك تصفها لشخص لا يراها",
  "relatedTopics": ["موضوع ذي صلة 1", "موضوع ذي صلة 2", "موضوع ذي صلة 3"]
}
`.trim();

export async function processArticleWithAI(
  title: string,
  content: string,
  authorSlugHint?: AuthorSlug,
): Promise<AiProcessedArticle> {
  const client = getClient();

  // Use author-specific system prompt if provided, otherwise fallback
  const systemPrompt = authorSlugHint
    ? AUTHORS[authorSlugHint].systemPrompt
    : FALLBACK_SYSTEM_PROMPT;

  const response = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: USER_PROMPT_TEMPLATE(title, content) },
    ],
    temperature: 0.85,
    max_tokens: 3500,
  });

  const raw = response.choices[0]?.message?.content ?? "";

  const jsonText = raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();

  const parsed = JSON.parse(jsonText) as Partial<AiProcessedArticle>;

  const faq = Array.isArray(parsed.faq)
    ? parsed.faq
        .filter((f) => f && typeof f.question === "string" && typeof f.answer === "string")
        .slice(0, 5)
    : [];

  const suggestedCategory = parsed.suggestedCategory ?? "ai-models";
  // Determine final author: use hint if given, otherwise derive from category
  const finalAuthorSlug = authorSlugHint ?? pickAuthor(suggestedCategory);

  return {
    titleAr: parsed.titleAr ?? title,
    summaryAr: parsed.summaryAr ?? "",
    contentAr: parsed.contentAr ?? "",
    tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 10) : [],
    seoTitle: parsed.seoTitle ?? parsed.titleAr ?? title,
    seoDescription: parsed.seoDescription ?? parsed.summaryAr ?? "",
    suggestedCategory,
    slug: parsed.slug ?? "",
    featuredImagePrompt: parsed.featuredImagePrompt ?? "",
    faq,
    keywords: Array.isArray(parsed.keywords) ? parsed.keywords.slice(0, 10) : [],
    imageAlt: parsed.imageAlt ?? parsed.titleAr ?? title,
    relatedTopics: Array.isArray(parsed.relatedTopics) ? parsed.relatedTopics.slice(0, 5) : [],
    isAiRelated: parsed.isAiRelated !== false,
    authorSlug: finalAuthorSlug,
  };
}
