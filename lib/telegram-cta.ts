/**
 * lib/telegram-cta.ts
 *
 * Single place defining the Telegram channel URL and the click-tracking
 * event name used by every on-site "join our Telegram channel" CTA — so
 * the Footer banner and the Review-page banner both report the same event
 * shape instead of each inventing their own, and a future CTA placement
 * reuses this rather than hardcoding the channel URL again.
 */
export const TELEGRAM_CHANNEL_URL = "https://t.me/lumiq_news";

export const TELEGRAM_CTA_CLICK_EVENT = "telegram_cta_click";

export type TelegramCtaPlacement = "footer" | "review_article";

export interface TelegramCtaClickPayload {
  placement: TelegramCtaPlacement;
}
