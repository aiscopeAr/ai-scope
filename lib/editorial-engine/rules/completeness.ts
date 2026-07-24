/**
 * lib/editorial-engine/rules/completeness.ts
 * FAQ presence, comparison verdict/methodology/score-consistency, thin
 * content, empty optional sections, factual completeness.
 */
import type { EditorialRule, RuleResult } from "../types";

function pass(ruleId: string): RuleResult {
  return { ruleId, status: "PASS", severity: "info", explanation: "OK", suggestedFix: null };
}
function warn(ruleId: string, explanation: string, suggestedFix: string): RuleResult {
  return { ruleId, status: "WARNING", severity: "warning", explanation, suggestedFix };
}
function fail(ruleId: string, explanation: string, suggestedFix: string): RuleResult {
  return { ruleId, status: "ERROR", severity: "error", explanation, suggestedFix };
}

export const faqPresence: EditorialRule = {
  id: "faq-presence",
  appliesTo: ["review", "aiTool"],
  evaluate: (subject) => {
    if (!subject.facts.hasFaq) {
      return warn("faq-presence", "No FAQ section present.", "Add an FAQ block if the content answers common reader questions — skip if genuinely not applicable.");
    }
    return pass("faq-presence");
  },
};

export const comparisonVerdict: EditorialRule = {
  id: "comparison-verdict",
  appliesTo: ["comparison"],
  evaluate: (subject) => {
    if (!subject.facts.hasVerdict) {
      return warn("comparison-verdict", "This comparison has no editorial verdict.", "Add a verdict summarizing the recommendation.");
    }
    return pass("comparison-verdict");
  },
};

export const comparisonMethodology: EditorialRule = {
  id: "comparison-methodology",
  appliesTo: ["comparison"],
  evaluate: (subject) => {
    if (!subject.facts.hasMethodology) {
      return warn("comparison-methodology", "This comparison does not document its scoring methodology.", "Add a methodology field explaining how sides were scored.");
    }
    return pass("comparison-methodology");
  },
};

export const comparisonCompleteness: EditorialRule = {
  id: "comparison-completeness",
  appliesTo: ["comparison"],
  evaluate: (subject) => {
    const { sideCount = 0, uniqueSideCount = 0, linkedToolPublished } = subject.facts;
    if (sideCount < 2) {
      return fail("comparison-completeness", `Comparison has ${sideCount} side(s), needs at least 2.`, "Add another side before publishing.");
    }
    if (uniqueSideCount !== sideCount) {
      return fail("comparison-completeness", "Comparison contains the same tool more than once.", "Remove the duplicate side.");
    }
    if (linkedToolPublished === false) {
      return fail("comparison-completeness", "At least one side references an unpublished tool.", "Publish the tool, or remove/replace that side.");
    }
    return pass("comparison-completeness");
  },
};

export const comparisonScoreConsistency: EditorialRule = {
  id: "comparison-score-consistency",
  appliesTo: ["comparison"],
  evaluate: (subject) => {
    if (subject.facts.scoresInRange === false) {
      return fail("comparison-score-consistency", "One or more side scores are outside the valid 0–100 range.", "Correct the out-of-range score.");
    }
    return pass("comparison-score-consistency");
  },
};

export const emptyOptionalSections: EditorialRule = {
  id: "empty-optional-sections",
  appliesTo: ["comparison"],
  evaluate: (subject) => {
    if (!subject.facts.hasBestFor && !subject.facts.hasNotRecommendedFor) {
      return warn("empty-optional-sections", "Neither 'Best For' nor 'Not Recommended For' is filled in for any side.", "Add at least a 'Best For' note per side — these render only when present, so this is optional but recommended.");
    }
    return pass("empty-optional-sections");
  },
};

const THIN_CONTENT_MIN_CHARS: Record<string, number> = {
  review: 1200,
  aiTool: 400,
  prompt: 40,
  comparison: 200,
};

export const thinContent: EditorialRule = {
  id: "thin-content",
  evaluate: (subject) => {
    const min = THIN_CONTENT_MIN_CHARS[subject.kind] ?? 200;
    const len = subject.bodyText.trim().length;
    if (len < min) {
      return warn("thin-content", `Body content is ${len} characters, below the ${min}-character guideline for ${subject.kind}.`, "Expand the content, or verify this is intentionally brief.");
    }
    return pass("thin-content");
  },
};

/** Factual completeness for AI Tools specifically — the fields Authority
 *  Sprint 1 was built to fact-check. This rule only checks PRESENCE
 *  (the field exists / was set at some point), not correctness against an
 *  external source — verifying against official sources is necessarily a
 *  research task, not something a synchronous rule can do. */
export const factualCompleteness: EditorialRule = {
  id: "factual-completeness",
  appliesTo: ["aiTool"],
  evaluate: (subject) => {
    const missing: string[] = [];
    if (!subject.facts.hasWebsite) missing.push("website");
    if (!subject.facts.hasTagline) missing.push("tagline");
    if (!subject.facts.hasDescription) missing.push("description");
    if (missing.length > 0) {
      return warn("factual-completeness", `Missing: ${missing.join(", ")}.`, `Fill in: ${missing.join(", ")}.`);
    }
    return pass("factual-completeness");
  },
};
