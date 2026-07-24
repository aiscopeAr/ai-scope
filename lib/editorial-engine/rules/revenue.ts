/**
 * lib/editorial-engine/rules/revenue.ts
 *
 * Revenue readiness — not "does this earn money today" (nothing on Lumiq
 * has affiliate links yet, per the Revenue Sprint 1 audit), but "is this
 * content structurally ready to carry a CTA/affiliate link the moment one
 * exists" — i.e. does it have the pricing/comparison scaffolding a
 * monetizable page needs.
 */
import type { EditorialRule, RuleResult } from "../types";

function pass(ruleId: string): RuleResult {
  return { ruleId, status: "PASS", severity: "info", explanation: "OK", suggestedFix: null };
}
function warn(ruleId: string, explanation: string, suggestedFix: string): RuleResult {
  return { ruleId, status: "WARNING", severity: "warning", explanation, suggestedFix };
}

export const revenueReadiness: EditorialRule = {
  id: "revenue-readiness",
  appliesTo: ["aiTool", "comparison"],
  evaluate: (subject) => {
    if (subject.kind === "aiTool") {
      const missing: string[] = [];
      if (!subject.facts.hasPricing) missing.push("pricing");
      if (!subject.facts.hasWebsite) missing.push("website (the outbound CTA target)");
      if (missing.length > 0) {
        return warn("revenue-readiness", `Missing ${missing.join(" and ")} — this page cannot carry a pricing-aware CTA until filled in.`, `Add ${missing.join(" and ")}.`);
      }
      return pass("revenue-readiness");
    }
    // comparison
    if (!subject.facts.hasVerdict) {
      return warn("revenue-readiness", "No verdict — comparisons without a clear recommendation convert worse once a CTA exists.", "Add a verdict.");
    }
    return pass("revenue-readiness");
  },
};
