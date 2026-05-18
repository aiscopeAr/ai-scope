import OpenAI from "openai";
import { PLATFORM_HINTS, type SocialPlatform } from "./types";

let _client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!_client) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("OPENAI_API_KEY is not set");
    _client = new OpenAI({ apiKey });
  }
  return _client;
}

interface ArticleData {
  titleAr: string;
  excerpt?: string | null;
  contentAr: string;
  sourceName: string;
  tags: string[];
}

export async function generateCaption(
  article: ArticleData,
  platform: SocialPlatform
): Promise<string> {
  const hints = PLATFORM_HINTS[platform];

  const prompt = `أنت متخصص في إدارة السوشيال ميديا لمنصة أخبار الذكاء الاصطناعي باللغة العربية.

اكتب منشوراً لـ${platform} عن هذه المقالة:

العنوان: ${article.titleAr}
الملخص: ${article.excerpt ?? article.contentAr.slice(0, 300)}
المصدر: ${article.sourceName}
الكلمات المفتاحية: ${article.tags.join(", ")}

متطلبات المنشور:
- الأسلوب: ${hints.style}
- الحد الأقصى للحروف: ${hints.maxChars} حرف
- أضف ${hints.hashtagCount} هاشتاق ذات صلة باللغتين العربية والإنجليزية
- لا تضع رابط المقال (سيُضاف تلقائياً)
- اكتب المنشور فقط بدون أي شرح إضافي`;

  const response = await getClient().chat.completions.create({
    model: "gpt-4o-mini",
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.choices[0]?.message?.content ?? "";
  return text.trim().slice(0, hints.maxChars);
}

export async function generateAllCaptions(
  article: ArticleData,
  platforms: SocialPlatform[]
): Promise<Record<SocialPlatform, string>> {
  const results = await Promise.all(
    platforms.map(async (platform) => {
      const caption = await generateCaption(article, platform);
      return [platform, caption] as [SocialPlatform, string];
    })
  );

  return Object.fromEntries(results) as Record<SocialPlatform, string>;
}
