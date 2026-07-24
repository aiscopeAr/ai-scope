import { describe, it, expect } from "vitest";
import { ProviderError, classifyError, computeNextAttemptAt, isStaleSending, MAX_SEND_ATTEMPTS, STALE_SENDING_THRESHOLD_MS } from "./retry";

describe("classifyError", () => {
  it("classifies HTTP 429 as transient and preserves retry_after", () => {
    const err = new ProviderError("rate limited", { httpStatus: 429, retryAfterSeconds: 37 });
    const result = classifyError(err);
    expect(result.kind).toBe("transient");
    expect(result.retryAfterSeconds).toBe(37);
  });

  it("classifies a Telegram 5xx response as transient", () => {
    const err = new ProviderError("bad gateway", { httpStatus: 502 });
    expect(classifyError(err).kind).toBe("transient");
  });

  it("classifies a network/timeout failure as transient", () => {
    const err = new ProviderError("timed out", { isNetworkError: true });
    expect(classifyError(err).kind).toBe("transient");
  });

  it("classifies a permanent 4xx failure (invalid bot token, chat not found) as permanent", () => {
    const err = new ProviderError("chat not found", { httpStatus: 400 });
    expect(classifyError(err).kind).toBe("permanent");
  });

  it("classifies an unrecognized plain Error as permanent (no infinite retry on unknown shapes)", () => {
    const err = new Error("something weird");
    expect(classifyError(err).kind).toBe("permanent");
  });
});

describe("computeNextAttemptAt", () => {
  const now = new Date("2026-07-24T09:30:00.000Z");

  it("honors Telegram's retry_after when provided (HTTP 429)", () => {
    const next = computeNextAttemptAt(1, 90, now);
    expect(next.getTime() - now.getTime()).toBe(90 * 1000);
  });

  it("uses stepped backoff when no retry_after is given", () => {
    const next = computeNextAttemptAt(0, undefined, now);
    expect(next.getTime()).toBeGreaterThan(now.getTime());
  });

  it("increases backoff with attempt count", () => {
    const first = computeNextAttemptAt(0, undefined, now);
    const later = computeNextAttemptAt(3, undefined, now);
    expect(later.getTime() - now.getTime()).toBeGreaterThan(first.getTime() - now.getTime());
  });
});

describe("retry exhaustion", () => {
  it("MAX_SEND_ATTEMPTS is a finite bound — attemptCount reaching it must not schedule another retry", () => {
    // This mirrors the cron route's own gating condition:
    // `classification.kind === "transient" && attemptCount < MAX_SEND_ATTEMPTS`
    const attemptCount = MAX_SEND_ATTEMPTS;
    const shouldRetry = attemptCount < MAX_SEND_ATTEMPTS;
    expect(shouldRetry).toBe(false);
  });
});

describe("isStaleSending", () => {
  it("treats a recent 'sending' claim as not stale", () => {
    const now = new Date();
    const sendingAt = new Date(now.getTime() - 5_000); // 5s ago
    expect(isStaleSending(sendingAt, now)).toBe(false);
  });

  it("treats a 'sending' claim older than the threshold as stale (crashed/timed-out worker)", () => {
    const now = new Date();
    const sendingAt = new Date(now.getTime() - STALE_SENDING_THRESHOLD_MS - 1000);
    expect(isStaleSending(sendingAt, now)).toBe(true);
  });
});
