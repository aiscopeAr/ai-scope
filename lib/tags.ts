/**
 * lib/tags.ts
 * Normalizes free-text Arabic tags so near-duplicates (with/without the
 * definite article "ال", or plural/singular AI-generated variants) count
 * as the same tag instead of splintering into separate near-empty pages.
 */

const MIN_REVIEWS_FOR_TAG_PAGE = 3;

/** Canonical form used for grouping — strips a leading "ال" and trims whitespace. */
export function normalizeTag(tag: string): string {
  return tag.trim().replace(/^ال/, "");
}

/** URL-safe slug for a tag — Arabic text is kept as-is; Next.js/encodeURIComponent handles it in the path. */
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

/** Matches a review's raw tags against a canonical tag (i.e. handles the "ال" variants). */
export function reviewHasTag(reviewTags: string[], canonicalTag: string): boolean {
  return reviewTags.some((t) => normalizeTag(t) === canonicalTag);
}
