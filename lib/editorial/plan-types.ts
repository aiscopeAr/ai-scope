/**
 * lib/editorial/plan-types.ts
 *
 * Editorial V2-A — EditorialPlan types + a pure, side-effect-free validator.
 *
 * A1/A2 scope: these types describe the plan the lightweight planner produces
 * for a single ReviewQueue item. The plan is SHADOW-only in this phase — it is
 * generated, validated, and logged, but NEVER consumed by the writer and NEVER
 * persisted to the database. No Prisma types, no DB persistence.
 *
 * The plan influences editorial REASONING, not literal headings. It must never
 * reproduce the legacy fixed skeleton (السياق/التفاصيل/التحليل/المقارنة/التداعيات).
 */

import type { AuthorSlug } from "@/lib/authors";

// ─── Enums (narrow) ──────────────────────────────────────────────────────────

export const STORY_TYPES = [
  "BREAKING_NEWS",
  "STANDARD_NEWS",
  "DEEP_ANALYSIS",
  "PRODUCT_LAUNCH",
  "COMPANY_BUSINESS",
  "POLICY_REGULATION",
  "RESEARCH_PAPER",
  "EXPLAINER",
] as const;
export type StoryType = (typeof STORY_TYPES)[number];

export const DEPTHS = ["breaking", "standard", "deep"] as const;
export type Depth = (typeof DEPTHS)[number];

export const ANGLES = [
  "WHAT_CHANGED",
  "WHY_IT_MATTERS",
  "COMPETITIVE_IMPACT",
  "BUSINESS_IMPACT",
  "TECHNICAL_SIGNIFICANCE",
  "COST_PRICING",
  "USER_IMPACT",
  "POLICY_IMPACT",
  "CLAIM_VS_EVIDENCE",
  "RESEARCH_LIMITATION",
  "MARKET_SHIFT",
  "OTHER",
] as const;
export type Angle = (typeof ANGLES)[number];

export const OPENING_STRATEGIES = [
  "FACT_FIRST",
  "NUMBER_FIRST",
  "CONSEQUENCE_FIRST",
  "CONTRAST",
  "CONTEXT",
  "USER_IMPACT",
  "TENSION",
  "RESEARCH_RESULT",
] as const;
export type OpeningStrategy = (typeof OPENING_STRATEGIES)[number];

export const UNCERTAINTY_KINDS = [
  "rollout",
  "pricing",
  "availability",
  "arabic-support",
  "benchmark",
  "research-limit",
  "legal",
  "demo-vs-prod",
  "unverified-claim",
] as const;
export type UncertaintyKind = (typeof UNCERTAINTY_KINDS)[number];

// ─── Structures ──────────────────────────────────────────────────────────────

export interface SectionPlan {
  purpose: string;
  workingTitle: string;
  questionsToAnswer: string[];
  evidenceNeeded?: string[];
  approximateWeight?: number;
}

export interface Uncertainty {
  kind: UncertaintyKind;
  note: string;
  material: boolean;
}

export interface EditorialPlan {
  storyType: StoryType;
  depth: Depth;
  centralEvent: string;
  primaryAngle: Angle;
  secondaryAngle?: Angle;
  editorialThesis: string;
  readerValue: string;
  openingStrategy: OpeningStrategy;
  authorLens: AuthorSlug;
  headlineStrategy?: string;
  sections: SectionPlan[];
  includeFaq: boolean;
  faqIntent?: string[];
  includeComparison: boolean;
  comparisonTarget?: string;
  includeMena: boolean;
  menaReason?: string;
  uncertainties: Uncertainty[];
  evidenceRequirements?: string[];
  depthDowngradedReason?: string;
}

// ─── Legacy skeleton (must never be reproduced) ──────────────────────────────

/** Stems of the legacy fixed 5-heading template. A plan whose section titles
 *  reproduce this set is rejected — that template is the #1 root cause of the
 *  "AI-generated" feel the audit found (100% identical headings). */
export const LEGACY_SKELETON_STEMS = ["السياق", "التفاصيل", "التحليل", "المقارنة", "التداعيات"] as const;

function normalize(s: string): string {
  return (s || "").replace(/[—–:،.؟?()]/g, " ").replace(/\s+/g, " ").trim();
}

/** True if a set of headings reproduces the legacy skeleton (≥4 of the 5 stems present). */
export function isLegacySkeleton(headings: string[]): boolean {
  const joined = headings.map(normalize).join(" | ");
  const hits = LEGACY_SKELETON_STEMS.filter((stem) => joined.includes(stem)).length;
  return hits >= 4;
}

// ─── First-hand-experience guardrail (planning layer) ────────────────────────

/** Phrases that imply Lumiq personally tested/used/subscribed/benchmarked a
 *  product. A plan must never assume first-hand experience (no such evidence
 *  exists in the news pipeline). Arabic + English. */
const FIRST_HAND_PATTERNS: RegExp[] = [
  /جرّ?بنا|اختبرنا|قمنا بتجربة|تجربتنا|بعد استخدامنا|استخدمناها|في تجربتنا العملية|اشتركنا|قِسنا|لقطات الشاشة التي التقطناها/i,
  /\b(we|our)\s+(tested|tried|used|benchmarked|measured|subscribed|purchased|ran)\b/i,
  /\b(in|after)\s+our\s+(hands-on|test|testing|experiment|trial)\b/i,
  /\bhands-on (test|review|experience)\b/i,
];

/** True if text implies first-hand testing/usage by Lumiq. */
export function impliesFirstHandExperience(text: string): boolean {
  const t = text || "";
  return FIRST_HAND_PATTERNS.some((re) => re.test(t));
}

// ─── Pure validator ──────────────────────────────────────────────────────────

export interface PlanValidation {
  ok: boolean;
  errors: string[];
}

/** Validate a candidate EditorialPlan. Pure — no I/O. Used by the planner
 *  (retry/fallback) and by tests. Enforces the A1/A2 planner contract. */
export function validateEditorialPlan(plan: unknown): PlanValidation {
  const errors: string[] = [];
  const p = plan as Partial<EditorialPlan> | null | undefined;

  if (!p || typeof p !== "object") {
    return { ok: false, errors: ["plan is not an object"] };
  }

  if (!STORY_TYPES.includes(p.storyType as StoryType)) errors.push("invalid storyType");
  if (!DEPTHS.includes(p.depth as Depth)) errors.push("invalid depth");
  if (!ANGLES.includes(p.primaryAngle as Angle)) errors.push("invalid primaryAngle");
  if (p.secondaryAngle !== undefined && !ANGLES.includes(p.secondaryAngle as Angle)) errors.push("invalid secondaryAngle");
  if (!OPENING_STRATEGIES.includes(p.openingStrategy as OpeningStrategy)) errors.push("invalid openingStrategy");

  if (!p.centralEvent || !p.centralEvent.trim()) errors.push("empty centralEvent");
  if (!p.editorialThesis || !p.editorialThesis.trim()) errors.push("empty editorialThesis");
  if (!p.readerValue || !p.readerValue.trim()) errors.push("empty readerValue");

  const sections = Array.isArray(p.sections) ? p.sections : [];
  if (sections.length < 2 || sections.length > 7) errors.push(`section count out of range (${sections.length}); must be 2–7`);
  const titles = sections.map((s) => (s?.workingTitle ?? "").trim());
  if (titles.some((t) => !t)) errors.push("a section has an empty workingTitle");
  if (sections.some((s) => !s?.purpose || !s.purpose.trim())) errors.push("a section has an empty purpose");
  const lowerTitles = titles.map((t) => normalize(t).toLowerCase());
  if (new Set(lowerTitles).size !== lowerTitles.length) errors.push("duplicate section titles");
  if (isLegacySkeleton(titles)) errors.push("sections reproduce the legacy 5-heading skeleton");

  if (p.includeComparison === true && !(p.comparisonTarget && p.comparisonTarget.trim())) {
    errors.push("includeComparison=true requires a comparisonTarget");
  }
  if (p.includeMena === true && !(p.menaReason && p.menaReason.trim())) {
    errors.push("includeMena=true requires a specific menaReason");
  }
  if (p.includeFaq === true && !(Array.isArray(p.faqIntent) && p.faqIntent.length > 0)) {
    errors.push("includeFaq=true requires at least one faqIntent");
  }
  if (typeof p.includeFaq !== "boolean") errors.push("includeFaq must be boolean");
  if (typeof p.includeComparison !== "boolean") errors.push("includeComparison must be boolean");
  if (typeof p.includeMena !== "boolean") errors.push("includeMena must be boolean");

  const uncertainties = Array.isArray(p.uncertainties) ? p.uncertainties : [];
  for (const u of uncertainties) {
    if (!u || !UNCERTAINTY_KINDS.includes(u.kind as UncertaintyKind) || typeof u.material !== "boolean" || !u.note?.trim()) {
      errors.push("invalid uncertainty object");
      break;
    }
  }

  // First-hand-experience guardrail — scan all human-authored plan text.
  const scan = [
    p.centralEvent, p.editorialThesis, p.readerValue, p.menaReason, p.headlineStrategy,
    ...(p.faqIntent ?? []),
    ...sections.flatMap((s) => [s?.workingTitle, s?.purpose, ...(s?.questionsToAnswer ?? []), ...(s?.evidenceNeeded ?? [])]),
    ...uncertainties.map((u) => u?.note),
  ].filter(Boolean).join(" \n ");
  if (impliesFirstHandExperience(scan)) errors.push("plan implies first-hand testing/usage by Lumiq");

  return { ok: errors.length === 0, errors };
}
