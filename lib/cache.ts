/**
 * lib/cache.ts
 * Shared cache tags for unstable_cache — this project uses Prisma (not fetch),
 * so route-level `revalidate`/`fetch` caching options are no-ops. unstable_cache
 * is what actually caches DB reads; these tags let approveReview() invalidate
 * exactly what changed via revalidateNow() instead of waiting out a timer.
 */
import { revalidateTag } from "next/cache";

export const CACHE_TAGS = {
  reviews: "reviews",
  aiTools: "ai-tools",
  prompts: "prompts",
  categories: "categories",
  comparisons: "comparisons",
} as const;

/** Default revalidation window (seconds) as a safety net behind on-demand revalidation. */
export const DEFAULT_REVALIDATE_SECONDS = 300;

/**
 * Next.js 16's revalidateTag(tag) alone is deprecated stale-while-revalidate —
 * content only refreshes on next visit. Published content should show up
 * immediately, so this always passes { expire: 0 } for eager expiration.
 */
export function revalidateNow(tag: string): void {
  revalidateTag(tag, { expire: 0 });
}
