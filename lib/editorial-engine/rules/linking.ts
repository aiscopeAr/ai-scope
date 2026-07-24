/**
 * lib/editorial-engine/rules/linking.ts
 * Internal linking, orphan-page detection, broken internal/external links.
 */
import type { EditorialRule, RuleResult } from "../types";

function pass(ruleId: string): RuleResult {
  return { ruleId, status: "PASS", severity: "info", explanation: "OK", suggestedFix: null };
}
function warn(ruleId: string, explanation: string, suggestedFix: string): RuleResult {
  return { ruleId, status: "WARNING", severity: "warning", explanation, suggestedFix };
}

export const internalLinkingOutbound: EditorialRule = {
  id: "internal-linking-outbound",
  evaluate: (subject) => {
    if (subject.kind === "prompt") {
      // Prompts are copy-paste content; Sprint 4 deliberately excluded them
      // from the [[...]] system, so "zero outbound links" is correct here,
      // not a gap — this rule intentionally always passes for prompts.
      return pass("internal-linking-outbound");
    }
    if (subject.outboundLinks.length === 0) {
      return warn("internal-linking-outbound", `${subject.kind} "${subject.slug}" has zero outbound internal links.`, "Add at least one [[type:slug|label]] link to a genuinely related review, tool, comparison, or prompt.");
    }
    return pass("internal-linking-outbound");
  },
};

export const internalLinkingBroken: EditorialRule = {
  id: "internal-linking-broken",
  evaluate: (subject, context) => {
    const broken = subject.outboundLinks.filter((l) => !context.linkableSlugs[l.type]?.has(l.slug));
    if (broken.length > 0) {
      return {
        ruleId: "internal-linking-broken",
        status: "ERROR",
        severity: "error",
        explanation: `${broken.length} outbound link(s) point to a non-existent or unpublished target: ${broken.map((l) => `[[${l.type}:${l.slug}]]`).join(", ")}.`,
        suggestedFix: "Fix the slug, or remove the link if the target was deleted/unpublished.",
      };
    }
    return pass("internal-linking-broken");
  },
};

export const orphanPage: EditorialRule = {
  id: "orphan-page",
  evaluate: (subject, context) => {
    if (!subject.published) return pass("orphan-page"); // unpublished content isn't expected to be linked yet
    if (!context.inboundLinkedSlugs.has(subject.slug)) {
      return warn("orphan-page", `Nothing else on the site links to this ${subject.kind} — it is only reachable via listing pages/sitemap.`, "Add an inbound [[type:slug|label]] link from at least one related piece of content.");
    }
    return pass("orphan-page");
  },
};

export const relatedContent: EditorialRule = {
  id: "related-content",
  appliesTo: ["aiTool"],
  evaluate: (subject, context) => {
    // AI Tools have an explicit 4-way related-content requirement (Authority
    // Sprint 1's objective 9): at least one review, comparison, prompt, and
    // related tool. This rule only checks outbound-link coverage for
    // review/compare/prompt (the DB-relation-driven ones — comparisons via
    // ComparisonSide and prompts via Prompt.toolId — are checked by the
    // caller before building context.inboundLinkedSlugs, since those aren't
    // [[...]] links at all).
    const linkedTypes = new Set(subject.outboundLinks.map((l) => l.type));
    const missing: string[] = [];
    if (!linkedTypes.has("review") && !context.inboundLinkedSlugs.has(subject.slug)) missing.push("review");
    if (missing.length === 0) return pass("related-content");
    return warn("related-content", `Missing a linked ${missing.join(", ")} for this tool.`, `Add or link a relevant ${missing.join(", ")}.`);
  },
};
