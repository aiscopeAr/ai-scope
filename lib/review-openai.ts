import OpenAI from "openai";
import { AUTHORS, pickAuthor, type AuthorSlug } from "@/lib/authors";
import { findSimilarReviews, type SimilarReview } from "@/lib/embeddings";
import { getAuthorMemoryBlock } from "@/lib/author-memory";

let _client: OpenAI | null = null;
function getClient(): OpenAI {
  if (!_client) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("OPENAI_API_KEY is not set");
    _client = new OpenAI({ apiKey });
  }
  return _client;
}

export type FaqItem = { question: string; answer: string };

export type ReviewDraft = {
  titleAr: string;
  summaryAr: string;
  contentAr: string;       // Markdown, 1500–3000 words
  tags: string[];
  keywords: string[];
  faq: FaqItem[];
  imageAlt: string;
  seoTitle: string;
  seoDescription: string;
  suggestedCategory: string;
  slug: string;
  featuredImagePrompt: string;
  authorSlug: AuthorSlug;
  isAiRelated: boolean;
};

// ─── Prompts ──────────────────────────────────────────────────────────────────

function buildMemoryBlock(pastReviews: SimilarReview[]): string {
  if (pastReviews.length === 0) return "";
  const lines = pastReviews.map(
    (r, i) =>
      `[${i + 1}] "${r.titleAr}" (${r.publishedAt?.toISOString().slice(0, 10) ?? "غير معروف"})\n${r.summary}`,
  );
  return `\n\n─── ذاكرة الكاتب: تقارير سابقة ذات صلة ───\n${lines.join("\n\n")}\n────────────────────────────────────────────\n\nإذا كان هناك صلة حقيقية بكتاباتك السابقة، أشر إليها صراحةً في المقال. مثلاً: "كما أشرت في تحليلي السابق عن...". لا تختلق صلات غير موجودة.`;
}

function buildUserPrompt(
  sources: Array<{ title: string; content: string; url: string; name: string }>,
  memoryBlock: string,
): string {
  // Limit each source to 2000 chars to stay well under the 30k TPM limit
  const MAX_SOURCE_CHARS = 2000;
  const sourcesText = sources
    .map((s, i) => {
      const body = s.content.length > MAX_SOURCE_CHARS
        ? s.content.slice(0, MAX_SOURCE_CHARS) + "…"
        : s.content;
      return `## مصدر ${i + 1}: ${s.name}\nالعنوان: ${s.title}\nURL: ${s.url}\n\n${body}`;
    })
    .join("\n\n---\n\n");

  return `إليك ${sources.length} مصدر حول نفس الموضوع. مهمتك: اكتب تقريراً عربياً أصيلاً ومعمّقاً — لا تلخيصاً، بل تحليلاً حقيقياً بصوت الكاتب.${memoryBlock}

─── المصادر ───
${sourcesText}
───────────────

تعليمات المحتوى:
- العنوان: زاوية تحليلية، ليس عنوان خبر. اطرح السؤال الأعمق وراء الحدث.
- المقدمة (summaryAr): 3 جمل تضع القارئ في قلب الأهمية الحقيقية للموضوع.
- المحتوى (contentAr): **لا تقل عن 1200 كلمة** — الهدف 1500–2500 كلمة بتنسيق Markdown. كتابة قصيرة = فشل. بنيّة مقترحة:
  • ## السياق — لماذا هذا الموضوع مهم الآن؟ (200–300 كلمة)
  • ## التفاصيل — الحقائق والأرقام من المصادر (300–400 كلمة)
  • ## التحليل — ماذا يعني هذا فعلاً؟ من يستفيد؟ من يخسر؟ (300–400 كلمة)
  • ## المقارنة (إن وُجدت) — كيف يقارن بما سبق؟ (150–200 كلمة)
  • ## التداعيات — ماذا يحدث بعد ذلك؟ ما الذي يجب متابعته؟ (200–300 كلمة)
- الـ FAQ: 4–5 أسئلة حقيقية يطرحها قارئ متخصص.
- الكلمات المفتاحية: مصطلحات تقنية دقيقة، ليست عامة.

أعد JSON فقط (بدون markdown، بدون backticks):
{
  "titleAr": "عنوان تحليلي يعكس الزاوية الأعمق (أقل من 90 حرفاً)",
  "summaryAr": "3 جمل تستدرج القارئ المتخصص — تبدأ بالأهمية لا بالخبر",
  "contentAr": "التقرير الكامل بتنسيق Markdown — لا تقل عن 1200 كلمة، الهدف 1500–2500 كلمة",
  "tags": ["وسم1", "وسم2", "وسم3", "وسم4", "وسم5"],
  "keywords": ["مصطلح تقني 1", "مصطلح 2", "مصطلح 3", "مصطلح 4", "مصطلح 5", "مصطلح 6"],
  "seoTitle": "عنوان SEO (50-60 حرف)",
  "seoDescription": "وصف SEO يحفّز النقر (150-160 حرف)",
  "isAiRelated": true,
  "suggestedCategory": "ai-models | research | companies | tools | tools-analysis | productivity | policy | tutorials",
  "slug": "english-slug-max-6-words",
  "featuredImagePrompt": "Vivid English scene description for image generation (max 20 words)",
  "faq": [
    { "question": "سؤال تخصصي؟", "answer": "إجابة تحليلية 2-3 جمل" },
    { "question": "سؤال؟", "answer": "إجابة" },
    { "question": "سؤال؟", "answer": "إجابة" },
    { "question": "سؤال؟", "answer": "إجابة" }
  ],
  "imageAlt": "وصف دقيق للصورة المقترحة"
}`.trim();
}

// ─── Main function ─────────────────────────────────────────────────────────

export async function writeReview(
  topic: string,
  sources: Array<{ title: string; content: string; url: string; name: string }>,
  authorSlugHint?: AuthorSlug,
): Promise<ReviewDraft> {
  const client = getClient();

  // Determine author from hint or preliminary topic analysis
  const prelimCategory = authorSlugHint ? null : guessCategoryFromTopic(topic);
  const authorSlug = authorSlugHint ?? pickAuthor(prelimCategory ?? "ai-models");
  const author = AUTHORS[authorSlug];

  // Retrieve author's past relevant reviews as memory context
  let pastReviews: SimilarReview[] = [];
  try {
    pastReviews = await findSimilarReviews(topic, authorSlug, 4);
  } catch {
    // pgvector not yet available or no embeddings — proceed without memory
  }

  // שלוף גם את הזיכרון המצטבר של הכותב (נושאי מומחיות, עמדות, סגנון)
  let accumulatedMemory = "";
  try {
    accumulatedMemory = await getAuthorMemoryBlock(authorSlug, topic);
  } catch {
    // memory block is best-effort
  }

  const memoryBlock = buildMemoryBlock(pastReviews) + accumulatedMemory;
  const userPrompt = buildUserPrompt(sources, memoryBlock);

  const response = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL ?? "gpt-4o",
    messages: [
      { role: "system", content: author.systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.8,
    max_tokens: 12000,
  });

  const raw = response.choices[0]?.message?.content ?? "";
  const jsonText = raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();

  const parsed = JSON.parse(jsonText) as Partial<ReviewDraft>;

  const faq: FaqItem[] = Array.isArray(parsed.faq)
    ? parsed.faq
        .filter((f) => f && typeof f.question === "string" && typeof f.answer === "string")
        .slice(0, 5)
    : [];

  const suggestedCategory = parsed.suggestedCategory ?? "ai-models";
  const finalAuthorSlug = authorSlugHint ?? pickAuthor(suggestedCategory);

  return {
    titleAr: parsed.titleAr ?? topic,
    summaryAr: parsed.summaryAr ?? "",
    contentAr: parsed.contentAr ?? "",
    tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 8) : [],
    keywords: Array.isArray(parsed.keywords) ? parsed.keywords.slice(0, 10) : [],
    faq,
    imageAlt: parsed.imageAlt ?? parsed.titleAr ?? topic,
    seoTitle: parsed.seoTitle ?? parsed.titleAr ?? topic,
    seoDescription: parsed.seoDescription ?? parsed.summaryAr ?? "",
    suggestedCategory,
    slug: parsed.slug ?? "",
    featuredImagePrompt: parsed.featuredImagePrompt ?? "",
    authorSlug: finalAuthorSlug,
    isAiRelated: parsed.isAiRelated !== false,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function guessCategoryFromTopic(topic: string): string {
  const t = topic.toLowerCase();
  // Tutorial/guide — highest priority: "how to", "guide", "شرح", "دليل", "كيف", specific evergreen tools
  if (/how.?to|guide|tutorial|step.by.step|beginner|دليل|شرح|كيف\s|خطوة|مبتدئ|تعلم|استخدام|للمبتدئين|canva|midjourney|magnific|freepik|cursor ai|perplexity|notion ai/.test(t)) return "tutorials";
  if (/law|regulation|policy|eu|act|ban|govern|safety|alignment/.test(t)) return "policy";
  if (/openai|google|meta|anthropic|apple|microsoft|startup|funding|investment/.test(t)) return "companies";
  if (/gpt|claude|gemini|llama|mistral|model|benchmark|release|version/.test(t)) return "ai-models";
  if (/research|paper|arxiv|study|published|university|lab/.test(t)) return "research";
  if (/review|vs|compare|pricing|free|tier|tool|app|product|launch|feature|plugin|workflow|productivity/.test(t)) return "tools-analysis";
  if (/api|integration|sdk|developer/.test(t)) return "tools";
  return "ai-models";
}
