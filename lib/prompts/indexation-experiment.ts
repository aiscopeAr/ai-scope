/**
 * lib/prompts/indexation-experiment.ts
 *
 * PROMPT_INDEXATION_001 — controlled prompt-detail indexation experiment (Phase A1).
 *
 * A FROZEN, human-reviewed cohort of prompt-detail slugs. The cohort was selected
 * OFFLINE (see docs/seo/prompt-indexation-001-*.json) from duplicate clusters whose
 * members have IDENTICAL normalized Arabic titles only (normSim === 1.0). Near-
 * identical (SAFE_NEAR) and divergent (REVIEW) clusters are deliberately excluded.
 *
 * Runtime does NOT recompute clusters, title similarity, GSC signal, or DB-wide
 * membership — it consumes the frozen lists below. No clustering / Jaccard logic
 * ships in production. This is an EXPERIMENT, not the permanent P3 policy:
 *   - new prompts are never auto-added
 *   - new "-N" URLs are never auto-classified
 *   - the cohort never expands when DB content changes
 *
 * Activation: environment flag only. `PROMPT_INDEXATION_001 === "on"` (default OFF).
 * No DB / SystemSetting lookup (zero runtime DB overhead). Turning the flag off
 * restores current metadata + sitemap behavior immediately (recrawl still governs
 * how quickly Google reflects it).
 *
 * Both the prompt metadata route and the sitemap consume the SAME decision here,
 * so the invariant `indexable ⟺ present in sitemap` cannot drift.
 */

export const PROMPT_INDEXATION_EXPERIMENT_ID = "PROMPT_INDEXATION_001";

/**
 * Frozen TREATMENT cohort (9). When the experiment is ON these prompt-detail pages
 * render `noindex, follow` and are omitted from the sitemap. When OFF they behave
 * exactly as today (indexable + in sitemap).
 */
export const PROMPT_INDEXATION_001_TREATMENT: readonly string[] = [
  "automate-email-responses-with-zapier",
  "create-a-conversational-ai-voice",
  "create-a-conversational-ai-voice-1",
  "create-a-fantasy-landscape-1",
  "create-a-weekly-planner",
  "creative-writing-prompt-generator",
  "effective-clinical-note-taking-strategies",
  "effective-marketing-strategy-ideas",
  "futuristic-cityscape-at-sunset",
] as const;

/**
 * Frozen CONTROL cohort (6). Comparable duplicate non-representatives that are
 * deliberately left UNTOUCHED (index, follow + in sitemap) as the measurement
 * baseline. Listed only for traceability/tests — no code branches on it.
 */
export const PROMPT_INDEXATION_001_CONTROL: readonly string[] = [
  "automate-email-notifications-with-make",
  "create-engaging-presentations-quickly-1",
  "create-engaging-social-media-posts-1",
  "effective-marketing-strategy-planning-1",
  "effective-study-strategies-for-students",
  "effective-time-management-tips",
] as const;

const TREATMENT_SET: ReadonlySet<string> = new Set(PROMPT_INDEXATION_001_TREATMENT);

/** True when the experiment flag is explicitly enabled. Default OFF. Read at call time. */
export function isPromptIndexationExperimentActive(): boolean {
  return process.env.PROMPT_INDEXATION_001 === "on";
}

/**
 * Frozen treatment membership. Independent of the flag — answers "is this slug in
 * the reviewed treatment cohort", not "is the experiment changing its behavior now".
 */
export function isPromptIndexationTreatment(slug: string): boolean {
  return TREATMENT_SET.has(slug);
}

/**
 * Whether a prompt-detail page should be indexable. Only a frozen treatment slug
 * flips, and only while the experiment is active. Everything else is always true.
 */
export function shouldIndexPrompt(slug: string): boolean {
  return !(isPromptIndexationExperimentActive() && isPromptIndexationTreatment(slug));
}

/**
 * Whether a prompt-detail URL should appear in the sitemap. Identical decision to
 * shouldIndexPrompt so the two surfaces can never disagree.
 */
export function shouldIncludePromptInSitemap(slug: string): boolean {
  return shouldIndexPrompt(slug);
}

/**
 * Robots metadata for a prompt-detail page, or `undefined` to leave metadata
 * untouched (the default indexable behavior). Returns `noindex, follow` only for
 * an active-experiment treatment slug. Consumed by generateMetadata.
 */
export function promptExperimentRobots(
  slug: string,
): { index: false; follow: true } | undefined {
  return shouldIndexPrompt(slug) ? undefined : { index: false, follow: true };
}
