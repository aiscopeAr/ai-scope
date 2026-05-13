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
};

const SYSTEM_PROMPT = `أنت صحفي ومحرر متخصص في أخبار الذكاء الاصطناعي والتقنية، تكتب لموقع إخباري عربي متميز. أسلوبك صحفي احترافي، تصيغ الأخبار بطريقة مستقلة وأصيلة للقارئ العربي — لا تترجم حرفياً بل تُعيد الكتابة والصياغة بأسلوبك الخاص مع الحفاظ على دقة المعلومات. أنت تعيد المحتوى بتنسيق JSON فقط، بدون أي نص خارج JSON.`;

const USER_PROMPT_TEMPLATE = (title: string, content: string) => `
بناءً على المعلومات الواردة في هذا الخبر التقني، اكتب كتابةً صحفية أصيلة بالعربية الفصحى كأنك محرر خبير — أعد صياغة الخبر بأسلوبك المستقل، أضف سياقاً وتحليلاً مختصراً، ولا تترجم الجمل حرفياً.

العنوان الأصلي:
${title}

المحتوى المرجعي:
${content.slice(0, 6000)}

أعد هذا JSON فقط (بدون markdown، بدون backticks):
{
  "titleAr": "عنوان صحفي جذاب بالعربية (موجز ومؤثر، لا يتجاوز 100 حرف)",
  "summaryAr": "مقدمة إخبارية 2-3 جمل تلخص أهمية الخبر للقارئ العربي",
  "contentAr": "كتابة صحفية أصيلة بالعربية (600 كلمة على الأقل) — بأسلوب مستقل، مقسمة لفقرات، تتضمن السياق والأهمية والتأثير المتوقع",
  "tags": ["وسم1", "وسم2", "وسم3", "وسم4"],
  "seoTitle": "عنوان SEO بالعربية (50-60 حرف)",
  "seoDescription": "وصف SEO جذاب بالعربية (150-160 حرف)",
  "suggestedCategory": "أحد هذه التصنيفات فقط: ai-models | research | companies | tools | policy",
  "slug": "english-slug-from-title-max-6-words",
  "featuredImagePrompt": "English prompt for image generation (20 words max)"
}
`.trim();

export async function processArticleWithAI(
  title: string,
  content: string,
): Promise<AiProcessedArticle> {
  const client = getClient();

  const response = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: USER_PROMPT_TEMPLATE(title, content) },
    ],
    temperature: 0.7,
    max_tokens: 2000,
  });

  const raw = response.choices[0]?.message?.content ?? "";

  // Strip any accidental markdown fences
  const jsonText = raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();

  const parsed = JSON.parse(jsonText) as Partial<AiProcessedArticle>;

  return {
    titleAr: parsed.titleAr ?? title,
    summaryAr: parsed.summaryAr ?? "",
    contentAr: parsed.contentAr ?? "",
    tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 10) : [],
    seoTitle: parsed.seoTitle ?? parsed.titleAr ?? title,
    seoDescription: parsed.seoDescription ?? parsed.summaryAr ?? "",
    suggestedCategory: parsed.suggestedCategory ?? "ai-models",
    slug: parsed.slug ?? "",
    featuredImagePrompt: parsed.featuredImagePrompt ?? "",
  };
}
