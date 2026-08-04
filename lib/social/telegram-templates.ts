/**
 * lib/social/telegram-templates.ts
 *
 * Deterministic Telegram message templates for the Review content type
 * (Telegram Experience Sprint 2, expanded Sprint 5 — premium layout, CTA
 * rotation, company template). "Deterministic" means every decision here
 * — which template, which highlights, which hashtags, which CTA phrase —
 * is derived from fields that already exist on the Review row (category,
 * tags, content, sources, publishedAt, slug). Nothing here calls an LLM or
 * invents a fact not already present in the article.
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
  | "company"
  | "general";

const TEMPLATE_LABELS: Record<TelegramTemplateKind, string> = {
  breaking: "عاجل",
  guide: "دليل",
  comparison: "مقارنة",
  tool: "أداة",
  research: "تحليل وأبحاث",
  company: "الشركات",
  general: "خبر",
};

/** One emoji per template — the single section marker allowed in the
 *  rendered message (Sprint 5: "maximum one emoji section marker, no
 *  decorative emoji spam"). */
const TEMPLATE_ICONS: Record<TelegramTemplateKind, string> = {
  breaking: "🚨",
  guide: "📘",
  comparison: "⚖️",
  tool: "🛠",
  research: "📊",
  company: "🏢",
  general: "📰",
};

/**
 * A rotating pool of CTAs per template (Sprint 5 — CTA library expansion).
 * Selection is deterministic (see pickFromPool below), not random, so the
 * same review always renders the same CTA — but different reviews of the
 * same template spread across the pool instead of repeating one phrase on
 * every single post, which the Sprint 4 audit found happening in practice.
 */
const TEMPLATE_CTA_POOLS: Record<TelegramTemplateKind, string[]> = {
  breaking: ["اقرأ التفاصيل الكاملة", "القصة الكاملة هنا", "تابع آخر التطورات"],
  guide: ["اكتشف الدليل", "تعلّم الطريقة كاملة", "الدليل التفصيلي هنا"],
  comparison: ["شاهد المقارنة الكاملة", "أيهما يناسبك؟ قارن الآن", "النتيجة الكاملة هنا"],
  tool: ["تعرّف إلى الأداة", "جرّبها بنفسك", "كل التفاصيل هنا"],
  research: ["اقرأ التحليل", "الأرقام والنتائج كاملة", "التحليل المعمّق هنا"],
  company: ["اقرأ القصة كاملة", "ما الذي يعنيه هذا فعلاً؟", "التفاصيل والسياق هنا"],
  general: ["اقرأ التفاصيل الكاملة", "القصة الكاملة هنا", "كل التفاصيل هنا"],
};

/** Small stable string hash (djb2-style) — same input always yields the
 *  same output, used only to pick a deterministic index into a pool, never
 *  for anything security-sensitive. */
function stableHash(input: string): number {
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 33 + input.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function pickFromPool<T>(pool: readonly T[], seed: string): T {
  return pool[stableHash(seed) % pool.length];
}

/** A same-day article is treated as timely/breaking — the only "recency"
 *  signal that exists on the Review model (publishedAt) without inventing
 *  an urgency field the schema doesn't have. */
const BREAKING_FRESHNESS_MS = 24 * 60 * 60 * 1000;

/** Company/organization-strategy category slugs — both "companies" (general
 *  business/funding/leadership news) and "ai-companies" (the AI-specific
 *  seed category) route to the same 🏢 editorial identity; the audit found
 *  these stories (partnerships, funding, leadership moves) were folding
 *  into the generic "general" template with no distinct visual identity. */
const COMPANY_CATEGORY_SLUGS = new Set(["companies", "ai-companies"]);

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
  if (COMPANY_CATEGORY_SLUGS.has(review.category.slug)) return "company";

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
 *
 * Reading time is deliberately NOT included here (Sprint 5): the premium
 * layout gives it its own dedicated "📖 N دقائق قراءة" line below the fact
 * bullets rather than mixing it in as a bullet, so scanning the bullets and
 * clocking the time cost read as two distinct signals, not one list.
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
  templateIcon: string;
  headline: string;
  summary: string;
  highlights: string[];
  readingMinutes?: number;
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
  });

  const hashtagInput: HashtagInput = { tags: input.tags, categoryNameAr: input.category.nameAr, categorySlug: input.category.slug };
  const hashtags = buildHashtags(hashtagInput);

  // Seeded by slug (stable, unique per article) so the same review always
  // renders the same CTA — falls back to the headline when no slug exists
  // yet (e.g. admin preview of an unpublished draft) so the pick is still
  // deterministic rather than defaulting to index 0 every time.
  const ctaSeed = input.slug && input.slug.length > 0 ? input.slug : headline;
  const cta = pickFromPool(TEMPLATE_CTA_POOLS[template], ctaSeed);

  return {
    template,
    templateLabel: TEMPLATE_LABELS[template],
    templateIcon: TEMPLATE_ICONS[template],
    headline,
    summary,
    highlights,
    readingMinutes: input.readingMinutes,
    cta,
    hashtags,
  };
}

/** Visual divider opening/closing the message — the one structural device
 *  the premium layout uses to frame the post as a distinct editorial unit
 *  in a busy Telegram feed, per Sprint 5's premium caption layout spec. */
const DIVIDER = "━━━━━━━━━━━━━━";

/**
 * Renders the final escaped Telegram HTML body (everything except the
 * tracked URL, which the caller appends — matching how the provider already
 * strips/re-appends the URL). This is the ONE function production sending
 * and the admin preview both call, so a preview can never drift from what
 * actually gets sent.
 *
 * Premium layout (Sprint 5): divider → icon+label → bold headline → opening
 * line → bulleted facts → reading time → CTA → hashtags → divider. Every
 * blank line is intentional whitespace, not incidental — the goal is a
 * message that scans in under 3 seconds on a phone screen.
 */
export function renderTelegramMessage(parts: TelegramMessageParts): string {
  const lines: string[] = [];

  lines.push(DIVIDER);
  lines.push("");
  lines.push(`${parts.templateIcon} <b>${escapeTelegramHtml(parts.templateLabel)}</b>`);
  lines.push("");
  lines.push(`<b>${escapeTelegramHtml(parts.headline)}</b>`);
  lines.push("");
  lines.push(escapeTelegramHtml(parts.summary));

  if (parts.highlights.length > 0) {
    lines.push("");
    for (const h of parts.highlights) {
      lines.push(`• ${escapeTelegramHtml(h)}`);
    }
  }

  if (parts.readingMinutes && parts.readingMinutes > 0) {
    lines.push("");
    lines.push(`📖 ${parts.readingMinutes} ${parts.readingMinutes === 1 ? "دقيقة قراءة" : "دقائق قراءة"}`);
  }

  lines.push("");
  lines.push(`👉 ${escapeTelegramHtml(parts.cta)}`);

  if (parts.hashtags.length > 0) {
    lines.push("");
    lines.push(parts.hashtags.map((h) => escapeTelegramHtml(h)).join(" "));
  }

  lines.push("");
  lines.push(DIVIDER);

  return lines.join("\n");
}
