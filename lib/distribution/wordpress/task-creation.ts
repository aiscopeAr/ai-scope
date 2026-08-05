/**
 * lib/distribution/wordpress/task-creation.ts
 *
 * Orchestrates "a Review was published — create DistributionTasks for any
 * matching WordPress targets." This is the single function approveReview()
 * calls (see the one new call site added there). It is best-effort by
 * design: any failure here is caught and logged by the caller, never
 * allowed to block Review publication, matching the existing posture of
 * syndicateReviewToWordPress() and the SocialPost-drafting block already
 * in approveReview().
 *
 * Scope for this sprint (Phase 1, per the mission): only enabled WordPress
 * targets, only Review content. Not Telegram, not any other content type —
 * the function signature and resolution logic underneath are generic, but
 * this call site deliberately restricts itself.
 */

import { prisma } from "@/lib/db";
import { resolveDistributionTargets } from "../resolution";
import { createTaskIfAbsent } from "../persistence/task";
import { buildWordPressIdempotencyKey } from "./idempotency";
import { WORDPRESS_TARGET_TYPE } from "./formatter";
import { listTargetSummaries } from "../persistence/target";

const CONTENT_TYPE_REVIEW = "review";

export interface CreateWordPressTasksForReviewResult {
  targetsConsidered: number;
  tasksCreated: number;
  tasksAlreadyExisted: number;
}

/**
 * Resolves enabled WordPress targets matching the Review's category and
 * creates one DistributionTask per match, skipping any that already exist
 * (idempotent — safe to call again on a re-approval or a retried request).
 * Never throws for "no matching targets" — that's the ordinary case when
 * no WordPress target is configured yet, not an error.
 */
export async function createWordPressTasksForReview(review: { id: string; categorySlug: string }): Promise<CreateWordPressTasksForReviewResult> {
  const targetSummaries = await listTargetSummaries();
  const wordpressTargets = targetSummaries.filter((t) => t.targetType === WORDPRESS_TARGET_TYPE);

  if (wordpressTargets.length === 0) {
    return { targetsConsidered: 0, tasksCreated: 0, tasksAlreadyExisted: 0 };
  }

  // resolveDistributionTargets needs full DistributionTarget objects
  // (including credentials) per its type signature, but this call site
  // never reads or uses .credentials — it only needs .enabled/.config for
  // the enabled + category-filter check. We pass an empty credentials
  // object rather than fetching real ones, since task creation has no
  // business touching secret material at all.
  const candidates = wordpressTargets.map((t) => ({
    id: t.id,
    name: t.name,
    targetType: t.targetType,
    enabled: t.enabled,
    config: t.config,
    credentials: {},
  }));

  // "now" is used as the content's eligibility timestamp rather than
  // threading Review.publishedAt through from approveReview() — this
  // function runs synchronously inside the same approval call that sets
  // publishedAt to `new Date()`, so the two are effectively identical, and
  // this keeps the no-backfill guard entirely inside the Distribution
  // Engine's own code without touching review-queue.ts's call signature.
  const matched = resolveDistributionTargets(
    { contentType: CONTENT_TYPE_REVIEW, category: review.categorySlug, contentTimestamp: new Date() },
    candidates,
  );

  let tasksCreated = 0;
  let tasksAlreadyExisted = 0;

  for (const target of matched) {
    const idempotencyKey = buildWordPressIdempotencyKey(review.id, target.id);
    const { created } = await createTaskIfAbsent({
      targetId: target.id,
      contentType: CONTENT_TYPE_REVIEW,
      contentId: review.id,
      idempotencyKey,
    });
    if (created) tasksCreated++;
    else tasksAlreadyExisted++;
  }

  return { targetsConsidered: matched.length, tasksCreated, tasksAlreadyExisted };
}

/** Convenience wrapper that also resolves the Review's category slug —
 *  used by approveReview(), which already has the Review's categoryId but
 *  not necessarily its slug loaded. Kept separate from
 *  createWordPressTasksForReview so that function's core logic stays
 *  testable without a real Prisma category lookup. */
export async function createWordPressTasksForReviewId(reviewId: string, categoryId: string): Promise<CreateWordPressTasksForReviewResult> {
  const category = await prisma.category.findUniqueOrThrow({ where: { id: categoryId }, select: { slug: true } });
  return createWordPressTasksForReview({ id: reviewId, categorySlug: category.slug });
}
