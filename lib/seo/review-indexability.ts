/**
 * lib/seo/review-indexability.ts
 *
 * Crawl-budget heuristic for news/review pages. A young, low-authority site
 * gets a small crawl budget; the pipeline produces hundreds of review articles,
 * most of which rank page-3 with zero traffic and never get crawled — while
 * starving the evergreen pages (tools, featured prompts) of crawl budget.
 *
 * This rule marks the clearly-dead long tail as non-indexable so it drops out
 * of the sitemap and carries `noindex`, concentrating crawl budget and link
 * equity on pages that can actually win. It is intentionally CONSERVATIVE:
 * a review must be BOTH old AND have never recorded a single view to be
 * dropped. Recent articles (news needs time to rank) and anything with any
 * traction at all stay indexable.
 *
 * Why so conservative: a 2026-10-22 cross-check of GSC against the DB showed
 * that reviews which actually earn Google impressions span every age (7–128
 * days) and all have low viewCounts, so an age- or low-view-threshold noindex
 * would deindex real performers. There is no safe DB signal for mass pruning —
 * the crawl-budget win is instead taken via sitemap reprioritisation (evergreen
 * > reviews) and footer internal linking. This rule only sheds the handful of
 * genuinely dead pages (old + zero views), which hit 0 GSC performers.
 *
 * Pure function, shared by the review page's `robots` and the sitemap so the
 * two never disagree (same pattern as the prompt-indexation experiment).
 */

/** A review older than this (days) with zero views is considered dead weight. */
export const DEAD_REVIEW_AGE_DAYS = 60;

export interface ReviewIndexSignal {
  publishedAt: Date | string | null | undefined;
  viewCount: number | null | undefined;
}

/** True if this review should be indexed (sitemap + robots index). */
export function isReviewIndexable({ publishedAt, viewCount }: ReviewIndexSignal): boolean {
  const views = viewCount ?? 0;
  if (views > 0) return true; // any traction → keep
  if (!publishedAt) return true; // unknown age → don't penalize
  const ageMs = Date.now() - new Date(publishedAt).getTime();
  const ageDays = ageMs / 86_400_000;
  // Dead only when BOTH old AND never viewed.
  return ageDays < DEAD_REVIEW_AGE_DAYS;
}
