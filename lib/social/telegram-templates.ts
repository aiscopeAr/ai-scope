/**
 * lib/social/telegram-templates.ts
 *
 * Deterministic Telegram message templates for the Review content type
 * (Telegram Experience Sprint 2). "Deterministic" means every decision here
 * — which template, which highlights, which hashtags — is derived from
 * fields that already exist on the Review row (category, tags, content,
 * sources, publishedAt). Nothing here calls an LLM or invents a fact not
 * already present in the article.
 *
 * This module owns *composition* (which template, what goes in each slot).
 * lib/social/telegram-format.ts still owns the one thing that must never
 * drift: HTML escaping + the parse_mode: "HTML" contract.
 */
import { escapeTelegramHtml, truncateSummary } from "./telegram-format";
import { buildHashtags, type HashtagInput } from "./hashtags";

export type TelegramTemplateKind =
  | "breaking"
  | "guide"
  | "comparison"
  | "tool"
  | "research"
  | "general";

const TEMPLATE_LABELS: Record<TelegramTemplateKind, string> = {
  breaking: "عاجل",
  guide: "دليل",
  comparison: "مقارنة",
  tool: "أداة",
  research: "تحليل وأبحاث",
  general: "خبر",
};

const TEMPLATE_CTAS: Record<TelegramTemplateKind, string> = {
  breaking: "اقرأ التفاصيل الكاملة",
  guide: "اكتشف الدليل",
  comparison: "شاهد المقارنة الكاملة",
  tool: "تعرّف إلى الأداة",
  research: "اقرأ التحليل",
  general: "اقرأ التفاصيل الكاملة",
};

/** A same-day article is treated as timely/breaking — the only "recency"
 *  signal that exists on the Review model (publishedAt) without inventing
 *  an urgency field the schema doesn't have. */
const BREAKING_FRESHNESS_MS = 24 * 60 * 60 * 1000;

export interface ClassifiableReview {
  titleAr: string;
  content: string;
  tags: string[];
  category: { slug: string; nameAr: string };
  publishedAt: Date | null;
}

const GUIDE_TITLE_PATTERN = /^(كيف|ما هو|ما هي|دليل|شرح|طريقة)/;
const GUIDE_SLUG_HINT = /\b(how-to|guide|what-is)\b/i;

/**
 * Classifies a review into exactly one template, checked in a fixed
 * priority order so the result is stable and reproducible for the same
 * input. Priority: explicit editorial signal ([[compare:]]/[[tool:]] tokens,
 * category) before weaker signals (title phrasing), and recency last since
 * it's the least specific signal.
 */
export function classifyReviewTemplate(review: ClassifiableReview, slug?: string): TelegramTemplateKind {
  const hasCompareLink = /\[\[compare:/.test(review.content);
  const hasToolLink = /\[\[tool:/.test(review.content);

  if (hasCompareLink) return "comparison";
  if (review.category.slug === "tutorials") return "guide";
  if (hasToolLink || review.category.slug === "ai-tools") return "tool";
  if (review.category.slug === "research") return "research";

  if (GUIDE_TITLE_PATTERN.test(review.titleAr.trim()) || (slug && GUIDE_SLUG_HINT.test(slug))) {
    return "guide";
  }

  if (review.publishedAt && Date.now() - review.publishedAt.getTime() <= BREAKING_FRESHNESS_MS) {
    return "breaking";
  }

  return "general";
}

export interface ReviewHighlightSource {
  category: { nameAr: string };
  tags: string[];
  sources: Array<{ name: string }>;
  readingMinutes?: number;
}

/**
 * Up to 3 factual highlights, built only from fields that already exist —
 * never invented. Each highlight is independently optional; if a review has
 * none of these signals, the highlights block is simply omitted by the
 * caller (an empty array), never padded with filler.
 */
export function buildHighlights(review: ReviewHighlightSource): string[] {
  const highlights: string[] = [];

  const uniqueSourceNames = [...new Set(review.sources.map((s) => s.name).filter(Boolean))];
  if (uniqueSourceNames.length > 0) {
    highlights.push(
      uniqueSourceNames.length === 1
        ? `مبني على مصدر: ${uniqueSourceNames[0]}`
        : `مبني على ${uniqueSourceNames.length} مصادر موثوقة`,
    );
  }

  if (review.category.nameAr) {
    highlights.push(`التصنيف: ${review.category.nameAr}`);
  }

  if (review.readingMinutes && review.readingMinutes > 0) {
    highlights.push(`${review.readingMinutes} دقائق قراءة`);
  }

  return highlights.slice(0, 3);
}

export interface BuildTelegramMessageInput {
  titleAr: string;
  summary: string;
  content: string;
  tags: string[];
  category: { slug: string; nameAr: string };
  publishedAt: Date | null;
  sources: Array<{ name: string }>;
  readingMinutes?: number;
  slug?: string;
  /** Injected for tests / determinism — defaults to classifyReviewTemplate's own logic. */
  forcedTemplate?: TelegramTemplateKind;
}

export interface TelegramMessageParts {
  template: TelegramTemplateKind;
  templateLabel: string;
  headline: string;
  summary: string;
  highlights: string[];
  cta: string;
  hashtags: string[];
}

const MAX_HEADLINE_CHARS = 90;

/**
 * Builds every slot of the message (template classification, headline,
 * summary, highlights, CTA, hashtags) without touching HTML escaping or
 * the final URL — those stay in buildTelegramCaption()/the provider so
 * there's exactly one place that assembles escaped, Telegram-safe text.
 */
export function buildTelegramMessageParts(input: BuildTelegramMessageInput): TelegramMessageParts {
  const template = input.forcedTemplate ?? classifyReviewTemplate(
    { titleAr: input.titleAr, content: input.content, tags: input.tags, category: input.category, publishedAt: input.publishedAt },
    input.slug,
  );

  const headline = input.titleAr.length > MAX_HEADLINE_CHARS
    ? input.titleAr.slice(0, MAX_HEADLINE_CHARS - 1).trimEnd() + "…"
    : input.titleAr;

  const summary = truncateSummary(input.summary);

  const highlights = buildHighlights({
    category: input.category,
    tags: input.tags,
    sources: input.sources,
    readingMinutes: input.readingMinutes,
  });

  const hashtagInput: HashtagInput = { tags: input.tags, categoryNameAr: input.category.nameAr, categorySlug: input.category.slug };
  const hashtags = buildHashtags(hashtagInput);

  return {
    template,
    templateLabel: TEMPLATE_LABELS[template],
    headline,
    summary,
    highlights,
    cta: TEMPLATE_CTAS[template],
    hashtags,
  };
}

/**
 * Renders the final escaped Telegram HTML body (everything except the
 * tracked URL, which the caller appends — matching how the provider already
 * strips/re-appends the URL). This is the ONE function production sending
 * and the admin preview both call, so a preview can never drift from what
 * actually gets sent.
 */
export function renderTelegramMessage(parts: TelegramMessageParts): string {
  const lines: string[] = [];

  lines.push(`<b>[${escapeTelegramHtml(parts.templateLabel)}]</b> <b>${escapeTelegramHtml(parts.headline)}</b>`);
  lines.push("");
  lines.push(escapeTelegramHtml(parts.summary));

  if (parts.highlights.length > 0) {
    lines.push("");
    for (const h of parts.highlights) {
      lines.push(`▪️ ${escapeTelegramHtml(h)}`);
    }
  }

  lines.push("");
  lines.push(`👉 ${escapeTelegramHtml(parts.cta)}`);

  if (parts.hashtags.length > 0) {
    lines.push("");
    lines.push(parts.hashtags.map((h) => escapeTelegramHtml(h)).join(" "));
  }

  return lines.join("\n");
}
