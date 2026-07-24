/**
 * lib/social/retry.ts
 *
 * Classifies a send failure as transient (worth retrying) or permanent
 * (terminal), and computes backoff timing. Pure functions — no I/O — so the
 * cron route only has to decide *what* to do with the classification, not
 * *how* to derive it.
 */

export const MAX_SEND_ATTEMPTS = 5;

export type FailureKind = "transient" | "permanent";

export interface ClassifiedError {
  kind: FailureKind;
  /** Telegram's `retry_after` (seconds), when the failure was a 429 that supplied one. */
  retryAfterSeconds?: number;
}

/**
 * A structured shape any provider can throw to give the retry logic real
 * signal (HTTP status, Telegram's retry_after) instead of parsing message
 * strings. Providers that only throw a plain Error are still handled —
 * classifyError falls back to treating them as permanent, matching prior
 * behavior for unrecognized failures.
 */
export class ProviderError extends Error {
  readonly httpStatus?: number;
  readonly retryAfterSeconds?: number;
  readonly isNetworkError: boolean;

  constructor(message: string, opts?: { httpStatus?: number; retryAfterSeconds?: number; isNetworkError?: boolean }) {
    super(message);
    this.name = "ProviderError";
    this.httpStatus = opts?.httpStatus;
    this.retryAfterSeconds = opts?.retryAfterSeconds;
    this.isNetworkError = opts?.isNetworkError ?? false;
  }
}

/** Classifies a thrown error into transient vs. permanent. */
export function classifyError(err: unknown): ClassifiedError {
  if (err instanceof ProviderError) {
    if (err.isNetworkError) return { kind: "transient" };

    if (err.httpStatus === 429) {
      return { kind: "transient", retryAfterSeconds: err.retryAfterSeconds };
    }
    if (err.httpStatus !== undefined) {
      // Telegram/Twitter/etc. 5xx = transient (server-side, likely temporary);
      // 4xx (other than 429) = permanent (bad token, chat not found, malformed request).
      if (err.httpStatus >= 500) return { kind: "transient" };
      return { kind: "permanent" };
    }
  }

  // Unrecognized error shape (plain Error, JSON parse failure, etc.) —
  // no structured signal to retry on, so treat as permanent to avoid an
  // unbounded retry loop on errors we don't understand.
  return { kind: "permanent" };
}

/**
 * Stepped backoff: 1m, 5m, 15m, 30m, 60m — capped at MAX_SEND_ATTEMPTS.
 * A Telegram-supplied retry_after (429) always takes precedence when present.
 */
const BACKOFF_STEPS_SECONDS = [60, 300, 900, 1800, 3600];

export function computeNextAttemptAt(attemptCount: number, retryAfterSeconds: number | undefined, now: Date): Date {
  if (retryAfterSeconds && retryAfterSeconds > 0) {
    return new Date(now.getTime() + retryAfterSeconds * 1000);
  }
  const step = BACKOFF_STEPS_SECONDS[Math.min(attemptCount, BACKOFF_STEPS_SECONDS.length - 1)];
  return new Date(now.getTime() + step * 1000);
}

/** A "sending" row older than this is assumed abandoned by a crashed/killed process. */
export const STALE_SENDING_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes — well above maxDuration=60s per send

export function isStaleSending(sendingAt: Date, now: Date): boolean {
  return now.getTime() - sendingAt.getTime() > STALE_SENDING_THRESHOLD_MS;
}
