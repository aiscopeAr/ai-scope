/**
 * lib/editorial-engine/rules/connectivity.ts
 *
 * Content-type-specific relational connectivity — distinct from generic
 * internal-linking (rules/linking.ts), this checks DB-relation-driven
 * connections that aren't [[...]] tokens at all: a Prompt's toolId FK, a
 * ComparisonSide's toolId FK, an AITool's inbound ComparisonSide/Prompt
 * relations. These are precomputed by the caller (the CLI runner) into
 * subject.facts before rules run, matching the same signals Authority
 * Sprint 1 checked by hand.
 */
import type { EditorialRule, RuleResult } from "../types";

function pass(ruleId: string): RuleResult {
  return { ruleId, status: "PASS", severity: "info", explanation: "OK", suggestedFix: null };
}
function warn(ruleId: string, explanation: string, suggestedFix: string): RuleResult {
  return { ruleId, status: "WARNING", severity: "warning", explanation, suggestedFix };
}

export const connectivityTool: EditorialRule = {
  id: "connectivity-tool",
  appliesTo: ["aiTool"],
  evaluate: (subject) => {
    const missing: string[] = [];
    const hasComparison = subject.facts.hasComparisonRelation || subject.outboundLinks.some((l) => l.type === "compare");
    const hasPrompt = subject.facts.hasPromptRelation || subject.outboundLinks.some((l) => l.type === "prompt");
    if (!hasComparison) missing.push("comparison");
    if (!hasPrompt) missing.push("prompt");
    if (missing.length > 0) {
      return warn("connectivity-tool", `Not connected to any ${missing.join(" or ")}.`, `Link to a relevant ${missing.join(" or ")} (via a ComparisonSide, Prompt.toolId, or a [[...]] token).`);
    }
    return pass("connectivity-tool");
  },
};

export const connectivityPrompt: EditorialRule = {
  id: "connectivity-prompt",
  appliesTo: ["prompt"],
  evaluate: (subject) => {
    if (subject.facts.linkedToolPublished === undefined) {
      // toolId is nullable — many prompts are genuinely tool-agnostic
      // (confirmed in the Sprint 2 content audit), so having no linked
      // tool at all is not itself a finding.
      return pass("connectivity-prompt");
    }
    if (subject.facts.linkedToolPublished === false) {
      return warn("connectivity-prompt", "Linked tool is unpublished.", "Link to a published tool, or remove the link.");
    }
    return pass("connectivity-prompt");
  },
};

export const connectivityComparison: EditorialRule = {
  id: "connectivity-comparison",
  appliesTo: ["comparison"],
  evaluate: (subject) => {
    if (subject.facts.linkedToolPublished === false) {
      return warn("connectivity-comparison", "At least one side's tool is unpublished.", "Publish the tool or replace the side.");
    }
    return pass("connectivity-comparison");
  },
};

export const connectivityReview: EditorialRule = {
  id: "connectivity-review",
  appliesTo: ["review"],
  evaluate: (subject) => {
    if (subject.outboundLinks.length === 0) {
      return warn("connectivity-review", "No outbound links to tools, comparisons, or prompts.", "Add at least one relevant [[...]] link.");
    }
    return pass("connectivity-review");
  },
};
