import { describe, it, expect } from "vitest";
import { computeTelegramPerformanceSummary, type SocialPostForSummary } from "./performance";

function row(overrides: Partial<SocialPostForSummary>): SocialPostForSummary {
  return {
    status: "sent",
    createdAt: new Date("2026-01-01"),
    sentAt: null,
    errorMsg: null,
    nextAttemptAt: null,
    attemptCount: 1,
    ...overrides,
  };
}

describe("computeTelegramPerformanceSummary — real-data-only counts", () => {
  it("counts drafted as the total row count regardless of status", () => {
    const rows = [row({ status: "sent" }), row({ status: "failed" }), row({ status: "approved", attemptCount: 0 })];
    expect(computeTelegramPerformanceSummary(rows).drafted).toBe(3);
  });

  it("counts sent, failed, and sending independently", () => {
    const rows = [
      row({ status: "sent" }),
      row({ status: "sent" }),
      row({ status: "failed" }),
      row({ status: "sending" }),
    ];
    const summary = computeTelegramPerformanceSummary(rows);
    expect(summary.sent).toBe(2);
    expect(summary.failed).toBe(1);
    expect(summary.sending).toBe(1);
  });

  it("classifies an approved row with attemptCount > 0 as awaiting retry, not as freshly drafted", () => {
    const rows = [
      row({ status: "approved", attemptCount: 0 }), // never attempted yet
      row({ status: "approved", attemptCount: 2 }), // failed once, scheduled to retry
    ];
    const summary = computeTelegramPerformanceSummary(rows);
    expect(summary.awaitingRetry).toBe(1);
  });

  it("computes success rate only from completed (sent+failed) volume", () => {
    const rows = [row({ status: "sent" }), row({ status: "sent" }), row({ status: "sent" }), row({ status: "failed" })];
    const summary = computeTelegramPerformanceSummary(rows);
    expect(summary.successRate).toBeCloseTo(0.75);
  });

  it("returns null success rate when there is no completed volume (no invented number)", () => {
    const rows = [row({ status: "approved", attemptCount: 0 })];
    const summary = computeTelegramPerformanceSummary(rows);
    expect(summary.successRate).toBeNull();
  });

  it("picks the most recent successful send by sentAt", () => {
    const rows = [
      row({ status: "sent", sentAt: new Date("2026-01-01T10:00:00Z") }),
      row({ status: "sent", sentAt: new Date("2026-01-03T10:00:00Z") }),
      row({ status: "sent", sentAt: new Date("2026-01-02T10:00:00Z") }),
    ];
    const summary = computeTelegramPerformanceSummary(rows);
    expect(summary.mostRecentSuccess?.sentAt).toEqual(new Date("2026-01-03T10:00:00Z"));
  });

  it("picks the most recent failure by createdAt", () => {
    const rows = [
      row({ status: "failed", createdAt: new Date("2026-01-01T10:00:00Z"), errorMsg: "old error" }),
      row({ status: "failed", createdAt: new Date("2026-01-05T10:00:00Z"), errorMsg: "newest error" }),
    ];
    const summary = computeTelegramPerformanceSummary(rows);
    expect(summary.mostRecentFailure?.errorMsg).toBe("newest error");
  });

  it("returns null for most-recent fields when there is no data of that kind", () => {
    const rows = [row({ status: "approved", attemptCount: 0 })];
    const summary = computeTelegramPerformanceSummary(rows);
    expect(summary.mostRecentSuccess).toBeNull();
    expect(summary.mostRecentFailure).toBeNull();
  });

  it("never includes an errorMsg or credential-shaped string as a fabricated metric — only real counts", () => {
    const rows = [row({ status: "sent" })];
    const summary = computeTelegramPerformanceSummary(rows);
    const serialized = JSON.stringify(summary);
    expect(serialized.toLowerCase()).not.toContain("bottoken");
    expect(serialized.toLowerCase()).not.toContain("credentials");
  });
});
