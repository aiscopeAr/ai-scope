/**
 * lib/editorial-engine/rules/freshness.ts
 * Outdated review date, missing update date.
 */
import type { EditorialRule, RuleResult } from "../types";

function pass(ruleId: string): RuleResult {
  return { ruleId, status: "PASS", severity: "info", explanation: "OK", suggestedFix: null };
}
function warn(ruleId: string, explanation: string, suggestedFix: string): RuleResult {
  return { ruleId, status: "WARNING", severity: "warning", explanation, suggestedFix };
}

const STALE_DAYS_BY_KIND: Record<string, number> = {
  comparison: 120, // pricing/features drift fastest here — matches Authority Sprint 1's own findings
  aiTool: 120,
  review: 365, // news analysis doesn't need re-verification the way live pricing does
  prompt: 730,
};

export const freshnessReviewDate: EditorialRule = {
  id: "freshness-review-date",
  appliesTo: ["comparison", "aiTool"],
  evaluate: (subject, context) => {
    if (!subject.reviewedAt) {
      return warn("freshness-review-date", "No editorial 'last verified' date has ever been set.", "Verify the facts against official sources and set a review date.");
    }
    const staleDays = STALE_DAYS_BY_KIND[subject.kind] ?? 180;
    const ageDays = (context.now.getTime() - subject.reviewedAt.getTime()) / 86_400_000;
    if (ageDays > staleDays) {
      return warn("freshness-review-date", `Last verified ${Math.round(ageDays)} days ago (guideline: re-verify every ${staleDays} days).`, "Re-verify pricing/features against official sources and update the review date.");
    }
    return pass("freshness-review-date");
  },
};

export const freshnessUpdateDate: EditorialRule = {
  id: "freshness-update-date",
  evaluate: (subject) => {
    if (!subject.updatedAt) {
      return warn("freshness-update-date", "No updatedAt timestamp present.", "This should not happen if the schema's @updatedAt is intact — investigate.");
    }
    return pass("freshness-update-date");
  },
};
