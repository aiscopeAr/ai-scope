import { describe, it, expect, vi, beforeEach } from "vitest";

const recoverStaleSendingTasks = vi.fn();
const selectDueTasks = vi.fn();
const tryClaimTask = vi.fn();
const markTaskPublished = vi.fn();
const markTaskFailed = vi.fn();
const markTaskRetryScheduled = vi.fn();
const getTargetWithCredentials = vi.fn();
const getFormatter = vi.fn();
const getTransport = vi.fn();
const reviewFindUnique = vi.fn();

vi.mock("@/lib/distribution/persistence/task", () => ({
  recoverStaleSendingTasks: (...args: unknown[]) => recoverStaleSendingTasks(...args),
  selectDueTasks: (...args: unknown[]) => selectDueTasks(...args),
  tryClaimTask: (...args: unknown[]) => tryClaimTask(...args),
  markTaskPublished: (...args: unknown[]) => markTaskPublished(...args),
  markTaskFailed: (...args: unknown[]) => markTaskFailed(...args),
  markTaskRetryScheduled: (...args: unknown[]) => markTaskRetryScheduled(...args),
}));

vi.mock("@/lib/distribution/persistence/target", () => ({
  getTargetWithCredentials: (...args: unknown[]) => getTargetWithCredentials(...args),
}));

vi.mock("@/lib/distribution/formatter", () => ({
  getFormatter: (...args: unknown[]) => getFormatter(...args),
}));

vi.mock("@/lib/distribution/transport", () => ({
  getTransport: (...args: unknown[]) => getTransport(...args),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    review: {
      findUnique: (...args: unknown[]) => reviewFindUnique(...args),
    },
  },
}));

import { GET, __internal } from "./route";

function req(secret?: string): Request {
  return new Request("https://example.com/api/cron/distribution-queue", {
    headers: secret ? { authorization: `Bearer ${secret}` } : {},
  });
}

function dueTask(overrides: Partial<{ id: string; targetId: string; contentType: string; contentId: string; attemptCount: number }> = {}) {
  return { id: "task-1", targetId: "target-1", contentType: "review", contentId: "review-1", attemptCount: 0, ...overrides };
}

function target(overrides: Record<string, unknown> = {}) {
  return {
    id: "target-1",
    name: "Sonara",
    targetType: "wordpress",
    enabled: true,
    config: { mode: "automatic" },
    credentials: { username: "editor", applicationPassword: "secret-pw" },
    ...overrides,
  };
}

const reviewRow = {
  id: "review-1",
  titleAr: "عنوان",
  content: "محتوى",
  summary: "ملخص",
  slug: "test-review",
  imageUrl: null,
  tags: [],
  publishedAt: new Date(),
  sources: [],
  category: { slug: "ai-news", nameAr: "أخبار" },
};

beforeEach(() => {
  vi.clearAllMocks();
  process.env.CRON_SECRET = "test-secret";
  recoverStaleSendingTasks.mockResolvedValue(0);
  reviewFindUnique.mockResolvedValue(reviewRow);
});

describe("verifyCronSecret", () => {
  it("fails closed when CRON_SECRET is unset", () => {
    delete process.env.CRON_SECRET;
    expect(__internal.verifyCronSecret(req("anything"))).toBe(false);
  });

  it("rejects a request with no auth header", () => {
    expect(__internal.verifyCronSecret(req())).toBe(false);
  });

  it("rejects a request with the wrong secret", () => {
    expect(__internal.verifyCronSecret(req("wrong-secret"))).toBe(false);
  });

  it("accepts a request with the correct secret", () => {
    expect(__internal.verifyCronSecret(req("test-secret"))).toBe(true);
  });
});

describe("GET — auth gate", () => {
  it("returns 401 when unauthorized", async () => {
    const res = await GET(req("wrong"));
    expect(res.status).toBe(401);
    expect(selectDueTasks).not.toHaveBeenCalled();
  });
});

describe("GET — empty queue", () => {
  it("returns zero counts and does no further work when there are no due tasks", async () => {
    selectDueTasks.mockResolvedValue([]);

    const res = await GET(req("test-secret"));
    const body = await res.json();

    expect(body).toEqual({ ok: true, published: 0, failed: 0, retried: 0 });
    expect(tryClaimTask).not.toHaveBeenCalled();
  });

  it("still recovers stale sending tasks even when the queue is otherwise empty", async () => {
    selectDueTasks.mockResolvedValue([]);
    await GET(req("test-secret"));
    expect(recoverStaleSendingTasks).toHaveBeenCalledTimes(1);
  });
});

describe("GET — atomic claim", () => {
  it("skips a task when the claim is lost to a concurrent worker", async () => {
    selectDueTasks.mockResolvedValue([dueTask()]);
    tryClaimTask.mockResolvedValue(false);

    const res = await GET(req("test-secret"));
    const body = await res.json();

    expect(body.results[0].status).toBe("skipped-claim-lost");
    expect(getTargetWithCredentials).not.toHaveBeenCalled();
  });

  it("proceeds to dispatch when the claim succeeds", async () => {
    selectDueTasks.mockResolvedValue([dueTask()]);
    tryClaimTask.mockResolvedValue(true);
    getTargetWithCredentials.mockResolvedValue(target());
    getFormatter.mockReturnValue({ targetType: "wordpress", format: () => ({ kind: "wordpress-post", body: {} }) });
    getTransport.mockReturnValue({ targetType: "wordpress", publish: vi.fn().mockResolvedValue({ success: true, externalId: "1", remoteUrl: "https://x" }) });

    await GET(req("test-secret"));

    expect(getTargetWithCredentials).toHaveBeenCalledWith("target-1");
  });
});

describe("GET — target/adapter resolution", () => {
  it("marks the task failed when the target is disabled or missing (no retry)", async () => {
    selectDueTasks.mockResolvedValue([dueTask()]);
    tryClaimTask.mockResolvedValue(true);
    getTargetWithCredentials.mockResolvedValue(null);

    await GET(req("test-secret"));

    expect(markTaskFailed).toHaveBeenCalledWith("task-1", expect.stringContaining("disabled"), "{}");
  });

  it("marks the task failed when no Formatter/Transport is registered for the targetType", async () => {
    selectDueTasks.mockResolvedValue([dueTask()]);
    tryClaimTask.mockResolvedValue(true);
    getTargetWithCredentials.mockResolvedValue(target());
    getFormatter.mockReturnValue(undefined);
    getTransport.mockReturnValue(undefined);

    await GET(req("test-secret"));

    expect(markTaskFailed).toHaveBeenCalledWith("task-1", expect.stringContaining("No Formatter/Transport"), "{}");
  });
});

describe("GET — successful publish", () => {
  it("persists externalId/externalUrl and marks the task published", async () => {
    selectDueTasks.mockResolvedValue([dueTask()]);
    tryClaimTask.mockResolvedValue(true);
    getTargetWithCredentials.mockResolvedValue(target());
    getFormatter.mockReturnValue({ targetType: "wordpress", format: () => ({ kind: "wordpress-post", body: {} }) });
    getTransport.mockReturnValue({ targetType: "wordpress", publish: vi.fn().mockResolvedValue({ success: true, externalId: "42", remoteUrl: "https://example.com/?p=42" }) });

    const res = await GET(req("test-secret"));
    const body = await res.json();

    expect(markTaskPublished).toHaveBeenCalledWith("task-1", { success: true, externalId: "42", remoteUrl: "https://example.com/?p=42" }, expect.any(String));
    expect(body.published).toBe(1);
  });

  it("never includes credentials in the persisted payloadSnapshot", async () => {
    selectDueTasks.mockResolvedValue([dueTask()]);
    tryClaimTask.mockResolvedValue(true);
    getTargetWithCredentials.mockResolvedValue(target());
    getFormatter.mockReturnValue({ targetType: "wordpress", format: () => ({ kind: "wordpress-post", body: { title: "x" } }) });
    getTransport.mockReturnValue({ targetType: "wordpress", publish: vi.fn().mockResolvedValue({ success: true, externalId: "1" }) });

    await GET(req("test-secret"));

    const [, , payloadSnapshot] = markTaskPublished.mock.calls[0];
    expect(payloadSnapshot).not.toContain("secret-pw");
  });
});

describe("GET — retry classification via lib/social/retry.ts", () => {
  it("schedules a retry for a 429 with retryAfterSeconds", async () => {
    selectDueTasks.mockResolvedValue([dueTask()]);
    tryClaimTask.mockResolvedValue(true);
    getTargetWithCredentials.mockResolvedValue(target());
    getFormatter.mockReturnValue({ targetType: "wordpress", format: () => ({ kind: "wordpress-post", body: {} }) });
    getTransport.mockReturnValue({
      targetType: "wordpress",
      publish: vi.fn().mockResolvedValue({ success: false, error: { message: "rate limited", httpStatus: 429, retryAfterSeconds: 30 } }),
    });

    await GET(req("test-secret"));

    expect(markTaskRetryScheduled).toHaveBeenCalledTimes(1);
    const [, nextAttemptAt] = markTaskRetryScheduled.mock.calls[0];
    expect(nextAttemptAt).toBeInstanceOf(Date);
  });

  it("schedules a retry for a 5xx server error", async () => {
    selectDueTasks.mockResolvedValue([dueTask()]);
    tryClaimTask.mockResolvedValue(true);
    getTargetWithCredentials.mockResolvedValue(target());
    getFormatter.mockReturnValue({ targetType: "wordpress", format: () => ({ kind: "wordpress-post", body: {} }) });
    getTransport.mockReturnValue({
      targetType: "wordpress",
      publish: vi.fn().mockResolvedValue({ success: false, error: { message: "server error", httpStatus: 503 } }),
    });

    await GET(req("test-secret"));

    expect(markTaskRetryScheduled).toHaveBeenCalledTimes(1);
  });

  it("schedules a retry for a network error", async () => {
    selectDueTasks.mockResolvedValue([dueTask()]);
    tryClaimTask.mockResolvedValue(true);
    getTargetWithCredentials.mockResolvedValue(target());
    getFormatter.mockReturnValue({ targetType: "wordpress", format: () => ({ kind: "wordpress-post", body: {} }) });
    getTransport.mockReturnValue({
      targetType: "wordpress",
      publish: vi.fn().mockResolvedValue({ success: false, error: { message: "network failure", isNetworkError: true } }),
    });

    await GET(req("test-secret"));

    expect(markTaskRetryScheduled).toHaveBeenCalledTimes(1);
  });

  it("terminally fails a permanent 4xx error (e.g. 401) without scheduling a retry", async () => {
    selectDueTasks.mockResolvedValue([dueTask()]);
    tryClaimTask.mockResolvedValue(true);
    getTargetWithCredentials.mockResolvedValue(target());
    getFormatter.mockReturnValue({ targetType: "wordpress", format: () => ({ kind: "wordpress-post", body: {} }) });
    getTransport.mockReturnValue({
      targetType: "wordpress",
      publish: vi.fn().mockResolvedValue({ success: false, error: { message: "invalid credentials", httpStatus: 401 } }),
    });

    await GET(req("test-secret"));

    expect(markTaskRetryScheduled).not.toHaveBeenCalled();
    expect(markTaskFailed).toHaveBeenCalledWith("task-1", "invalid credentials", expect.any(String));
  });

  it("terminates a transient failure once attempt count reaches MAX_SEND_ATTEMPTS (retry exhaustion)", async () => {
    selectDueTasks.mockResolvedValue([dueTask({ attemptCount: 4 })]); // becomes attempt 5 = MAX_SEND_ATTEMPTS
    tryClaimTask.mockResolvedValue(true);
    getTargetWithCredentials.mockResolvedValue(target());
    getFormatter.mockReturnValue({ targetType: "wordpress", format: () => ({ kind: "wordpress-post", body: {} }) });
    getTransport.mockReturnValue({
      targetType: "wordpress",
      publish: vi.fn().mockResolvedValue({ success: false, error: { message: "server error", httpStatus: 503 } }),
    });

    await GET(req("test-secret"));

    expect(markTaskRetryScheduled).not.toHaveBeenCalled();
    expect(markTaskFailed).toHaveBeenCalled();
  });
});

describe("GET — unsupported content type", () => {
  it("permanently fails a task whose contentType is not 'review'", async () => {
    selectDueTasks.mockResolvedValue([dueTask({ contentType: "prompt" })]);
    tryClaimTask.mockResolvedValue(true);
    getTargetWithCredentials.mockResolvedValue(target());
    getFormatter.mockReturnValue({ targetType: "wordpress", format: () => ({ kind: "wordpress-post", body: {} }) });
    getTransport.mockReturnValue({ targetType: "wordpress", publish: vi.fn() });

    await GET(req("test-secret"));

    expect(markTaskFailed).toHaveBeenCalledWith("task-1", expect.stringContaining("Unsupported contentType"), "{}");
    expect(markTaskRetryScheduled).not.toHaveBeenCalled();
  });
});

describe("GET — batch resilience", () => {
  it("one task's failure does not stop processing of the rest of the batch", async () => {
    selectDueTasks.mockResolvedValue([dueTask({ id: "task-1" }), dueTask({ id: "task-2" })]);
    tryClaimTask.mockResolvedValue(true);
    getTargetWithCredentials.mockResolvedValue(target());
    getFormatter.mockReturnValue({ targetType: "wordpress", format: () => ({ kind: "wordpress-post", body: {} }) });

    const publish = vi
      .fn()
      .mockResolvedValueOnce({ success: false, error: { message: "boom", httpStatus: 500 } })
      .mockResolvedValueOnce({ success: true, externalId: "2" });
    getTransport.mockReturnValue({ targetType: "wordpress", publish });

    const res = await GET(req("test-secret"));
    const body = await res.json();

    expect(publish).toHaveBeenCalledTimes(2);
    expect(body.published).toBe(1);
    expect(body.retried).toBe(1);
  });
});

describe("GET — no real network calls", () => {
  it("never touches global fetch (transport is fully mocked)", async () => {
    const realFetch = globalThis.fetch;
    const spy = vi.fn(realFetch);
    globalThis.fetch = spy as unknown as typeof fetch;

    try {
      selectDueTasks.mockResolvedValue([dueTask()]);
      tryClaimTask.mockResolvedValue(true);
      getTargetWithCredentials.mockResolvedValue(target());
      getFormatter.mockReturnValue({ targetType: "wordpress", format: () => ({ kind: "wordpress-post", body: {} }) });
      getTransport.mockReturnValue({ targetType: "wordpress", publish: vi.fn().mockResolvedValue({ success: true, externalId: "1" }) });

      await GET(req("test-secret"));

      expect(spy).not.toHaveBeenCalled();
    } finally {
      globalThis.fetch = realFetch;
    }
  });
});
