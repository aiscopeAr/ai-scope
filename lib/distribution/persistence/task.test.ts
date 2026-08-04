import { describe, it, expect, vi, beforeEach } from "vitest";

const findUnique = vi.fn();
const findUniqueOrThrow = vi.fn();
const create = vi.fn();
const updateMany = vi.fn();
const update = vi.fn();
const findFirst = vi.fn();
const groupBy = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    distributionTask: {
      findUnique: (...args: unknown[]) => findUnique(...args),
      findUniqueOrThrow: (...args: unknown[]) => findUniqueOrThrow(...args),
      create: (...args: unknown[]) => create(...args),
      updateMany: (...args: unknown[]) => updateMany(...args),
      update: (...args: unknown[]) => update(...args),
      findFirst: (...args: unknown[]) => findFirst(...args),
      findMany: vi.fn(),
      groupBy: (...args: unknown[]) => groupBy(...args),
    },
  },
}));

import {
  createTaskIfAbsent,
  recoverStaleSendingTasks,
  selectDueTasks,
  tryClaimTask,
  markTaskPublished,
  markTaskFailed,
  markTaskRetryScheduled,
  getTaskCountsByTarget,
  getLastOutcomes,
} from "./task";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("createTaskIfAbsent", () => {
  it("creates a new task when none exists for the idempotency key", async () => {
    findUnique.mockResolvedValue(null);
    create.mockResolvedValue({ id: "task-1" });

    const result = await createTaskIfAbsent({ targetId: "t1", contentType: "review", contentId: "r1", idempotencyKey: "wordpress:t1:r1" });

    expect(result).toEqual({ id: "task-1", created: true });
    expect(create).toHaveBeenCalledTimes(1);
  });

  it("returns the existing task without creating a new one when found by findUnique", async () => {
    findUnique.mockResolvedValue({ id: "existing-task" });

    const result = await createTaskIfAbsent({ targetId: "t1", contentType: "review", contentId: "r1", idempotencyKey: "wordpress:t1:r1" });

    expect(result).toEqual({ id: "existing-task", created: false });
    expect(create).not.toHaveBeenCalled();
  });

  it("handles a concurrent-create race via a P2002 unique constraint violation gracefully", async () => {
    findUnique.mockResolvedValue(null);
    const p2002 = Object.assign(new Error("Unique constraint failed"), { code: "P2002" });
    create.mockRejectedValue(p2002);
    findUniqueOrThrow.mockResolvedValue({ id: "race-winner-task" });

    const result = await createTaskIfAbsent({ targetId: "t1", contentType: "review", contentId: "r1", idempotencyKey: "wordpress:t1:r1" });

    expect(result).toEqual({ id: "race-winner-task", created: false });
  });

  it("re-throws a non-P2002 error from create", async () => {
    findUnique.mockResolvedValue(null);
    create.mockRejectedValue(new Error("connection lost"));

    await expect(
      createTaskIfAbsent({ targetId: "t1", contentType: "review", contentId: "r1", idempotencyKey: "wordpress:t1:r1" }),
    ).rejects.toThrow("connection lost");
  });
});

describe("recoverStaleSendingTasks", () => {
  it("updates stale sending rows back to pending", async () => {
    updateMany.mockResolvedValue({ count: 2 });

    const count = await recoverStaleSendingTasks(new Date());

    expect(count).toBe(2);
    expect(updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ status: "sending" }), data: { status: "pending", sendingAt: null } }),
    );
  });
});

describe("selectDueTasks", () => {
  it("passes the bounded limit through to Prisma", async () => {
    const { prisma } = await import("@/lib/db");
    vi.mocked(prisma.distributionTask.findMany).mockResolvedValue([]);

    await selectDueTasks(new Date(), 10);

    expect(prisma.distributionTask.findMany).toHaveBeenCalledWith(expect.objectContaining({ take: 10 }));
  });
});

describe("tryClaimTask", () => {
  it("returns true when exactly one row was claimed", async () => {
    updateMany.mockResolvedValue({ count: 1 });
    expect(await tryClaimTask("task-1", new Date())).toBe(true);
  });

  it("returns false when zero rows were claimed (lost the race)", async () => {
    updateMany.mockResolvedValue({ count: 0 });
    expect(await tryClaimTask("task-1", new Date())).toBe(false);
  });

  it("only matches rows currently in pending status", async () => {
    updateMany.mockResolvedValue({ count: 1 });
    await tryClaimTask("task-1", new Date());
    expect(updateMany).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "task-1", status: "pending" } }));
  });
});

describe("markTaskPublished / markTaskRetryScheduled / markTaskFailed", () => {
  it("persists externalId and externalUrl on success", async () => {
    update.mockResolvedValue({});
    await markTaskPublished("task-1", { success: true, externalId: "42", remoteUrl: "https://example.com/?p=42" }, "{}");

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: "published", externalId: "42", externalUrl: "https://example.com/?p=42" }) }),
    );
  });

  it("schedules a retry with the given nextAttemptAt", async () => {
    update.mockResolvedValue({});
    const nextAttemptAt = new Date("2026-01-01T00:05:00Z");
    await markTaskRetryScheduled("task-1", nextAttemptAt, "rate limited", "{}");

    expect(update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: "pending", nextAttemptAt }) }));
  });

  it("marks a task terminally failed", async () => {
    update.mockResolvedValue({});
    await markTaskFailed("task-1", "invalid credentials", "{}");

    expect(update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: "failed", errorMsg: "invalid credentials" }) }));
  });
});

describe("getTaskCountsByTarget", () => {
  it("maps groupBy results into a full TaskCounts shape with zero defaults", async () => {
    groupBy.mockResolvedValue([
      { status: "pending", _count: { status: 3 } },
      { status: "published", _count: { status: 5 } },
    ]);

    const counts = await getTaskCountsByTarget("target-1");

    expect(counts).toEqual({ pending: 3, sending: 0, published: 5, failed: 0, skipped: 0 });
  });
});

describe("getLastOutcomes", () => {
  it("returns null timestamps when there is no history yet", async () => {
    findFirst.mockResolvedValue(null);

    const outcomes = await getLastOutcomes("target-1");

    expect(outcomes).toEqual({ lastSuccessAt: null, lastFailureAt: null });
  });

  it("returns the last success and failure timestamps independently", async () => {
    findFirst.mockResolvedValueOnce({ sentAt: new Date("2026-01-01T00:00:00Z") }).mockResolvedValueOnce({ updatedAt: new Date("2026-01-02T00:00:00Z") });

    const outcomes = await getLastOutcomes("target-1");

    expect(outcomes.lastSuccessAt).toEqual(new Date("2026-01-01T00:00:00Z"));
    expect(outcomes.lastFailureAt).toEqual(new Date("2026-01-02T00:00:00Z"));
  });
});
