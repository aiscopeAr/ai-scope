import { describe, it, expect } from "vitest";
import { buildAuditEntry } from "./audit";

describe("buildAuditEntry", () => {
  it("builds a published entry from a successful result", () => {
    const entry = buildAuditEntry({
      taskId: "task-1",
      targetId: "target-1",
      contentId: "review-1",
      attemptNumber: 1,
      result: { success: true, externalId: "wp-42", remoteUrl: "https://example.com/post" },
    });

    expect(entry.status).toBe("published");
    expect(entry.externalId).toBe("wp-42");
    expect(entry.remoteUrl).toBe("https://example.com/post");
    expect(entry.errorMsg).toBeUndefined();
  });

  it("builds a failed entry from a failure result, carrying only the error message", () => {
    const entry = buildAuditEntry({
      taskId: "task-1",
      targetId: "target-1",
      contentId: "review-1",
      attemptNumber: 2,
      result: { success: false, error: { message: "WordPress API 401: invalid credentials" } },
    });

    expect(entry.status).toBe("failed");
    expect(entry.errorMsg).toBe("WordPress API 401: invalid credentials");
    expect(entry.externalId).toBeUndefined();
  });

  it("defaults occurredAt to now when not supplied", () => {
    const before = Date.now();
    const entry = buildAuditEntry({
      taskId: "task-1",
      targetId: "target-1",
      contentId: "review-1",
      attemptNumber: 1,
      result: { success: true, externalId: "x" },
    });
    const after = Date.now();

    expect(entry.occurredAt.getTime()).toBeGreaterThanOrEqual(before);
    expect(entry.occurredAt.getTime()).toBeLessThanOrEqual(after);
  });

  it("respects an explicit occurredAt", () => {
    const fixed = new Date("2026-01-01T00:00:00Z");
    const entry = buildAuditEntry({
      taskId: "task-1",
      targetId: "target-1",
      contentId: "review-1",
      attemptNumber: 1,
      result: { success: true, externalId: "x" },
      occurredAt: fixed,
    });

    expect(entry.occurredAt).toBe(fixed);
  });

  it("carries the attempt number through unchanged", () => {
    const entry = buildAuditEntry({
      taskId: "task-1",
      targetId: "target-1",
      contentId: "review-1",
      attemptNumber: 5,
      result: { success: false, error: { message: "timeout", isNetworkError: true } },
    });

    expect(entry.attemptNumber).toBe(5);
  });
});
