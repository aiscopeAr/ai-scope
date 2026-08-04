/**
 * lib/distribution/resolution.ts
 *
 * Deterministic target resolution: given a piece of content's type and
 * category, and a candidate list of DistributionTargets, decide which
 * targets should receive a DistributionTask. Pure — takes the candidate
 * targets as an argument rather than querying for them, so it has no
 * database dependency and is fully unit-testable.
 *
 * Generic across targetType and contentType by construction — nothing in
 * this file references "wordpress" or "review" specifically, and nothing
 * references any partner name or category ID. A caller (task-creation
 * code) is responsible for deciding *which* contentType it's resolving
 * for and passing the right candidate targets and content metadata.
 */

import type { DistributionTarget } from "./types";
import { isTargetActive, matchesCategoryFilter } from "./validation";

export interface ResolutionInput {
  /** The content's own type discriminator (e.g. "review") — resolution
   *  does not special-case any specific value; it exists purely so a
   *  future non-Review content type can share this function without a
   *  targetType change. Not currently filtered on by this function since
   *  no DistributionTarget yet declares a contentType restriction — see
   *  the note on DistributionTargetConfig.extra if that need arises. */
  contentType: string;
  category?: string;
}

/**
 * Returns the subset of `candidateTargets` that should receive a
 * DistributionTask for this content. A target is selected when:
 *   1. it is enabled and structurally valid (isTargetActive), and
 *   2. its categoryFilter (if any) matches the content's category.
 *
 * Deliberately does NOT filter on targetType here — the caller passes in
 * only the candidate targets it already wants considered (e.g. "only
 * enabled WordPress targets" per Sprint 4's Phase 1 scope), so this
 * function stays agnostic to which target types exist. No fallback
 * guessing: a target with a categoryFilter that doesn't match is simply
 * excluded, never substituted with a "best guess."
 */
export function resolveDistributionTargets(input: ResolutionInput, candidateTargets: DistributionTarget[]): DistributionTarget[] {
  return candidateTargets.filter((target) => {
    if (!isTargetActive(target)) return false;
    return matchesCategoryFilter(target.config, input.category);
  });
}
