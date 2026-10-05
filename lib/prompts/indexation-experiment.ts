/**
 * lib/prompts/indexation-experiment.ts
 *
 * PROMPT_INDEXATION_001 — prompt-detail indexation policy.
 *
 * Phase A (09-16): a frozen 9-slug noindex experiment proved the mechanism
 * (Google began excluding the treated pages, no harm to the hub or reviews).
 *
 * Phase B (Option A, current): the policy generalizes to its intended rule —
 * a prompt-DETAIL page is indexable ONLY if it is `featured` or has proven
 * organic search value (GSC allowlist). Everything else renders `noindex,follow`
 * and is dropped from the sitemap. Rationale: the ~500 thin, templated prompt
 * pages were 96% of GSC's "Discovered – currently not indexed" (712) — Google
 * already refuses to index them. Formalizing that reclaims crawl budget, shrinks
 * the not-indexed pile, and cuts ISR-write churn, with no traffic loss (they
 * earn ~zero clicks). The /prompts HUB and reviews are untouched.
 *
 * Runtime consumes a trivial rule (featured flag + a tiny GSC allowlist) — no
 * clustering, no DB-wide scan. Both the metadata route and the sitemap call the
 * SAME decision so "indexable ⟺ in sitemap" cannot drift.
 *
 * Flag: env `PROMPT_INDEXATION_001 === "on"` (default OFF). OFF ⇒ every prompt
 * is indexable exactly as before.
 */

export const PROMPT_INDEXATION_EXPERIMENT_ID = "PROMPT_INDEXATION_001";

/**
 * Prompt slugs with proven organic search value (from GSC) — kept indexable
 * regardless of the `featured` flag. Small, explicit, reviewed list (NOT a
 * self-maintaining allowlist system). Extend deliberately from GSC evidence.
 */
export const PROMPT_GSC_ALLOWLIST: ReadonlySet<string> = new Set([
  "create-a-fantasy-landscape",
  "midjourney-prompt-master",
  "social-media-content-calendar",
]);

/** True when the policy is enabled. Default OFF. Read at call time. */
export function isPromptIndexationExperimentActive(): boolean {
  return process.env.PROMPT_INDEXATION_001 === "on";
}

/**
 * The policy rule (flag-independent): a prompt-detail page is indexable iff it
 * is featured OR on the GSC allowlist. Pure.
 */
export function isPromptIndexable(slug: string, featured: boolean): boolean {
  return featured === true || PROMPT_GSC_ALLOWLIST.has(slug);
}

/**
 * Whether a prompt-detail page should be indexable right now. When the policy is
 * OFF, always true (unchanged behavior). When ON, follows the rule above.
 */
export function shouldIndexPrompt(slug: string, featured: boolean): boolean {
  if (!isPromptIndexationExperimentActive()) return true;
  return isPromptIndexable(slug, featured);
}

/** Sitemap inclusion — identical decision to shouldIndexPrompt (no drift). */
export function shouldIncludePromptInSitemap(slug: string, featured: boolean): boolean {
  return shouldIndexPrompt(slug, featured);
}

/**
 * Robots metadata for a prompt-detail page, or `undefined` to leave it indexable
 * (the default). Returns `noindex, follow` only when the policy is ON and the
 * page is not indexable. Consumed by generateMetadata.
 */
export function promptExperimentRobots(
  slug: string,
  featured: boolean,
): { index: false; follow: true } | undefined {
  return shouldIndexPrompt(slug, featured) ? undefined : { index: false, follow: true };
}
