/**
 * lib/distribution/persistence/task.ts
 *
 * Prisma-backed access to DistributionTask rows — idempotent creation,
 * atomic claiming for the queue, and result persistence. Mirrors the
 * proven pattern in app/api/cron/social-queue/route.ts (tryClaimPost,
 * stale-claim recovery) exactly, generalized to the DistributionTask
 * table so the same race-safety guarantees apply here without
 * re-deriving them.
 */

import { prisma } from "@/lib/db";
import type { DistributionResult } from "../types";
import { STALE_SENDING_THRESHOLD_MS } from "@/lib/social/retry";

export interface CreateTaskIfAbsentInput {
  targetId: string;
  contentType: string;
  contentId: string;
  idempotencyKey: string;
}

/**
 * Creates a DistributionTask in "pending" status unless a task with the
 * same idempotencyKey already exists — in which case this is a no-op and
 * the existing task's id is returned. Relies on the column's `@unique`
 * constraint as the actual race-safety guarantee (a P2002 unique-violation
 * from a concurrent duplicate insert is caught and treated as "already
 * exists", not surfaced as an error) rather than a check-then-insert,
 * which would have a race window between the check and the insert.
 */
export async function createTaskIfAbsent(input: CreateTaskIfAbsentInput): Promise<{ id: string; created: boolean }> {
  const existing = await prisma.distributionTask.findUnique({
    where: { idempotencyKey: input.idempotencyKey },
    select: { id: true },
  });
  if (existing) return { id: existing.id, created: false };

  try {
    const created = await prisma.distributionTask.create({
      data: {
        targetId: input.targetId,
        contentType: input.contentType,
        contentId: input.contentId,
        idempotencyKey: input.idempotencyKey,
        status: "pending",
      },
      select: { id: true },
    });
    return { id: created.id, created: true };
  } catch (err) {
    // P2002 = unique constraint violation — another concurrent caller won
    // the race between our findUnique above and this create. Treat it the
    // same as "already exists", not a failure.
    if (isUniqueConstraintError(err)) {
      const raceWinner = await prisma.distributionTask.findUniqueOrThrow({
        where: { idempotencyKey: input.idempotencyKey },
        select: { id: true },
      });
      return { id: raceWinner.id, created: false };
    }
    throw err;
  }
}

function isUniqueConstraintError(err: unknown): boolean {
  return typeof err === "object" && err !== null && "code" in err && (err as { code?: unknown }).code === "P2002";
}

/** Recovers DistributionTask rows stuck in "sending" past the stale-claim
 *  threshold — same threshold and rationale as lib/social/retry.ts's
 *  isStaleSending, reused unchanged rather than redefined here. */
export async function recoverStaleSendingTasks(now: Date): Promise<number> {
  const cutoff = new Date(now.getTime() - STALE_SENDING_THRESHOLD_MS);
  const result = await prisma.distributionTask.updateMany({
    where: { status: "sending", sendingAt: { lt: cutoff } },
    data: { status: "pending", sendingAt: null },
  });
  return result.count;
}

export interface DueTaskRow {
  id: string;
  targetId: string;
  contentType: string;
  contentId: string;
  attemptCount: number;
}

/** Selects due tasks — status "pending" and either never attempted
 *  (nextAttemptAt null) or past their backoff window. Bounded by `limit`
 *  so one cron invocation never processes an unbounded batch. */
export async function selectDueTasks(now: Date, limit: number): Promise<DueTaskRow[]> {
  return prisma.distributionTask.findMany({
    where: {
      status: "pending",
      OR: [{ nextAttemptAt: null }, { nextAttemptAt: { lte: now } }],
    },
    select: { id: true, targetId: true, contentType: true, contentId: true, attemptCount: true },
    orderBy: { createdAt: "asc" },
    take: limit,
  });
}

/** Atomically claims one task — flips "pending" -> "sending" via a
 *  conditional updateMany, exactly mirroring social-queue's tryClaimPost.
 *  Returns false if another worker already claimed it between selection
 *  and this call. */
export async function tryClaimTask(taskId: string, now: Date): Promise<boolean> {
  const result = await prisma.distributionTask.updateMany({
    where: { id: taskId, status: "pending" },
    data: { status: "sending", sendingAt: now, lastAttemptAt: now, attemptCount: { increment: 1 } },
  });
  return result.count === 1;
}

/** Persists a successful publish result. */
export async function markTaskPublished(taskId: string, result: Extract<DistributionResult, { success: true }>, payloadSnapshot: string): Promise<void> {
  await prisma.distributionTask.update({
    where: { id: taskId },
    data: {
      status: "published",
      sentAt: new Date(),
      externalId: result.externalId,
      externalUrl: result.remoteUrl,
      errorMsg: null,
      payloadSnapshot,
    },
  });
}

/** Persists a scheduled retry — task returns to "pending" with a future
 *  nextAttemptAt, mirroring social-queue's retry-scheduled transition. */
export async function markTaskRetryScheduled(taskId: string, nextAttemptAt: Date, errorMsg: string, payloadSnapshot: string): Promise<void> {
  await prisma.distributionTask.update({
    where: { id: taskId },
    data: { status: "pending", nextAttemptAt, errorMsg, payloadSnapshot },
  });
}

/** Persists a terminal failure — no further automatic retry. */
export async function markTaskFailed(taskId: string, errorMsg: string, payloadSnapshot: string): Promise<void> {
  await prisma.distributionTask.update({
    where: { id: taskId },
    data: { status: "failed", errorMsg, payloadSnapshot },
  });
}

export interface TaskCounts {
  pending: number;
  sending: number;
  published: number;
  failed: number;
  skipped: number;
}

/** Aggregate status counts per target — used by the admin diagnostic route. */
export async function getTaskCountsByTarget(targetId: string): Promise<TaskCounts> {
  const rows = await prisma.distributionTask.groupBy({
    by: ["status"],
    where: { targetId },
    _count: { status: true },
  });

  const counts: TaskCounts = { pending: 0, sending: 0, published: 0, failed: 0, skipped: 0 };
  for (const row of rows) {
    if (row.status in counts) {
      counts[row.status as keyof TaskCounts] = row._count.status;
    }
  }
  return counts;
}

export interface LastOutcome {
  lastSuccessAt: Date | null;
  lastFailureAt: Date | null;
}

/** Most recent success/failure timestamps per target — used by the admin
 *  diagnostic route. Two independent queries rather than one combined
 *  query so a target with no successes yet still reports its last
 *  failure (and vice versa). */
export async function getLastOutcomes(targetId: string): Promise<LastOutcome> {
  const [lastSuccess, lastFailure] = await Promise.all([
    prisma.distributionTask.findFirst({
      where: { targetId, status: "published" },
      orderBy: { sentAt: "desc" },
      select: { sentAt: true },
    }),
    prisma.distributionTask.findFirst({
      where: { targetId, status: "failed" },
      orderBy: { updatedAt: "desc" },
      select: { updatedAt: true },
    }),
  ]);

  return {
    lastSuccessAt: lastSuccess?.sentAt ?? null,
    lastFailureAt: lastFailure?.updatedAt ?? null,
  };
}
