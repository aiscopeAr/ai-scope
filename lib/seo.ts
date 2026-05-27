export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "https://lumiq.news";

export const SITE_NAME = "Lumiq";
export const SITE_NAME_AR = "لوميك";
export const SITE_DESCRIPTION_AR =
  "أحدث أخبار وتطورات الذكاء الاصطناعي باللغة العربية — نماذج AI، الأبحاث، الشركات التقنية";
export const SITE_TWITTER_HANDLE = "@lumiq_news";

export function buildTitle(pageTitle: string): string {
  return `${pageTitle} | ${SITE_NAME}`;
}

export function buildArticleTitle(titleAr: string): string {
  return `${titleAr} | ${SITE_NAME_AR}`;
}

export function truncate(text: string, maxLen = 160): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen - 1).trimEnd() + "…";
}

export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
