/**
 * lib/editorial-engine/core.ts
 *
 * The engine itself: takes a subject + context + a rule set, runs every
 * rule that applies to that subject's content kind, and returns the raw
 * results. Scoring (scoring.ts) and publishing-policy (policy.ts) are
 * layered on top of this — this file only knows how to run rules.
 */
import type { EditorialContext, EditorialRule, EditorialSubject, RuleResult } from "./types";

export interface EvaluationReport {
  subject: EditorialSubject;
  results: RuleResult[];
  errorCount: number;
  warningCount: number;
  passCount: number;
}

export function evaluateSubject(
  subject: EditorialSubject,
  context: EditorialContext,
  rules: EditorialRule[],
): EvaluationReport {
  const applicable = rules.filter((r) => !r.appliesTo || r.appliesTo.includes(subject.kind));
  const results = applicable.map((r) => {
    try {
      return r.evaluate(subject, context);
    } catch (e) {
      // A rule throwing is a bug in the rule, not a reason to crash the
      // whole engine run — surface it as an ERROR on that one rule so a
      // single bad rule can't silently hide every other finding.
      return {
        ruleId: r.id,
        status: "ERROR" as const,
        severity: "error" as const,
        explanation: `Rule threw an exception: ${e instanceof Error ? e.message : String(e)}`,
        suggestedFix: "Fix the rule implementation.",
      };
    }
  });

  return {
    subject,
    results,
    errorCount: results.filter((r) => r.status === "ERROR").length,
    warningCount: results.filter((r) => r.status === "WARNING").length,
    passCount: results.filter((r) => r.status === "PASS").length,
  };
}

export function evaluateAll(
  subjects: EditorialSubject[],
  contextFor: (subject: EditorialSubject) => EditorialContext,
  rules: EditorialRule[],
): EvaluationReport[] {
  return subjects.map((s) => evaluateSubject(s, contextFor(s), rules));
}
