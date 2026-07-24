/**
 * lib/editorial-engine/types.ts
 *
 * Core types for the Editorial Validation Engine. A "subject" is the
 * normalized shape any content type is reduced to before rules run — this
 * is what lets one rule set work across Reviews, Comparisons, AI Tools,
 * Prompts, and future domains (Crypto, Sports, Health, Finance) without
 * modification: a new domain only needs a new adapter that produces this
 * same shape, never a new rule.
 */

export type ContentKind = "review" | "comparison" | "aiTool" | "prompt";

export interface EditorialLink {
  type: "review" | "tool" | "compare" | "prompt" | "category" | "tag";
  slug: string;
  label: string;
}

/**
 * A content type's own domain-specific completeness signals, kept as a
 * loose bag rather than one giant union type — adapters populate only the
 * keys that apply to their content type, and rules read only the keys
 * they care about via optional chaining. This is what lets a Crypto
 * adapter add domain-specific facts later without touching this file.
 */
export interface EditorialFacts {
  hasVerdict?: boolean;
  hasMethodology?: boolean;
  hasFaq?: boolean;
  sideCount?: number;
  uniqueSideCount?: number;
  scoresInRange?: boolean;
  hasBestFor?: boolean;
  hasNotRecommendedFor?: boolean;
  hasPricing?: boolean;
  hasArabicSupportField?: boolean;
  hasApiField?: boolean;
  hasWebsite?: boolean;
  hasTagline?: boolean;
  hasDescription?: boolean;
  hasBody?: boolean;
  linkedToolPublished?: boolean;
  /** AITool only — whether at least one ComparisonSide/Prompt.toolId
   *  relation exists, precomputed by the CLI runner (these are DB
   *  relations, not [[...]] tokens, so adapters alone can't see them). */
  hasComparisonRelation?: boolean;
  hasPromptRelation?: boolean;
}

export interface EditorialSubject {
  kind: ContentKind;
  id: string;
  slug: string;
  title: string;
  /** Free-text body/description used for word-count, link-scanning, and thin-content checks. */
  bodyText: string;
  published: boolean;
  seoTitle: string | null;
  seoDescription: string | null;
  createdAt: Date;
  updatedAt: Date;
  /** Distinct from updatedAt — a deliberate "verified still accurate" timestamp, only some content types have one. */
  reviewedAt: Date | null;
  /** Editorial [[type:slug|label]] tokens found in bodyText, already parsed. */
  outboundLinks: EditorialLink[];
  facts: EditorialFacts;
}

export type RuleSeverity = "info" | "warning" | "error";
export type RuleStatus = "PASS" | "WARNING" | "ERROR";

export interface RuleResult {
  ruleId: string;
  status: RuleStatus;
  severity: RuleSeverity;
  explanation: string;
  suggestedFix: string | null;
}

/**
 * A rule is a pure function — no I/O, no Prisma calls. Anything a rule
 * needs from the outside world (e.g. "does this slug already exist
 * elsewhere", "does this linked tool resolve") is precomputed by the
 * caller and passed in via EditorialContext, so rules stay unit-testable
 * and never accidentally diverge from each other's view of the world.
 */
export interface EditorialContext {
  /** All slugs of the same content kind, used for duplicate-title/slug detection. */
  siblingSlugs: Set<string>;
  siblingTitles: Map<string, string>; // slug -> title, for near-duplicate title detection
  /** Slugs resolvable by each link type, reused from lib/internal-links.ts's LinkableSlugSets shape. */
  linkableSlugs: Record<EditorialLink["type"], Set<string>>;
  /** Slugs of this content kind that are linked TO by at least one other piece of content (for orphan detection). */
  inboundLinkedSlugs: Set<string>;
  /** Current time, injectable for deterministic testing. */
  now: Date;
}

export interface EditorialRule {
  id: string;
  /** Which content kinds this rule applies to; omit to apply to all kinds. */
  appliesTo?: ContentKind[];
  evaluate: (subject: EditorialSubject, context: EditorialContext) => RuleResult;
}

export const RULE_CATEGORIES = [
  "editorial",
  "seo",
  "authority",
  "ux",
  "revenue",
  "freshness",
  "connectivity",
] as const;
export type RuleCategory = (typeof RULE_CATEGORIES)[number];
