/**
 * lib/tags.ts
 * Normalizes free-text Arabic tags so near-duplicates count as one canonical
 * tag instead of splintering into separate near-empty pages.
 *
 * Normalization is READ-TIME only (no DB migration): every surface that groups,
 * matches, links, or lists tags (buildTagSummaries, reviewHasTag, tagToSlug,
 * the tag page, the sitemap) routes through normalizeTag(), so a variant folds
 * into its canonical everywhere at once and a future alias is a one-line change.
 *
 * Layers, applied in order inside normalizeTag():
 *   1. base normalize — trim, "_" → space, collapse whitespace, strip ONE
 *      leading definite article "ال".
 *   2. brand casing — case-insensitive Latin brand aliases (e.g. Nvidia→NVIDIA).
 *   3. explicit alias map — semantically/morphologically identical Arabic
 *      variants, each vetted against real reviews (see docs/sitemap-tags-fixes.md).
 * Every alias TARGET is stable under base-normalize (idempotent), so applying
 * normalizeTag twice yields the same result.
 */

const MIN_REVIEWS_FOR_TAG_PAGE = 3;

/** trim, underscores→spaces, collapse whitespace, strip a single leading "ال". */
function baseNormalize(tag: string): string {
  return tag
    .trim()
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .replace(/^ال/, "")
    .trim();
}

/** Latin brand aliases, matched case-insensitively on the base-normalized form. */
const LATIN_BRAND_ALIASES = new Map<string, string>([
  ["nvidia", "NVIDIA"],
]);

/**
 * Arabic variant → canonical map. Keys are already base-normalized forms.
 * Only morphological / verified-synonym merges — NOT semantic-narrowing merges
 * (e.g. "أنظمة الحماية"→"أمن سيبراني" and "الشركات"→"الشركات الكبرى" are
 * deliberately NOT here; see docs/sitemap-tags-fixes.md for the rationale).
 */
const TAG_ALIASES = new Map<string, string>([
  // AI (underscore/space + definite-article variants). "الذكاء الاصطناعي" and
  // "الذكاء_الاصطناعي" already base-normalize to the canonical "ذكاء الاصطناعي";
  // this catches the article-less spelling.
  ["ذكاء اصطناعي", "ذكاء الاصطناعي"],
  // Cybersecurity — morphological (السيبراني ↔ سيبراني). "الأمن السيبراني"
  // base-normalizes to "أمن السيبراني", which this folds into "أمن سيبراني".
  ["أمن السيبراني", "أمن سيبراني"],
  // Language models / LLMs — one canonical for the whole verified cluster.
  // "النماذج اللغوية" (29 reviews: 25 ai-models + LLM-topic companies/ai-tools,
  // all verified LLM content) base-normalizes to "نماذج اللغوية".
  ["نماذج اللغة", "نماذج لغوية"],
  ["نماذج اللغة الكبيرة", "نماذج لغوية"],
  ["نماذج لغوية كبيرة", "نماذج لغوية"],
  ["نماذج اللغوية", "نماذج لغوية"],
]);

/** Canonical form used for grouping and matching. */
export function normalizeTag(tag: string): string {
  const base = baseNormalize(tag);
  if (!base) return base;
  const latin = LATIN_BRAND_ALIASES.get(base.toLowerCase());
  if (latin) return latin;
  return TAG_ALIASES.get(base) ?? base;
}

/** URL-safe slug for a tag — canonical Arabic text; encodeURIComponent handles it in the path. */
export function tagToSlug(tag: string): string {
  return encodeURIComponent(normalizeTag(tag));
}

export function slugToTag(slug: string): string {
  return decodeURIComponent(slug);
}

export interface TagSummary {
  /** display label — the most common raw spelling of this canonical tag */
  label: string;
  /** canonical (normalized) form, used for matching against review.tags */
  canonical: string;
  count: number;
}

/**
 * Groups raw tags (as stored per-review) into canonical tag summaries,
 * picking the most frequent raw spelling as the display label.
 * Filters out internal "__author:" tags and anything below the visibility threshold.
 */
export function buildTagSummaries(allReviewTags: string[][]): TagSummary[] {
  const rawCounts = new Map<string, number>();       // canonical -> total occurrences
  const spellingCounts = new Map<string, Map<string, number>>(); // canonical -> (raw spelling -> count)

  for (const tags of allReviewTags) {
    for (const raw of tags) {
      if (raw.startsWith("__author:")) continue;
      const canonical = normalizeTag(raw);
      if (!canonical) continue;

      rawCounts.set(canonical, (rawCounts.get(canonical) ?? 0) + 1);

      if (!spellingCounts.has(canonical)) spellingCounts.set(canonical, new Map());
      const spellings = spellingCounts.get(canonical)!;
      spellings.set(raw, (spellings.get(raw) ?? 0) + 1);
    }
  }

  const summaries: TagSummary[] = [];
  for (const [canonical, count] of rawCounts) {
    if (count < MIN_REVIEWS_FOR_TAG_PAGE) continue;
    const spellings = spellingCounts.get(canonical)!;
    const label = [...spellings.entries()].sort((a, b) => b[1] - a[1])[0][0];
    summaries.push({ label, canonical, count });
  }

  return summaries.sort((a, b) => b.count - a.count);
}

/** Matches a review's raw tags against a canonical tag (handles all normalized variants). */
export function reviewHasTag(reviewTags: string[], canonicalTag: string): boolean {
  return reviewTags.some((t) => normalizeTag(t) === canonicalTag);
}
