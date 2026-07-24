/**
 * lib/editorial-engine/scoring.ts
 *
 * Turns a rule-evaluation report into the 7 required sub-scores plus an
 * overall 0–100. Every rule declares which single category it belongs to
 * (see RULE_CATEGORY_MAP below) — a rule's outcome only ever affects its
 * own category's score, so adding a new rule never silently reshapes an
 * unrelated score.
 */
import type { RuleCategory } from "./types";
import type { EvaluationReport } from "./core";
import { RULE_CATEGORIES } from "./types";

/** Maps each ruleId to exactly one scoring category. A rule not listed
 *  here falls back to "editorial" — logged so the gap is visible rather
 *  than silently swallowed. */
export const RULE_CATEGORY_MAP: Record<string, RuleCategory> = {
  "required-fields": "editorial",
  "title-quality": "editorial",
  "slug-quality": "editorial",
  "duplicate-title": "editorial",
  "duplicate-slug": "editorial",
  "faq-presence": "editorial",
  "comparison-verdict": "editorial",
  "comparison-methodology": "editorial",
  "comparison-completeness": "editorial",
  "comparison-score-consistency": "editorial",
  "empty-optional-sections": "editorial",
  "factual-completeness": "editorial",

  "seo-title-length": "seo",
  "seo-description-length": "seo",
  "thin-content": "seo",

  "internal-linking-outbound": "authority",
  "internal-linking-broken": "authority",
  "orphan-page": "authority",
  "related-content": "authority",

  "broken-external-link": "ux",

  "revenue-readiness": "revenue",

  "freshness-review-date": "freshness",
  "freshness-update-date": "freshness",

  "connectivity-review": "connectivity",
  "connectivity-comparison": "connectivity",
  "connectivity-tool": "connectivity",
  "connectivity-prompt": "connectivity",
};

function categoryOf(ruleId: string): RuleCategory {
  return RULE_CATEGORY_MAP[ruleId] ?? "editorial";
}

/** PASS=100, WARNING=60, ERROR=0 per rule, averaged within each category.
 *  A category with no applicable rules for this subject scores 100 (there
 *  is nothing to be wrong about), not 0 — an empty check set is not a failure. */
function ruleScore(status: "PASS" | "WARNING" | "ERROR"): number {
  if (status === "PASS") return 100;
  if (status === "WARNING") return 60;
  return 0;
}

export interface QualityScore {
  overall: number;
  categories: Record<RuleCategory, number>;
}

export function scoreReport(report: EvaluationReport): QualityScore {
  const byCategory: Record<string, number[]> = {};
  for (const cat of RULE_CATEGORIES) byCategory[cat] = [];

  for (const result of report.results) {
    const cat = categoryOf(result.ruleId);
    byCategory[cat].push(ruleScore(result.status));
  }

  const categories = {} as Record<RuleCategory, number>;
  for (const cat of RULE_CATEGORIES) {
    const scores = byCategory[cat];
    categories[cat] = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 100;
  }

  const overall = Math.round(RULE_CATEGORIES.reduce((sum, cat) => sum + categories[cat], 0) / RULE_CATEGORIES.length);

  return { overall, categories };
}
