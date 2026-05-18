export type SocialPlatform =
  | "twitter"
  | "instagram"
  | "telegram"
  | "facebook"
  | "tiktok";

export interface SocialPostPayload {
  caption: string;
  imageUrl?: string;
  articleUrl: string;
}

export interface SocialProvider {
  platform: SocialPlatform;
  send(payload: SocialPostPayload, credentials: Record<string, string>): Promise<{ id: string }>;
}

export interface PostResult {
  success: boolean;
  externalId?: string;
  error?: string;
}

// Caption style hints per platform — used by AI generator
export const PLATFORM_HINTS: Record<SocialPlatform, { maxChars: number; style: string; hashtagCount: number }> = {
  twitter: {
    maxChars: 250,
    style: "قصير ومباشر، hook قوي في السطر الأول، لهجة عصرية",
    hashtagCount: 3,
  },
  instagram: {
    maxChars: 800,
    style: "جذاب مع emoji، سرد قصير، call to action في النهاية",
    hashtagCount: 10,
  },
  telegram: {
    maxChars: 500,
    style: "إخباري مباشر، ملخص الخبر في 2-3 أسطر، رابط في النهاية",
    hashtagCount: 3,
  },
  facebook: {
    maxChars: 400,
    style: "ودود ومشجع على التفاعل، سؤال في النهاية لزيادة التعليقات",
    hashtagCount: 5,
  },
  tiktok: {
    maxChars: 150,
    style: "hook مثير في السطر الأول، نص قصير جداً، emoji كثيرة",
    hashtagCount: 5,
  },
};
