/**
 * lib/social/telegram-message.ts
 *
 * The single function both production drafting (lib/review-queue.ts) and
 * the admin preview endpoint call to build a Review's Telegram message.
 * This is intentionally the only place that turns "a Review row" into
 * "a rendered Telegram HTML body" — the admin preview and the real send
 * path share this function call-for-call, so a preview can never show
 * something different from what actually gets sent.
 */
import { buildTelegramMessageParts, renderTelegramMessage, type TelegramMessageParts, type TelegramTemplateKind } from "./telegram-templates";

export interface ReviewForTelegramMessage {
  titleAr: string;
  summary: string;
  content: string;
  tags: string[];
  category: { slug: string; nameAr: string };
  publishedAt: Date | null;
  sources: Array<{ name: string }>;
  slug?: string;
}

export interface TelegramMessageResult {
  template: TelegramTemplateKind;
  templateLabel: string;
  /** The final, escaped HTML body — everything except the tracked URL,
   *  which the provider appends (matching its existing URL-stripping logic). */
  body: string;
  hashtags: string[];
  /** The unrendered slots this body was built from — exposed only for
   *  diagnostics (e.g. the admin preview's internal editorial score); the
   *  send path only ever uses `body`. */
  parts: TelegramMessageParts;
}

/** Exported so the OG image (app/(main)/reviews/[slug]/opengraph-image.tsx)
 *  can show the same reading-time number as the Telegram post for the same
 *  article, instead of a second, possibly-divergent computation. */
export function estimateReadingMinutes(content: string): number {
  const wordCount = content.trim().length === 0 ? 0 : content.trim().split(/\s+/).length;
  return wordCount > 0 ? Math.max(1, Math.round(wordCount / 200)) : 0;
}

export function buildReviewTelegramMessage(review: ReviewForTelegramMessage): TelegramMessageResult {
  const parts = buildTelegramMessageParts({
    titleAr: review.titleAr,
    summary: review.summary,
    content: review.content,
    tags: review.tags,
    category: review.category,
    publishedAt: review.publishedAt,
    sources: review.sources,
    readingMinutes: estimateReadingMinutes(review.content),
    slug: review.slug,
  });

  return {
    template: parts.template,
    templateLabel: parts.templateLabel,
    body: renderTelegramMessage(parts),
    hashtags: parts.hashtags,
    parts,
  };
}
