import { describe, it, expect } from "vitest";
import { createDistributionTarget, createDistributionTask, withStatus } from "./factory";

describe("createDistributionTarget", () => {
  it("builds a target with enabled defaulted to false", () => {
    const target = createDistributionTarget({
      id: "t1",
      name: "Sonara",
      targetType: "wordpress",
      credentials: { siteUrl: "https://example.com" },
      config: { mode: "automatic" },
    });
    expect(target.enabled).toBe(false);
  });

  it("respects an explicit enabled value", () => {
    const target = createDistributionTarget({
      id: "t1",
      name: "Sonara",
      targetType: "wordpress",
      enabled: true,
      credentials: {},
      config: { mode: "automatic" },
    });
    expect(target.enabled).toBe(true);
  });

  it("throws for an invalid target instead of returning a partial object", () => {
    expect(() =>
      createDistributionTarget({
        id: "",
        name: "Sonara",
        targetType: "wordpress",
        credentials: {},
        config: { mode: "automatic" },
      }),
    ).toThrow(/Invalid DistributionTarget/);
  });
});

describe("createDistributionTask", () => {
  it("builds a task in pending state with zero attempts", () => {
    const task = createDistributionTask({ id: "task-1", targetId: "t1", contentId: "review-1" });
    expect(task.status).toBe("pending");
    expect(task.attemptCount).toBe(0);
    expect(task.externalId).toBeUndefined();
  });

  it("defaults createdAt to now when not supplied", () => {
    const before = Date.now();
    const task = createDistributionTask({ id: "task-1", targetId: "t1", contentId: "review-1" });
    const after = Date.now();
    expect(task.createdAt.getTime()).toBeGreaterThanOrEqual(before);
    expect(task.createdAt.getTime()).toBeLessThanOrEqual(after);
  });

  it("respects an explicit createdAt", () => {
    const fixed = new Date("2026-01-01T00:00:00Z");
    const task = createDistributionTask({ id: "task-1", targetId: "t1", contentId: "review-1", createdAt: fixed });
    expect(task.createdAt).toBe(fixed);
  });
});

describe("withStatus", () => {
  it("returns a new object without mutating the input", () => {
    const task = createDistributionTask({ id: "task-1", targetId: "t1", contentId: "review-1" });
    const updated = withStatus(task, "sending", { sendingAt: new Date() });

    expect(task.status).toBe("pending");
    expect(updated.status).toBe("sending");
    expect(updated).not.toBe(task);
  });

  it("merges arbitrary patch fields alongside the status change", () => {
    const task = createDistributionTask({ id: "task-1", targetId: "t1", contentId: "review-1" });
    const updated = withStatus(task, "published", { externalId: "wp-123", remoteUrl: "https://example.com/post" });

    expect(updated.externalId).toBe("wp-123");
    expect(updated.remoteUrl).toBe("https://example.com/post");
  });
});
