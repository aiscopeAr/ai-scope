import { describe, it, expect, vi, beforeEach } from "vitest";

const mockListTargetSummaries = vi.fn();
const mockCreateTaskIfAbsent = vi.fn();

vi.mock("../persistence/target", () => ({
  listTargetSummaries: (...args: unknown[]) => mockListTargetSummaries(...args),
}));

vi.mock("../persistence/task", () => ({
  createTaskIfAbsent: (...args: unknown[]) => mockCreateTaskIfAbsent(...args),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    category: {
      findUniqueOrThrow: vi.fn(),
    },
  },
}));

import { createWordPressTasksForReview } from "./task-creation";
import { buildWordPressIdempotencyKey } from "./idempotency";

function wpTargetSummary(overrides: Partial<{ id: string; enabled: boolean; targetType: string; categoryFilter: string[] }> = {}) {
  return {
    id: overrides.id ?? "target-1",
    name: "Sonara",
    targetType: overrides.targetType ?? "wordpress",
    enabled: overrides.enabled ?? true,
    config: { mode: "automatic" as const, categoryFilter: overrides.categoryFilter },
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

beforeEach(() => {
  mockListTargetSummaries.mockReset();
  mockCreateTaskIfAbsent.mockReset();
});

describe("createWordPressTasksForReview", () => {
  it("creates no tasks and no error when no targets are configured at all", async () => {
    mockListTargetSummaries.mockResolvedValue([]);

    const result = await createWordPressTasksForReview({ id: "review-1", categorySlug: "ai-news" });

    expect(result).toEqual({ targetsConsidered: 0, tasksCreated: 0, tasksAlreadyExisted: 0 });
    expect(mockCreateTaskIfAbsent).not.toHaveBeenCalled();
  });

  it("ignores a disabled target", async () => {
    mockListTargetSummaries.mockResolvedValue([wpTargetSummary({ enabled: false })]);

    const result = await createWordPressTasksForReview({ id: "review-1", categorySlug: "ai-news" });

    expect(result.targetsConsidered).toBe(0);
    expect(mockCreateTaskIfAbsent).not.toHaveBeenCalled();
  });

  it("ignores a non-wordpress target even if enabled", async () => {
    mockListTargetSummaries.mockResolvedValue([wpTargetSummary({ targetType: "ghost" })]);

    const result = await createWordPressTasksForReview({ id: "review-1", categorySlug: "ai-news" });

    expect(result.targetsConsidered).toBe(0);
  });

  it("respects a category filter that excludes the review's category", async () => {
    mockListTargetSummaries.mockResolvedValue([wpTargetSummary({ categoryFilter: ["opinion"] })]);

    const result = await createWordPressTasksForReview({ id: "review-1", categorySlug: "ai-news" });

    expect(result.targetsConsidered).toBe(0);
    expect(mockCreateTaskIfAbsent).not.toHaveBeenCalled();
  });

  it("creates a task for an enabled, matching target", async () => {
    mockListTargetSummaries.mockResolvedValue([wpTargetSummary({ id: "target-1" })]);
    mockCreateTaskIfAbsent.mockResolvedValue({ id: "task-1", created: true });

    const result = await createWordPressTasksForReview({ id: "review-1", categorySlug: "ai-news" });

    expect(result).toEqual({ targetsConsidered: 1, tasksCreated: 1, tasksAlreadyExisted: 0 });
    expect(mockCreateTaskIfAbsent).toHaveBeenCalledWith({
      targetId: "target-1",
      contentType: "review",
      contentId: "review-1",
      idempotencyKey: buildWordPressIdempotencyKey("review-1", "target-1"),
    });
  });

  it("does not create a duplicate task when one already exists for the same review+target (idempotent)", async () => {
    mockListTargetSummaries.mockResolvedValue([wpTargetSummary({ id: "target-1" })]);
    mockCreateTaskIfAbsent.mockResolvedValue({ id: "task-1", created: false });

    const result = await createWordPressTasksForReview({ id: "review-1", categorySlug: "ai-news" });

    expect(result).toEqual({ targetsConsidered: 1, tasksCreated: 0, tasksAlreadyExisted: 1 });
  });

  it("simulates repeated approval calls creating no duplicate tasks", async () => {
    mockListTargetSummaries.mockResolvedValue([wpTargetSummary({ id: "target-1" })]);
    mockCreateTaskIfAbsent
      .mockResolvedValueOnce({ id: "task-1", created: true })
      .mockResolvedValueOnce({ id: "task-1", created: false });

    const first = await createWordPressTasksForReview({ id: "review-1", categorySlug: "ai-news" });
    const second = await createWordPressTasksForReview({ id: "review-1", categorySlug: "ai-news" });

    expect(first.tasksCreated).toBe(1);
    expect(second.tasksCreated).toBe(0);
    expect(second.tasksAlreadyExisted).toBe(1);
  });

  it("resolves multiple matching targets independently", async () => {
    mockListTargetSummaries.mockResolvedValue([wpTargetSummary({ id: "target-1" }), wpTargetSummary({ id: "target-2" })]);
    mockCreateTaskIfAbsent.mockResolvedValue({ id: "task-x", created: true });

    const result = await createWordPressTasksForReview({ id: "review-1", categorySlug: "ai-news" });

    expect(result.targetsConsidered).toBe(2);
    expect(mockCreateTaskIfAbsent).toHaveBeenCalledTimes(2);
  });
});
