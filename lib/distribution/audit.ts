/**
 * lib/distribution/audit.ts
 *
 * The Audit abstraction — a durable, queryable record of one distribution
 * attempt. Per the approved architecture, a DistributionTask row is itself
 * the primary audit record (status, attempts, last error), matching how
 * SocialPost already serves this role for Telegram today; this module
 * defines that record shape and the pure function that derives it from a
 * DistributionResult, without persisting anything.
 *
 * No storage/query implementation is included in this sprint — persistence
 * is a future sprint's concern once a queue exists to write these records.
 */

import type { DistributionResult, DistributionStatus } from "./types";

/** One traceable audit entry — "what happened when this task was attempted."
 *  Deliberately mirrors the fields a DistributionTask already carries
 *  (see types.ts) so that recording an audit entry is a straightforward
 *  field copy for a future sprint, not a parallel model to keep in sync. */
export interface DistributionAuditEntry {
  taskId: string;
  targetId: string;
  contentId: string;
  status: DistributionStatus;
  attemptNumber: number;
  occurredAt: Date;
  externalId?: string;
  remoteUrl?: string;
  /** Human-readable failure reason. Callers constructing this value must
   *  never include credential material — see docs/distribution-engine-foundation.md
   *  for the sensitive-data discipline this mirrors from lib/social/retry.ts. */
  errorMsg?: string;
}

/** Pure derivation of an audit entry from a dispatch result. Does not
 *  write anywhere — a future sprint's queue is responsible for persisting
 *  the returned value (e.g. onto the DistributionTask row itself, per the
 *  approved "the Job row is the audit trail" design). */
export function buildAuditEntry(params: {
  taskId: string;
  targetId: string;
  contentId: string;
  attemptNumber: number;
  result: DistributionResult;
  occurredAt?: Date;
}): DistributionAuditEntry {
  const occurredAt = params.occurredAt ?? new Date();

  if (params.result.success) {
    return {
      taskId: params.taskId,
      targetId: params.targetId,
      contentId: params.contentId,
      status: "published",
      attemptNumber: params.attemptNumber,
      occurredAt,
      externalId: params.result.externalId,
      remoteUrl: params.result.remoteUrl,
    };
  }

  return {
    taskId: params.taskId,
    targetId: params.targetId,
    contentId: params.contentId,
    status: "failed",
    attemptNumber: params.attemptNumber,
    occurredAt,
    errorMsg: params.result.error.message,
  };
}
