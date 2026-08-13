import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getFormatter } from "@/lib/distribution/formatter";
import { getTransport } from "@/lib/distribution/transport";
import { registerWordPressTarget } from "@/lib/distribution/wordpress/register";
import { getTargetWithCredentials } from "@/lib/distribution/persistence/target";
import {
  recoverStaleSendingTasks,
  selectDueTasks,
  tryClaimTask,
  markTaskPublished,
  markTaskFailed,
  markTaskRetryScheduled,
  type DueTaskRow,
} from "@/lib/distribution/persistence/task";
import { mapReviewToDistributableContent } from "@/lib/distribution/wordpress/review-mapper";
import { classifyError, computeNextAttemptAt, MAX_SEND_ATTEMPTS, ProviderError } from "@/lib/social/retry";
import type { DistributionError } from "@/lib/distribution/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Registers the WordPress Formatter/Transport into the Distribution
// Engine's registries — idempotent, so safe on every invocation. Without
// this, getFormatter/getTransport("wordpress") return undefined and every
// WordPress task fails with "No Formatter/Transport registered".
registerWordPressTarget();

/** Same batch size as social-queue — bounds one invocation's work so it
 *  stays well within maxDuration regardless of external API latency. */
const BATCH_SIZE = 10;

function verifyCronSecret(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    // Fail CLOSED — same posture as social-queue, and stricter than most of
    // Lumiq's other cron routes (see Sprint 1 architecture doc's note on
    // cron-auth inconsistency): this route dispatches to a real external
    // publisher, so an unset secret must never silently authorize it.
    console.error("[distribution-queue] CRON_SECRET is not configured — rejecting request. Set CRON_SECRET to allow this cron to run.");
    return false;
  }
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

/**
 * Loads and maps the content for one DistributionTask. Only "review" is
 * supported in this sprint — any other contentType is a permanent
 * configuration error (a task was created for a content type this cron
 * doesn't know how to load), not a transient one, since retrying it can
 * never succeed without a code change.
 */
async function loadDistributableContent(task: DueTaskRow) {
  if (task.contentType !== "review") {
    throw new UnsupportedContentTypeError(task.contentType);
  }

  const review = await prisma.review.findUnique({
    where: { id: task.contentId },
    select: {
      id: true,
      titleAr: true,
      content: true,
      summary: true,
      slug: true,
      imageUrl: true,
      tags: true,
      publishedAt: true,
      sources: true,
      category: { select: { slug: true, nameAr: true } },
    },
  });

  if (!review) {
    throw new Error(`Review ${task.contentId} not found (may have been deleted after task creation)`);
  }

  return mapReviewToDistributableContent(review);
}

class UnsupportedContentTypeError extends Error {
  constructor(contentType: string) {
    super(`Unsupported contentType "${contentType}" — distribution-queue only handles "review" in this sprint`);
    this.name = "UnsupportedContentTypeError";
  }
}

/** Converts a DistributionResult's failure branch into a real
 *  lib/social/retry.ts ProviderError instance, so classifyError's
 *  `instanceof ProviderError` check (and therefore its structured
 *  transient/permanent classification) applies to it exactly as it does
 *  to a Telegram send failure. DistributionError's fields are already a
 *  deliberate mirror of ProviderError's constructor options (see
 *  lib/distribution/types.ts's doc comment on DistributionError) — this
 *  is a field copy into the real class, not new classification logic. */
function toProviderError(error: DistributionError): ProviderError {
  return new ProviderError(error.message, {
    httpStatus: error.httpStatus,
    retryAfterSeconds: error.retryAfterSeconds,
    isNetworkError: error.isNetworkError,
  });
}

type TaskResultStatus = "published" | "failed" | "retry-scheduled" | "skipped-claim-lost" | "skipped-no-adapter";

interface TaskResult {
  id: string;
  status: TaskResultStatus;
  error?: string;
}

export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  // Recover stale "sending" rows abandoned by a crashed/timed-out prior run.
  await recoverStaleSendingTasks(now);

  const dueTasks = await selectDueTasks(now, BATCH_SIZE);
  if (dueTasks.length === 0) {
    return NextResponse.json({ ok: true, published: 0, failed: 0, retried: 0 });
  }

  const results: TaskResult[] = [];

  for (const task of dueTasks) {
    const claimed = await tryClaimTask(task.id, now);
    if (!claimed) {
      // Another worker (a concurrent invocation) already claimed this row
      // between selection and this claim attempt.
      results.push({ id: task.id, status: "skipped-claim-lost" });
      continue;
    }

    const target = await getTargetWithCredentials(task.targetId);
    if (!target) {
      // Target was disabled or deleted after the task was created — this is
      // a permanent condition (retrying won't make a disabled target valid
      // again on its own), so the task fails terminally rather than retrying
      // forever. Re-enabling the target and manually resetting the task is
      // an operator action, not something this cron does automatically.
      await markTaskFailed(task.id, "Target is disabled or no longer exists", "{}");
      results.push({ id: task.id, status: "skipped-no-adapter", error: "target disabled or missing" });
      continue;
    }

    const formatter = getFormatter(target.targetType);
    const transport = getTransport(target.targetType);
    if (!formatter || !transport) {
      // No adapter registered for this targetType — a deployment/config
      // error (the formatter/transport registration entry point was never
      // called), not something a retry can fix.
      await markTaskFailed(task.id, `No Formatter/Transport registered for targetType "${target.targetType}"`, "{}");
      results.push({ id: task.id, status: "skipped-no-adapter", error: "no adapter registered" });
      continue;
    }

    const attemptCount = task.attemptCount + 1; // reflects the increment already applied by tryClaimTask

    try {
      const content = await loadDistributableContent(task);
      const formatted = formatter.format(content, target.config);
      // payloadSnapshot never includes target.credentials — only the
      // formatted content payload, which contains no secret material.
      const payloadSnapshot = JSON.stringify(formatted);

      const sendResult = await transport.publish(formatted, target);

      if (sendResult.success) {
        await markTaskPublished(task.id, sendResult, payloadSnapshot);
        results.push({ id: task.id, status: "published" });
        continue;
      }

      // Transport reported a structured failure (not a thrown exception) —
      // classify and decide retry vs. terminal failure the same way
      // social-queue does for a caught Telegram send error.
      const classification = classifyError(toProviderError(sendResult.error));
      console.error(
        `[distribution-queue] publish failed — task=${task.id} target=${target.targetType} contentId=${task.contentId} attempt=${attemptCount}/${MAX_SEND_ATTEMPTS}: ${sendResult.error.message}`,
      );

      if (classification.kind === "transient" && attemptCount < MAX_SEND_ATTEMPTS) {
        const nextAttemptAt = computeNextAttemptAt(attemptCount, classification.retryAfterSeconds, now);
        await markTaskRetryScheduled(task.id, nextAttemptAt, sendResult.error.message, payloadSnapshot);
        results.push({ id: task.id, status: "retry-scheduled" });
      } else {
        await markTaskFailed(task.id, sendResult.error.message, payloadSnapshot);
        results.push({ id: task.id, status: "failed", error: sendResult.error.message });
      }
    } catch (err) {
      // An unexpected thrown error (content-loading failure, formatter
      // throw, etc.) rather than a structured DistributionResult failure.
      // UnsupportedContentTypeError is always permanent; anything else
      // falls through classifyError's default-to-permanent behavior for
      // unrecognized error shapes.
      const message = err instanceof Error ? err.message : String(err);
      const isPermanentByType = err instanceof UnsupportedContentTypeError;
      console.error(`[distribution-queue] task processing failed — task=${task.id} attempt=${attemptCount}/${MAX_SEND_ATTEMPTS}: ${message}`);

      if (!isPermanentByType && attemptCount < MAX_SEND_ATTEMPTS) {
        const classification = classifyError(err);
        if (classification.kind === "transient") {
          const nextAttemptAt = computeNextAttemptAt(attemptCount, classification.retryAfterSeconds, now);
          await markTaskRetryScheduled(task.id, nextAttemptAt, message, "{}");
          results.push({ id: task.id, status: "retry-scheduled" });
          continue;
        }
      }
      await markTaskFailed(task.id, message, "{}");
      results.push({ id: task.id, status: "failed", error: message });
    }
  }

  return NextResponse.json({
    ok: true,
    published: results.filter((r) => r.status === "published").length,
    failed: results.filter((r) => r.status === "failed" || r.status === "skipped-no-adapter").length,
    retried: results.filter((r) => r.status === "retry-scheduled").length,
    results,
  });
}

// Exported for tests only — not part of the public route contract.
export const __internal = { verifyCronSecret, loadDistributableContent, UnsupportedContentTypeError };
