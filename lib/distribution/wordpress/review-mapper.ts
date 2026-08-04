/**
 * lib/distribution/wordpress/review-mapper.ts
 *
 * Pure Review → DistributableContent mapper. Derives every field only from
 * data already present on a Review row — no AI rewrite, no invented facts,
 * no Prisma call inside this function. The caller (task-creation code, a
 * future queue) is responsible for fetching the Review and passing its
 * fields in; this module only reshapes what it's given.
 *
 * Kept in lib/distribution/wordpress/ (not the generic lib/distribution/)
 * because "Review" is a Lumiq-specific content model the engine core has
 * no knowledge of — a future content type would get its own mapper file,
 * not a change to this one.
 */

import type { DistributableContent } from "../formatter";
import { absoluteUrl } from "@/lib/seo";

/** Minimal shape this mapper reads from — deliberately narrower than the
 *  full Prisma Review model so callers can pass a `select`-scoped query
 *  result instead of the whole row, and so this file has no import-time
 *  dependency on @prisma/client. */
export interface ReviewMapperInput {
  id: string;
  titleAr: string;
  content: string;
  summary: string;
  slug: string;
  imageUrl: string | null;
  tags: string[];
  publishedAt: Date | null;
  category: {
    slug: string;
    nameAr: string;
  };
  sources: unknown; // Review.sources is a Prisma Json field — see mapSources below
}

interface ReviewSourceEntry {
  title?: string;
  url?: string;
  name?: string;
}

/** Review.sources is stored as loosely-typed Json ([{title, url, name}]) —
 *  this narrows it defensively without assuming a shape the DB doesn't
 *  actually guarantee. Malformed entries are dropped, never invented. */
function parseSources(sources: unknown): ReviewSourceEntry[] {
  if (!Array.isArray(sources)) return [];
  return sources.filter((s): s is ReviewSourceEntry => s !== null && typeof s === "object");
}

/**
 * Maps a Review's real fields onto the engine's DistributableContent shape.
 * `contentId` is the Review's own id — stable for the lifetime of the
 * Review regardless of slug changes (see idempotency.ts for why that
 * matters). `canonicalUrl` is Lumiq's own published article URL, built via
 * the same absoluteUrl() helper the rest of the site already uses for SEO.
 */
export function mapReviewToDistributableContent(review: ReviewMapperInput): DistributableContent {
  return {
    id: review.id,
    title: review.titleAr,
    body: review.content,
    summary: review.summary,
    imageUrl: review.imageUrl ?? undefined,
    canonicalUrl: absoluteUrl(`/reviews/${review.slug}`),
    tags: review.tags,
    category: review.category.slug,
  };
}

/** Source metadata (name/URL of the articles a Review was synthesized
 *  from) is not part of DistributableContent's core shape (no target
 *  currently consumes it), but callers that need it — e.g. a future
 *  Formatter wanting to cite sources — can derive it from the same input
 *  via this helper rather than re-deriving Json-parsing logic themselves. */
export function extractReviewSourceLinks(review: ReviewMapperInput): Array<{ title: string; url: string }> {
  return parseSources(review.sources)
    .filter((s): s is Required<Pick<ReviewSourceEntry, "url">> & ReviewSourceEntry => typeof s.url === "string" && s.url.length > 0)
    .map((s) => ({ title: s.title ?? s.name ?? s.url, url: s.url }));
}
