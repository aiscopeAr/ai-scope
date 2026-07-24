/**
 * lib/editorial-engine/policy.ts
 *
 * Publishing policy — kept separate from the engine itself so the
 * "when is a piece of content allowed to go live" question can change
 * (e.g. a stricter policy for a new domain) without touching the rules
 * or the scoring model.
 */
import type { EvaluationReport } from "./core";

export type PublishingPolicy = "block-on-error" | "allow-with-warnings";

export interface PublishDecision {
  allowed: boolean;
  policy: PublishingPolicy;
  reason: string;
}

export function canPublish(report: EvaluationReport, policy: PublishingPolicy = "block-on-error"): PublishDecision {
  if (policy === "block-on-error") {
    if (report.errorCount > 0) {
      return { allowed: false, policy, reason: `${report.errorCount} ERROR(s) must be resolved before publishing.` };
    }
    return { allowed: true, policy, reason: report.warningCount > 0 ? `Publishable with ${report.warningCount} warning(s).` : "All checks pass." };
  }
  // "allow-with-warnings" — warnings never block, but errors always do;
  // policies are permitted to differ only in how they treat WARNING, never ERROR.
  if (report.errorCount > 0) {
    return { allowed: false, policy, reason: `${report.errorCount} ERROR(s) must be resolved before publishing.` };
  }
  return { allowed: true, policy, reason: "Warnings do not block publication under this policy." };
}
