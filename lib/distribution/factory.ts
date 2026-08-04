/**
 * lib/distribution/factory.ts
 *
 * Factory entry points for constructing well-formed core objects in
 * memory. These do not persist anything — no database write, no queue
 * insertion — they exist so that a future sprint's admin UI, migration
 * script, or queue has one canonical, validated way to build a
 * DistributionTarget or DistributionTask shape instead of hand-assembling
 * object literals at each call site.
 */

import type { DistributionStatus, DistributionTarget, DistributionTargetConfig, DistributionTask } from "./types";
import { validateTarget } from "./validation";

export interface CreateTargetInput {
  id: string;
  name: string;
  targetType: string;
  enabled?: boolean;
  credentials: Record<string, unknown>;
  config: DistributionTargetConfig;
}

/** Builds a DistributionTarget from caller-supplied fields, applying
 *  documented defaults (enabled defaults to false — a new target must be
 *  explicitly enabled, never accidentally live). Throws if the resulting
 *  object fails validateTarget, so callers cannot construct an invalid
 *  Target through this entry point. */
export function createDistributionTarget(input: CreateTargetInput): DistributionTarget {
  const target: DistributionTarget = {
    id: input.id,
    name: input.name,
    targetType: input.targetType,
    enabled: input.enabled ?? false,
    credentials: input.credentials,
    config: input.config,
  };

  const result = validateTarget(target);
  if (!result.valid) {
    throw new Error(`Invalid DistributionTarget: ${result.errors.join("; ")}`);
  }

  return target;
}

export interface CreateTaskInput {
  id: string;
  targetId: string;
  contentId: string;
  createdAt?: Date;
}

/** Builds a new DistributionTask in its initial "pending" state — the
 *  shape a future sprint's job-creation step (mirroring how approveReview()
 *  today creates SocialPost rows) would produce, before any attempt has
 *  been made. Retry/timing fields start unset by design; they are only
 *  ever set by a future queue after a real dispatch attempt. */
export function createDistributionTask(input: CreateTaskInput): DistributionTask {
  return {
    id: input.id,
    targetId: input.targetId,
    contentId: input.contentId,
    status: "pending",
    attemptCount: 0,
    createdAt: input.createdAt ?? new Date(),
  };
}

/** Pure state-transition helper: returns a new DistributionTask reflecting
 *  a status change, without mutating the input. Kept here (rather than
 *  inline in a future queue) so the set of valid transitions has one
 *  canonical implementation from the start. Does not enforce a state
 *  machine (e.g. "sending" -> "pending" is allowed, matching the proven
 *  stale-claim-recovery transition in lib/social/retry.ts's design) —
 *  enforcing which transitions are legal in which circumstances is a
 *  future queue's responsibility, since it depends on retry/claim logic
 *  this foundation does not implement. */
export function withStatus(task: DistributionTask, status: DistributionStatus, patch: Partial<DistributionTask> = {}): DistributionTask {
  return { ...task, ...patch, status };
}
