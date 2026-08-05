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
  /** When this content became eligible for distribution (e.g. a Review's
   *  publish moment). Used only for the no-backfill check below — omit it
   *  and every target's `activatedAt` boundary is treated as satisfied
   *  (opt-in: a caller that never passes this gets the pre-existing
   *  behavior, since not every content type needs backfill protection). */
  contentTimestamp?: Date;
}

/** True when `target` should be excluded because the content predates the
 *  target's own activation boundary — the no-backfill guarantee. A target
 *  with no `activatedAt` set has never been explicitly activated for
 *  timestamp-gated dispatch, so it is NOT excluded by this check (it falls
 *  back to being gated by `enabled` alone, matching behavior before this
 *  guard existed) — `activatedAt` is an additive safety net, not a
 *  replacement for `enabled`. */
function predatesActivation(target: DistributionTarget, contentTimestamp: Date | undefined): boolean {
  const activatedAt = target.config.activatedAt;
  if (!activatedAt || !contentTimestamp) return false;
  return contentTimestamp.getTime() < new Date(activatedAt).getTime();
}

/**
 * Returns the subset of `candidateTargets` that should receive a
 * DistributionTask for this content. A target is selected when:
 *   1. it is enabled and structurally valid (isTargetActive),
 *   2. its categoryFilter (if any) matches the content's category, and
 *   3. the content's timestamp is not before the target's activatedAt
 *      boundary (the no-backfill guarantee — see predatesActivation above).
 *
 * Deliberately does NOT filter on targetType here — the caller passes in
 * only the candidate targets it already wants considered (e.g. "only
 * enabled WordPress targets" per Sprint 4's Phase 1 scope), so this
 * function stays agnostic to which target types exist. No fallback
 * guessing: a target with a categoryFilter that doesn't match, or content
 * that predates activation, is simply excluded, never substituted with a
 * "best guess."
 */
export function resolveDistributionTargets(input: ResolutionInput, candidateTargets: DistributionTarget[]): DistributionTarget[] {
  return candidateTargets.filter((target) => {
    if (!isTargetActive(target)) return false;
    if (predatesActivation(target, input.contentTimestamp)) return false;
    return matchesCategoryFilter(target.config, input.category);
  });
}
