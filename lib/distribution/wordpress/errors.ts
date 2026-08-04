/**
 * lib/distribution/wordpress/errors.ts
 *
 * Converts WordPress REST API responses and network failures into the
 * engine's DistributionError shape — deliberately identical in fields to
 * lib/social/retry.ts's ProviderError (message, httpStatus,
 * retryAfterSeconds, isNetworkError) so that module's classifyError /
 * computeNextAttemptAt can classify WordPress failures unmodified once a
 * future sprint wires retry execution against this Transport. No retry
 * logic lives here — this module only produces the structured error, it
 * never decides what to do with it.
 */

import type { DistributionError } from "../types";

/** Builds a DistributionError from a non-OK WordPress REST response.
 *  `bodyText` is truncated and never assumed to contain credentials (it
 *  is WordPress's own error response body, not request data), but is
 *  still capped defensively so an oversized or unexpected response body
 *  can never bloat an audit log entry.
 *
 *  `retryAfterHeaderSeconds` is read from a `Retry-After` response header
 *  when present — WordPress core itself does not send one, but a
 *  rate-limiting reverse proxy (Cloudflare, a hosting provider's edge)
 *  in front of a real site plausibly does on a 429, so the Transport
 *  passes it through rather than this module assuming it never exists. */
export function classifyWordPressResponseError(status: number, bodyText: string, retryAfterHeaderSeconds?: number): DistributionError {
  return {
    message: `WordPress API error ${status}: ${bodyText.slice(0, 300)}`,
    httpStatus: status,
    retryAfterSeconds: status === 429 ? retryAfterHeaderSeconds : undefined,
  };
}

/** Builds a DistributionError for a network-level failure (fetch threw:
 *  DNS failure, connection refused, TLS error, or an aborted request). */
export function classifyWordPressNetworkError(err: unknown): DistributionError {
  const isAbort = err instanceof Error && err.name === "AbortError";
  return {
    message: isAbort ? "WordPress request timed out" : `WordPress network error: ${err instanceof Error ? err.message : String(err)}`,
    isNetworkError: true,
  };
}

/** Builds a DistributionError for a caller-side configuration problem
 *  (invalid target config, missing credentials) — never a network or
 *  WordPress-side failure, so it carries no httpStatus/isNetworkError,
 *  which the future retry engine's classifyError treats as "permanent"
 *  by default (no structured transient signal), matching the intent that
 *  a bad configuration must never be silently retried forever. */
export function classifyWordPressConfigError(message: string): DistributionError {
  return { message: `WordPress configuration error: ${message}` };
}
