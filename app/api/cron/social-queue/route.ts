import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getProvider } from "@/lib/social";
import type { SocialPlatform } from "@/lib/social";
import { buildTrackedArticleUrl } from "@/lib/social/url";
import { classifyError, computeNextAttemptAt, isStaleSending, MAX_SEND_ATTEMPTS, STALE_SENDING_THRESHOLD_MS } from "@/lib/social/retry";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function verifyCronSecret(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    // Fail CLOSED: an unset secret must never silently authorize the request.
    console.error("[social-queue] CRON_SECRET is not configured — rejecting request. Set CRON_SECRET to allow this cron to run.");
    return false;
  }
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

/**
 * Atomically claims a single approved (or due-for-retry) post by flipping it
 * to "sending" via a conditional update — the WHERE clause re-checks status
 * at the DB level, so if two workers race on the same row, only one
 * `updateMany` call reports count: 1; the loser sees count: 0 and skips it.
 * This is intentionally NOT a long-held `$transaction` around the Telegram
 * HTTP call — holding a DB transaction open across an external network
 * request would tie up a connection for the request's full duration
 * (up to REQUEST_TIMEOUT_MS in the provider) with no benefit, since the
 * claim itself is already race-safe as a single atomic statement.
 */
async function tryClaimPost(postId: string, expectedStatus: string, now: Date): Promise<boolean> {
  const result = await prisma.socialPost.updateMany({
    where: { id: postId, status: expectedStatus },
    data: { status: "sending", sendingAt: now, lastAttemptAt: now, attemptCount: { increment: 1 } },
  });
  return result.count === 1;
}

/**
 * Decides what a failed send attempt should become: another scheduled retry
 * (transient failure, attempts remaining) or a terminal failure (permanent
 * failure, or the retry budget is exhausted). Extracted from the GET handler
 * so this gating logic — the thing that actually prevents an infinite retry
 * loop — can be exercised directly in tests without a live database.
 */
function decideRetryOutcome(
  err: unknown,
  attemptCount: number,
  now: Date,
): { outcome: "retry-scheduled"; nextAttemptAt: Date } | { outcome: "failed" } {
  const classification = classifyError(err);
  if (classification.kind === "transient" && attemptCount < MAX_SEND_ATTEMPTS) {
    return { outcome: "retry-scheduled", nextAttemptAt: computeNextAttemptAt(attemptCount, classification.retryAfterSeconds, now) };
  }
  return { outcome: "failed" };
}

async function recoverStalePost(postId: string) {
  // A "sending" row older than the threshold means a prior run crashed or
  // timed out mid-send. We cannot know whether Telegram actually received
  // that attempt, so we return it to "approved" and let it be re-claimed —
  // this preserves at-least-once delivery without a false "sent" guarantee.
  // (Full exactly-once would require Telegram-side idempotency, which the
  // Bot API does not offer for sendMessage.)
  await prisma.socialPost.updateMany({
    where: { id: postId, status: "sending" },
    data: { status: "approved" },
  });
}

export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  // Recover stale "sending" rows (abandoned by a crashed/timed-out prior run)
  // before selecting new work, so they become eligible again this pass.
  const staleCandidates = await prisma.socialPost.findMany({
    where: { status: "sending" },
    select: { id: true, sendingAt: true },
  });
  for (const c of staleCandidates) {
    if (c.sendingAt && isStaleSending(c.sendingAt, now)) {
      await recoverStalePost(c.id);
    }
  }

  // Eligible work: newly approved posts, plus previously-failed-but-retryable
  // posts whose backoff window has elapsed (nextAttemptAt is null or past).
  const posts = await prisma.socialPost.findMany({
    where: {
      status: "approved",
      OR: [{ nextAttemptAt: null }, { nextAttemptAt: { lte: now } }],
    },
    include: { account: true },
    orderBy: { createdAt: "asc" },
    take: 10,
  });

  if (posts.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, failed: 0, retried: 0 });
  }

  const results: Array<{ id: string; status: "sent" | "failed" | "retry-scheduled" | "skipped-claim-lost"; error?: string }> = [];

  for (const post of posts) {
    const claimed = await tryClaimPost(post.id, "approved", now);
    if (!claimed) {
      // Another worker (a concurrent invocation, or the admin "send now"
      // button firing at the same moment as the scheduled cron) already
      // claimed this row between our SELECT and our claim attempt.
      results.push({ id: post.id, status: "skipped-claim-lost" });
      continue;
    }

    const review = await prisma.review.findUnique({
      where: { id: post.reviewId },
      select: { slug: true, imageUrl: true },
    });

    const platform = post.platform as SocialPlatform;
    const articleUrl = buildTrackedArticleUrl(review?.slug, platform);

    try {
      const credentials = JSON.parse(post.account.credentials) as Record<string, string>;
      const provider = getProvider(platform);

      const sendResult = await provider.send(
        { caption: post.caption, articleUrl, imageUrl: review?.imageUrl ?? undefined },
        credentials,
      );

      await prisma.socialPost.update({
        where: { id: post.id },
        data: { status: "sent", sentAt: new Date(), externalMessageId: sendResult.id, errorMsg: null },
      });

      results.push({ id: post.id, status: "sent" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      const attemptCount = post.attemptCount + 1; // reflects the increment already applied by tryClaimPost
      const decision = decideRetryOutcome(err, attemptCount, now);

      // Never log credentials — `message` comes only from ProviderError/Error
      // text produced by the providers, which are constructed from Telegram's
      // own description/error_code, never from the credentials object itself.
      console.error(
        `[social-queue] send failed — post=${post.id} platform=${platform} reviewId=${post.reviewId} attempt=${attemptCount}/${MAX_SEND_ATTEMPTS} outcome=${decision.outcome}: ${message}`,
      );

      if (decision.outcome === "retry-scheduled") {
        await prisma.socialPost.update({
          where: { id: post.id },
          data: { status: "approved", nextAttemptAt: decision.nextAttemptAt, errorMsg: message },
        });
        results.push({ id: post.id, status: "retry-scheduled" });
      } else {
        await prisma.socialPost.update({
          where: { id: post.id },
          data: { status: "failed", errorMsg: message },
        });
        results.push({ id: post.id, status: "failed", error: message });
      }
    }
  }

  return NextResponse.json({
    ok: true,
    sent: results.filter((r) => r.status === "sent").length,
    failed: results.filter((r) => r.status === "failed").length,
    retried: results.filter((r) => r.status === "retry-scheduled").length,
    results,
  });
}

// Exported for tests only — not part of the public route contract.
export const __internal = { verifyCronSecret, tryClaimPost, recoverStalePost, decideRetryOutcome, STALE_SENDING_THRESHOLD_MS };
