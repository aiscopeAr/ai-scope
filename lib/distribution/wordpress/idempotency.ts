/**
 * lib/distribution/wordpress/idempotency.ts
 *
 * Deterministic idempotency support for WordPress publishing, ahead of any
 * real persistence. This module defines *what marker* future orchestration
 * (Sprint 4's DistributionTask + queue) should use to detect "this content
 * was already published to this WordPress target" — it does not itself
 * check a database or prevent a duplicate post, since no persistence layer
 * exists yet in this sprint.
 *
 * Why not rely on slug uniqueness: editors may rename a Review's slug
 * after it was already syndicated (the existing SyndicationPost model
 * already avoids keying on slug for exactly this reason — it keys on
 * `(reviewId, target)`). WordPress's own slug deduping (appending -2, -3,
 * ...) also means two different Lumiq articles could theoretically
 * collide into visually similar slugs, and a renamed article must not
 * silently look like a "new" one. The strategy below is independent of
 * slug entirely.
 */

/**
 * The idempotency key strategy: a deterministic marker derived from the
 * *source content's stable identity* (its canonical Lumiq URL, which does
 * not change even if the on-site slug does — see lib/seo.ts's
 * absoluteUrl/Review.slug for how that URL is built) plus the target's
 * id. Two future DistributionTasks for the same (contentId, targetId)
 * pair must always produce the same key.
 *
 * Sprint 4's queue is expected to:
 *   1. Before creating a new DistributionTask, look for an existing task
 *      with the same idempotencyKey whose status is "published" (or
 *      "pending"/"sending", to avoid a second concurrent attempt) and
 *      skip creation if found — mirroring how lib/wordpress.ts already
 *      does this today via SyndicationPost's `@@unique([reviewId, target])`.
 *   2. Store `sourceUrl` (see WordPressFormattedBody.sourceUrl) as
 *      metadata on the WordPress post itself is NOT required for the key
 *      to work — the key is computed purely from Lumiq-side identifiers,
 *      not by querying WordPress for a matching post. This avoids a
 *      "list posts and search for a matching backlink" round-trip on
 *      every publish attempt, which would be slow and fragile against
 *      pagination/rate limits.
 */
export function buildWordPressIdempotencyKey(contentId: string, targetId: string): string {
  return `wordpress:${targetId}:${contentId}`;
}

/**
 * Parses a key produced by buildWordPressIdempotencyKey back into its
 * parts. Returns null for a key that doesn't match the expected shape —
 * used only for diagnostics/tests, never on a hot path.
 */
export function parseWordPressIdempotencyKey(key: string): { targetId: string; contentId: string } | null {
  const match = /^wordpress:([^:]+):(.+)$/.exec(key);
  if (!match) return null;
  return { targetId: match[1], contentId: match[2] };
}
