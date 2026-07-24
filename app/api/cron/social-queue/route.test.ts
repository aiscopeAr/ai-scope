import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock @/lib/db before importing the route, so the route's top-level
// `import { prisma } from "@/lib/db"` binds to this mock instead of a real
// PrismaClient — no live database needed for these focused tests.
const socialPostUpdateMany = vi.fn();
const socialPostFindMany = vi.fn();
const socialPostUpdate = vi.fn();
const reviewFindUnique = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    socialPost: {
      updateMany: (...args: unknown[]) => socialPostUpdateMany(...args),
      findMany: (...args: unknown[]) => socialPostFindMany(...args),
      update: (...args: unknown[]) => socialPostUpdate(...args),
    },
    review: {
      findUnique: (...args: unknown[]) => reviewFindUnique(...args),
    },
  },
}));

describe("verifyCronSecret — fail-closed behavior", () => {
  const originalEnv = process.env.CRON_SECRET;

  afterEach(() => {
    process.env.CRON_SECRET = originalEnv;
    vi.resetModules();
  });

  it("rejects the request when CRON_SECRET is unset (fails closed, not open)", async () => {
    delete process.env.CRON_SECRET;
    vi.resetModules();
    const { __internal } = await import("./route");
    const req = new Request("https://x.test/api/cron/social-queue");
    expect(__internal.verifyCronSecret(req)).toBe(false);
  });

  it("rejects the request when CRON_SECRET is an empty string", async () => {
    process.env.CRON_SECRET = "";
    vi.resetModules();
    const { __internal } = await import("./route");
    const req = new Request("https://x.test/api/cron/social-queue");
    expect(__internal.verifyCronSecret(req)).toBe(false);
  });

  it("accepts a request bearing the correct Bearer token when CRON_SECRET is set", async () => {
    process.env.CRON_SECRET = "test-secret";
    vi.resetModules();
    const { __internal } = await import("./route");
    const req = new Request("https://x.test/api/cron/social-queue", {
      headers: { authorization: "Bearer test-secret" },
    });
    expect(__internal.verifyCronSecret(req)).toBe(true);
  });

  it("rejects a request with the wrong token when CRON_SECRET is set", async () => {
    process.env.CRON_SECRET = "test-secret";
    vi.resetModules();
    const { __internal } = await import("./route");
    const req = new Request("https://x.test/api/cron/social-queue", {
      headers: { authorization: "Bearer wrong" },
    });
    expect(__internal.verifyCronSecret(req)).toBe(false);
  });
});

describe("tryClaimPost — atomic claim / duplicate-send prevention", () => {
  beforeEach(() => {
    socialPostUpdateMany.mockReset();
  });

  it("reports a successful claim when the conditional update affects exactly one row", async () => {
    process.env.CRON_SECRET = "test-secret";
    vi.resetModules();
    socialPostUpdateMany.mockResolvedValueOnce({ count: 1 });
    const { __internal } = await import("./route");

    const claimed = await __internal.tryClaimPost("post-1", "approved", new Date());
    expect(claimed).toBe(true);
    expect(socialPostUpdateMany).toHaveBeenCalledWith({
      where: { id: "post-1", status: "approved" },
      data: expect.objectContaining({ status: "sending" }),
    });
  });

  it("reports a lost claim when a concurrent worker already flipped the row's status (count: 0)", async () => {
    process.env.CRON_SECRET = "test-secret";
    vi.resetModules();
    socialPostUpdateMany.mockResolvedValueOnce({ count: 0 });
    const { __internal } = await import("./route");

    const claimed = await __internal.tryClaimPost("post-1", "approved", new Date());
    expect(claimed).toBe(false);
  });

  it("a second concurrent claim attempt on the same post never both succeed — this is what prevents a duplicate send", async () => {
    process.env.CRON_SECRET = "test-secret";
    vi.resetModules();
    // Simulate the DB-level compare-and-swap: only the first call's WHERE
    // clause still matches ("approved"); the second sees the row already
    // flipped to "sending" and affects 0 rows.
    socialPostUpdateMany.mockResolvedValueOnce({ count: 1 }).mockResolvedValueOnce({ count: 0 });
    const { __internal } = await import("./route");

    const now = new Date();
    const [first, second] = await Promise.all([
      __internal.tryClaimPost("post-1", "approved", now),
      __internal.tryClaimPost("post-1", "approved", now),
    ]);

    const successCount = [first, second].filter(Boolean).length;
    expect(successCount).toBe(1);
  });
});

describe("decideRetryOutcome — bounded retries, no infinite loop", () => {
  it("schedules a retry for a transient failure under the attempt limit", async () => {
    process.env.CRON_SECRET = "test-secret";
    vi.resetModules();
    const { __internal } = await import("./route");
    const { ProviderError } = await import("@/lib/social/retry");

    const decision = __internal.decideRetryOutcome(new ProviderError("timeout", { isNetworkError: true }), 1, new Date());
    expect(decision.outcome).toBe("retry-scheduled");
  });

  it("goes terminal once the attempt count reaches the max, even for a transient error", async () => {
    process.env.CRON_SECRET = "test-secret";
    vi.resetModules();
    const { __internal } = await import("./route");
    const { ProviderError } = await import("@/lib/social/retry");

    const decision = __internal.decideRetryOutcome(new ProviderError("timeout", { isNetworkError: true }), 5, new Date());
    expect(decision.outcome).toBe("failed");
  });

  it("goes terminal immediately for a permanent failure regardless of attempt count", async () => {
    process.env.CRON_SECRET = "test-secret";
    vi.resetModules();
    const { __internal } = await import("./route");
    const { ProviderError } = await import("@/lib/social/retry");

    const decision = __internal.decideRetryOutcome(new ProviderError("chat not found", { httpStatus: 400 }), 1, new Date());
    expect(decision.outcome).toBe("failed");
  });
});

describe("recoverStalePost — stale sending recovery", () => {
  beforeEach(() => {
    socialPostUpdateMany.mockReset();
  });

  it("returns a stale 'sending' row to 'approved' so it can be re-claimed, without marking it sent", async () => {
    process.env.CRON_SECRET = "test-secret";
    vi.resetModules();
    socialPostUpdateMany.mockResolvedValueOnce({ count: 1 });
    const { __internal } = await import("./route");

    await __internal.recoverStalePost("post-1");

    expect(socialPostUpdateMany).toHaveBeenCalledWith({
      where: { id: "post-1", status: "sending" },
      data: { status: "approved" },
    });
  });
});
