/**
 * lib/editorial-engine/rules/seo.ts
 */
import type { EditorialRule, RuleResult } from "../types";

function pass(ruleId: string): RuleResult {
  return { ruleId, status: "PASS", severity: "info", explanation: "OK", suggestedFix: null };
}
function warn(ruleId: string, explanation: string, suggestedFix: string): RuleResult {
  return { ruleId, status: "WARNING", severity: "warning", explanation, suggestedFix };
}

export const seoTitleLength: EditorialRule = {
  id: "seo-title-length",
  appliesTo: ["review", "aiTool"],
  evaluate: (subject) => {
    if (!subject.seoTitle) {
      return warn("seo-title-length", "No dedicated SEO title set (falls back to the display title at render time).", "Set an SEO-optimized title if the display title isn't ideal for search.");
    }
    const len = subject.seoTitle.length;
    if (len > 70) {
      return warn("seo-title-length", `SEO title is ${len} characters — likely to be truncated in search results (~60-70 char guideline).`, "Shorten the SEO title.");
    }
    return pass("seo-title-length");
  },
};

export const seoDescriptionLength: EditorialRule = {
  id: "seo-description-length",
  appliesTo: ["review", "aiTool", "prompt"],
  evaluate: (subject) => {
    if (!subject.seoDescription) {
      return warn("seo-description-length", "No SEO description set.", "Add a 140–160 character description.");
    }
    const len = subject.seoDescription.length;
    if (len < 70) {
      return warn("seo-description-length", `SEO description is only ${len} characters — likely too short to be a useful search snippet.`, "Expand toward 140-160 characters with a concrete detail.");
    }
    if (len > 165) {
      return warn("seo-description-length", `SEO description is ${len} characters — likely to be truncated in search results.`, "Shorten toward 140-160 characters.");
    }
    return pass("seo-description-length");
  },
};
