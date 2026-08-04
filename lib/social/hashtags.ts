/**
 * lib/social/hashtags.ts
 *
 * Deterministic, Arabic-first hashtag generation from real article data
 * (canonical tags + category) — no AI, no invented terms. Replaces the
 * old fully-static "#ذكاء_اصطناعي #AI" pair with tags that actually vary
 * per article, while staying bounded and free of duplicates/near-spam.
 *
 * Telegram Experience Sprint 5: priority order is product > company >
 * technology > category, so the sharpest, most-searched term always claims
 * a slot before the broadest one. There is no separate product/company
 * field on Review — tags[] is one flat array — so tags are split into
 * "named-entity" (Latin/mixed-script tokens like "GPT-5.6", "OpenAI",
 * "Perplexity": how product and company names actually appear in this
 * dataset) vs "descriptive" (Arabic technology/topic terms) using only the
 * tag's own script, never an invented lookup table.
 */

const MAX_HASHTAGS = 4;

/** Category slugs whose Arabic name is broad/generic enough that using it
 *  as a hashtag on every article in that category would read as spam
 *  rather than a genuine topical tag. Tags are still used normally. */
const GENERIC_CATEGORY_SLUGS = new Set(["companies", "applications"]);

/** #AI is only kept when the article is genuinely AI-model/tooling-specific —
 *  applying it to every single post (as the old static caption did) is the
 *  exact "hashtag spam" the sprint asks to avoid. */
const AI_RELEVANT_CATEGORY_SLUGS = new Set(["ai-models", "ai-tools", "ai-companies", "ai-policy"]);

export interface HashtagInput {
  tags: string[];
  categoryNameAr: string;
  categorySlug: string;
}

/** Strips spaces/punctuation the way a Telegram hashtag needs to (a hashtag
 *  is one unbroken token) — Arabic letters, digits, and underscores only. */
function toHashtagToken(raw: string): string | null {
  const normalized = raw
    .trim()
    .replace(/[\s\-]+/g, "_")
    .replace(/[^\p{L}\p{N}_]/gu, "");
  if (normalized.length < 2) return null;
  return `#${normalized}`;
}

/** A tag reads as a named product/company (e.g. "GPT-5.6", "OpenAI",
 *  "Perplexity") when it contains a Latin letter — real article tags in
 *  this dataset use Latin script exactly for product/company names and
 *  Arabic script for descriptive technology/topic terms, so this needs no
 *  separate taxonomy to stay accurate. */
function isNamedEntityTag(tag: string): boolean {
  return /[A-Za-z]/.test(tag);
}

export function buildHashtags(input: HashtagInput): string[] {
  const seen = new Set<string>();
  const hashtags: string[] = [];

  function tryAdd(raw: string): boolean {
    const token = toHashtagToken(raw);
    if (!token) return false;
    const key = token.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    hashtags.push(token);
    return hashtags.length >= MAX_HASHTAGS;
  }

  // Product/company tags first (named entities — Latin-script tags), then
  // technology/topic tags (Arabic-script) — both are real per-article data,
  // just ranked so the sharpest term wins a slot before the broader one.
  const namedEntityTags = input.tags.filter(isNamedEntityTag);
  const descriptiveTags = input.tags.filter((t) => !isNamedEntityTag(t));

  for (const tag of namedEntityTags) {
    if (hashtags.length >= MAX_HASHTAGS) break;
    tryAdd(tag);
  }
  for (const tag of descriptiveTags) {
    if (hashtags.length >= MAX_HASHTAGS) break;
    tryAdd(tag);
  }

  // Category last, unless it's one of the generic/broad categories where a
  // hashtag would add noise rather than a genuine topical signal.
  if (hashtags.length < MAX_HASHTAGS && !GENERIC_CATEGORY_SLUGS.has(input.categorySlug)) {
    tryAdd(input.categoryNameAr);
  }

  // #AI only when the category is itself AI-specific — preserves the old
  // "#AI" tag's intent without stamping it on every unrelated post.
  if (hashtags.length < MAX_HASHTAGS && AI_RELEVANT_CATEGORY_SLUGS.has(input.categorySlug)) {
    tryAdd("AI");
  }

  return hashtags.slice(0, MAX_HASHTAGS);
}
