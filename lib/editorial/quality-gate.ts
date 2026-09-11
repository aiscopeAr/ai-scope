/**
 * lib/editorial/quality-gate.ts
 *
 * Editorial V2 A5-lite — a PURE, deterministic post-writer quality gate.
 *
 * It answers ONE question: "is this generated draft structurally and
 * editorially SAFE to continue toward publication (given its plan)?" — never
 * whether the underlying reporting/evidence/story is sufficient (that is A6/A7).
 *
 * Pure & side-effect-free: no I/O, no Prisma, no OpenAI, no logging. The route
 * calls it and decides what to log. It reuses the existing pure helpers rather
 * than re-implementing them:
 *   - isLegacySkeleton()            (plan-types)
 *   - impliesFirstHandExperience()  (plan-types)
 *   - extractH2Headings()           (planner)
 *
 * PHASE 1 IS SHADOW: every outcome here is DIAGNOSTIC ONLY. Nothing in this
 * module mutates anything; the route must not change the ReviewQueue lifecycle
 * based on the result.
 */

import type { EditorialPlan, Depth } from "./plan-types";
import { isLegacySkeleton, impliesFirstHandExperience } from "./plan-types";
import { extractH2Headings } from "./planner";

export const GATE_PIPELINE_VERSION = "a5lite.phase1";

export type WriterPath = "a3" | "v1";
export type GateOutcome = "PASS" | "PASS_WITH_WARNINGS" | "EDITOR_REVIEW" | "REJECT_DRAFT";

/** Hard, integrity/structural codes — reserved for genuinely unsafe/broken drafts. */
export type HardFailCode =
  | "EMPTY_CONTENT"
  | "MALFORMED"
  | "LEAKAGE"
  | "FIRST_HAND"
  | "LEGACY_SKELETON"
  | "PLAN_SECTION_COLLAPSE";

/** Review-level codes — escalate to EDITOR_REVIEW but never hard-fail. */
export type ReviewCode = "FAQ_AGAINST_PLAN" | "MENA_AGAINST_PLAN";

/** Soft, advisory codes — never change the outcome beyond PASS_WITH_WARNINGS. */
export type WarningCode =
  | "TOO_SHORT"
  | "GENERIC_OPENING"
  | "REPETITIVE_TRANSITION"
  | "SECTION_COUNT_MISMATCH"
  | "FAQ_MISSING_FROM_PLAN"
  | "COMPARISON_AGAINST_PLAN";

export interface GateMetrics {
  wordCount: number;
  h2Count: number;
  faqCount: number;
  sourceCount: number;
  plannedSectionCount: number | null;
}

export interface GateResult {
  outcome: GateOutcome;
  hardFailCodes: HardFailCode[];
  reviewCodes: ReviewCode[];
  warningCodes: WarningCode[];
  metrics: GateMetrics;
}

export interface GateInput {
  /** The validated EditorialPlan when the A3 plan-driven writer produced the draft; undefined on the V1 path. */
  plan?: EditorialPlan;
  draft: {
    titleAr?: string;
    summaryAr?: string;
    contentAr?: string;
    faq?: Array<{ question: string; answer: string }>;
  };
  writerPath: WriterPath;
  sourceCount: number;
}

// ── Tunables (guides, not quotas — length NEVER hard-fails in phase 1) ────────

/** Soft TOO_SHORT warning threshold per depth (words). Below → advisory only. */
const DEPTH_SHORT_WARN: Record<Depth, number> = {
  breaking: 250,
  standard: 500,
  deep: 900,
};

/** Generator/meta/SEO-field leakage markers that must never reach published prose. */
const LEAKAGE_MARKERS = [
  "الكلمات المفتاحية",
  "معلومات تحسين محركات البحث",
  "فئة مقترحة",
  "وصف الصورة المقترحة",
  "featuredImagePrompt",
  "suggestedCategory",
  '"contentAr"',
  '"titleAr"',
  '"seoTitle"',
  '"slug"',
  "```",
];

/** Clearly-templated generic openers (conservative list). */
const GENERIC_OPENERS = [
  "في خطوة جديدة تعكس",
  "يشهد عالم الذكاء الاصطناعي تطورات",
  "يثير هذا التطور تساؤلات",
  "في عالم يشهد تسارع",
  "في الآونة الأخيرة",
];

/** Transition phrases whose heavy repetition signals templated filler. */
const TRANSITIONS = ["على سبيل المثال", "بالإضافة إلى ذلك", "علاوة على ذلك", "من ناحية أخرى", "كذلك،"];

/** MENA / Arab-reader markers (conservative) — a forced regional angle. */
const MENA_MARKERS = ["المستخدم العربي", "المنطقة العربية", "الشرق الأوسط", "العالم العربي", "الدول العربية"];

function countWords(text: string): number {
  return text.replace(/^#{1,6}\s+/gm, "").trim().split(/\s+/).filter(Boolean).length;
}

function looksLikeComparisonHeading(h: string): boolean {
  return /مقارنة|مقابل/.test(h) || /\bvs\b/i.test(h);
}

/**
 * Deterministically evaluate a generated draft. Pure. The outcome is DIAGNOSTIC
 * in phase 1 — callers must not change the lifecycle based on it.
 */
export function evaluateDraftQuality(input: GateInput): GateResult {
  const { plan, draft, sourceCount } = input;
  const content = (draft.contentAr ?? "").toString();
  const summary = (draft.summaryAr ?? "").toString();
  const faq = Array.isArray(draft.faq) ? draft.faq : [];
  const faqText = faq.map((f) => `${f?.question ?? ""} ${f?.answer ?? ""}`).join(" ");

  const h2 = extractH2Headings(content);
  const paragraphs = content.split(/\n\n+/).map((p) => p.trim()).filter(Boolean);
  const wordCount = countWords(content);

  const metrics: GateMetrics = {
    wordCount,
    h2Count: h2.length,
    faqCount: faq.length,
    sourceCount,
    plannedSectionCount: plan ? plan.sections.length : null,
  };

  const hardFailCodes: HardFailCode[] = [];
  const reviewCodes: ReviewCode[] = [];
  const warningCodes: WarningCode[] = [];

  // ── HARD (structural / integrity only — length alone is NEVER here) ──
  if (content.trim().length === 0) {
    hardFailCodes.push("EMPTY_CONTENT");
  } else if (paragraphs.length === 0) {
    hardFailCodes.push("MALFORMED");
  }

  if (LEAKAGE_MARKERS.some((m) => content.includes(m))) hardFailCodes.push("LEAKAGE");

  if (impliesFirstHandExperience(`${content}\n${summary}\n${faqText}`)) hardFailCodes.push("FIRST_HAND");

  // Legacy-skeleton is a REGRESSION only on the plan-driven (A3) path — a
  // plan-driven draft must never reproduce the old fixed 5-heading template.
  // On the V1 path the legacy skeleton is the known baseline, so it is NOT
  // flagged (flagging every V1 draft would make the gate pure noise).
  if (plan && h2.length > 0 && isLegacySkeleton(h2)) hardFailCodes.push("LEGACY_SKELETON");

  // Writer ignored a real plan: ≥3 planned sections but the draft has ≤1 H2.
  if (plan && plan.sections.length >= 3 && h2.length <= 1) hardFailCodes.push("PLAN_SECTION_COLLAPSE");

  // ── REVIEW-level (escalate to EDITOR_REVIEW) ──
  if (plan && plan.includeFaq === false && faq.length > 0) reviewCodes.push("FAQ_AGAINST_PLAN");
  if (plan && plan.includeMena === false && MENA_MARKERS.some((m) => content.includes(m))) {
    reviewCodes.push("MENA_AGAINST_PLAN");
  }

  // ── SOFT warnings (advisory; never change outcome beyond PASS_WITH_WARNINGS) ──
  // Length: diagnostic ONLY. Suppressed when the planner already downgraded depth.
  const depth: Depth | undefined = plan?.depth;
  const shortThreshold = depth ? DEPTH_SHORT_WARN[depth] : DEPTH_SHORT_WARN.standard;
  const depthDowngraded = !!(plan?.depthDowngradedReason && plan.depthDowngradedReason.trim());
  if (content.trim().length > 0 && wordCount < shortThreshold && !depthDowngraded) {
    warningCodes.push("TOO_SHORT");
  }

  const firstPara = paragraphs.find((p) => !/^#{1,6}\s+/.test(p)) ?? paragraphs[0] ?? "";
  if (GENERIC_OPENERS.some((g) => firstPara.includes(g))) warningCodes.push("GENERIC_OPENING");

  if (TRANSITIONS.some((t) => (content.split(t).length - 1) >= 4)) warningCodes.push("REPETITIVE_TRANSITION");

  if (plan && Math.abs(h2.length - plan.sections.length) > 1) warningCodes.push("SECTION_COUNT_MISMATCH");

  if (plan && plan.includeFaq === true && faq.length === 0) warningCodes.push("FAQ_MISSING_FROM_PLAN");

  if (plan && plan.includeComparison === false && h2.some(looksLikeComparisonHeading)) {
    warningCodes.push("COMPARISON_AGAINST_PLAN");
  }

  // ── Outcome (hard overrides review overrides warnings) ──
  let outcome: GateOutcome = "PASS";
  if (hardFailCodes.length > 0) outcome = "REJECT_DRAFT";
  else if (reviewCodes.length > 0) outcome = "EDITOR_REVIEW";
  else if (warningCodes.length > 0) outcome = "PASS_WITH_WARNINGS";

  return { outcome, hardFailCodes, reviewCodes, warningCodes, metrics };
}
