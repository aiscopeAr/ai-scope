import { beforeEach, describe, expect, it, vi } from "vitest";

// Editorial V2-A shadow-mode integration in process-review.
// mode=off → planner never runs, exact V1 behavior.
// mode=shadow → planner runs, V1 writer still runs unchanged, nothing persisted.
// planner failure must never break V1.
// mode=on must NOT activate A3 writer consumption (behaves as shadow).

const mockWriteReview = vi.fn();
const mockPlanEditorial = vi.fn();
const mockBuildShadowDiagnostics = vi.fn();
const mockGetSetting = vi.fn();
const mockGetEditorialV2Mode = vi.fn();
const mockGetShadowMax = vi.fn();
const mockGetOnMax = vi.fn();
const mockGetGateMode = vi.fn();
const mockEvaluateGate = vi.fn();
const mockMarkProcessing = vi.fn();
const mockMarkProcessed = vi.fn();
const mockMarkFailed = vi.fn();
const mockGenImage = vi.fn();
const mockRQUpdateMany = vi.fn();
const mockRQFindMany = vi.fn();
const mockRQUpdate = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    reviewQueue: {
      updateMany: (...a: unknown[]) => mockRQUpdateMany(...a),
      findMany: (...a: unknown[]) => mockRQFindMany(...a),
      update: (...a: unknown[]) => mockRQUpdate(...a),
    },
  },
}));
vi.mock("@/lib/review-openai", () => ({ writeReview: (...a: unknown[]) => mockWriteReview(...a) }));
vi.mock("@/lib/review-queue", () => ({
  markReviewProcessing: (...a: unknown[]) => mockMarkProcessing(...a),
  markReviewProcessed: (...a: unknown[]) => mockMarkProcessed(...a),
  markReviewFailed: (...a: unknown[]) => mockMarkFailed(...a),
}));
vi.mock("@/lib/images", () => ({ generateReviewImage: (...a: unknown[]) => mockGenImage(...a) }));
vi.mock("@/lib/settings", () => ({
  getSetting: (...a: unknown[]) => mockGetSetting(...a),
  getEditorialV2Mode: (...a: unknown[]) => mockGetEditorialV2Mode(...a),
  getEditorialV2ShadowMaxPerRun: (...a: unknown[]) => mockGetShadowMax(...a),
  getEditorialV2OnMaxPerRun: (...a: unknown[]) => mockGetOnMax(...a),
  getEditorialV2GateMode: (...a: unknown[]) => mockGetGateMode(...a),
  SETTING_KEYS: { MAX_PER_RUN: "pipeline.maxPerRun" },
}));
vi.mock("@/lib/editorial/planner", () => ({
  planEditorial: (...a: unknown[]) => mockPlanEditorial(...a),
  buildShadowDiagnostics: (...a: unknown[]) => mockBuildShadowDiagnostics(...a),
}));
vi.mock("@/lib/editorial/quality-gate", () => ({
  evaluateDraftQuality: (...a: unknown[]) => mockEvaluateGate(...a),
  GATE_PIPELINE_VERSION: "a5lite.phase1",
}));

import { GET } from "./route";

function queueItem() {
  return {
    id: "q1",
    topic: "GPT-6",
    authorSlug: "zayd",
    newsItems: [{ title: "t", content: "c", sourceUrl: "https://a/1", sourceName: "TC" }],
  };
}
const req = () => new Request("http://x/api/cron/process-review");

beforeEach(() => {
  vi.clearAllMocks();
  mockGetSetting.mockResolvedValue(10);
  mockRQUpdateMany.mockResolvedValue({});
  mockRQFindMany.mockResolvedValue([queueItem()]);
  mockWriteReview.mockResolvedValue({ isAiRelated: true, contentAr: "## X\nنص", featuredImagePrompt: null, titleAr: "t" });
  mockMarkProcessing.mockResolvedValue(undefined);
  mockMarkProcessed.mockResolvedValue(undefined);
  mockGenImage.mockResolvedValue(null);
  mockPlanEditorial.mockResolvedValue({ status: "success", plan: { sections: [] }, hint: "STANDARD_NEWS", fallbackUsed: false });
  mockBuildShadowDiagnostics.mockReturnValue({ reviewQueueId: "q1" });
  mockGetShadowMax.mockResolvedValue(3);
  mockGetOnMax.mockResolvedValue(1);
  mockGetGateMode.mockResolvedValue("off");
  mockEvaluateGate.mockReturnValue({ outcome: "PASS", hardFailCodes: [], reviewCodes: [], warningCodes: [], metrics: { wordCount: 300, h2Count: 4, faqCount: 0, sourceCount: 1, plannedSectionCount: 4 } });
  // On-mode needs a plan with a sections array for diagnostics/section-count.
  mockPlanEditorial.mockResolvedValue({
    status: "success",
    plan: { sections: [{ workingTitle: "ما الذي حدث", purpose: "p" }], storyType: "STANDARD_NEWS", depth: "standard", includeFaq: false, includeComparison: false, includeMena: false },
    hint: "STANDARD_NEWS",
    fallbackUsed: false,
  });
});

function items(n: number) {
  return Array.from({ length: n }, (_, i) => ({
    id: `q${i + 1}`,
    topic: `topic ${i + 1}`,
    authorSlug: "zayd",
    newsItems: [{ title: "t", content: "c", sourceUrl: `https://a/${i}`, sourceName: "TC" }],
  }));
}

describe("process-review — editorial V2-A shadow integration", () => {
  it("M: mode=off → planner NOT called, V1 writer runs", async () => {
    mockGetEditorialV2Mode.mockResolvedValue("off");
    await GET(req());
    expect(mockWriteReview).toHaveBeenCalledTimes(1);
    expect(mockPlanEditorial).not.toHaveBeenCalled();
    expect(mockMarkProcessed).toHaveBeenCalledTimes(1);
  });

  it("N: mode=shadow → planner called AND V1 writer still called + processed", async () => {
    mockGetEditorialV2Mode.mockResolvedValue("shadow");
    await GET(req());
    expect(mockWriteReview).toHaveBeenCalledTimes(1);
    expect(mockPlanEditorial).toHaveBeenCalledTimes(1);
    expect(mockBuildShadowDiagnostics).toHaveBeenCalledTimes(1);
    expect(mockMarkProcessed).toHaveBeenCalledTimes(1);
  });

  it("O: planner failure is non-blocking — V1 still processed, no throw", async () => {
    mockGetEditorialV2Mode.mockResolvedValue("shadow");
    mockPlanEditorial.mockRejectedValue(new Error("boom"));
    const res = await GET(req());
    expect(mockMarkProcessed).toHaveBeenCalledTimes(1);
    expect(res.status).toBeLessThan(500);
  });

  it("P: mode=on (A3) — valid plan → plan-driven writer (4 args); shadow diagnostics NOT run", async () => {
    mockGetEditorialV2Mode.mockResolvedValue("on");
    await GET(req());
    expect(mockPlanEditorial).toHaveBeenCalledTimes(1);
    expect(mockWriteReview).toHaveBeenCalledTimes(1);
    expect(mockWriteReview.mock.calls[0]).toHaveLength(4); // (topic, sources, authorSlug, plan)
    expect(mockWriteReview.mock.calls[0][3]).toHaveProperty("sections"); // the plan
    expect(mockBuildShadowDiagnostics).not.toHaveBeenCalled(); // on mode skips the shadow block
    expect(mockMarkProcessed).toHaveBeenCalledTimes(1);
  });

  it("Q: no EditorialPlan persisted — markReviewProcessed gets only the V1 draft", async () => {
    mockGetEditorialV2Mode.mockResolvedValue("shadow");
    await GET(req());
    const draftArg = mockMarkProcessed.mock.calls[0][1] as Record<string, unknown>;
    expect(draftArg).not.toHaveProperty("editorialPlan");
    expect(draftArg).not.toHaveProperty("plan");
    // reviewQueue.update is never used to write a plan in the happy path
    expect(mockRQUpdate).not.toHaveBeenCalled();
  });
});

describe("process-review — editorial V2-A shadow sampling cap", () => {
  it("shadow + max=0 → planner 0 times, all V1 items processed", async () => {
    mockGetEditorialV2Mode.mockResolvedValue("shadow");
    mockGetShadowMax.mockResolvedValue(0);
    mockRQFindMany.mockResolvedValue(items(4));
    await GET(req());
    expect(mockPlanEditorial).not.toHaveBeenCalled();
    expect(mockWriteReview).toHaveBeenCalledTimes(4);
    expect(mockMarkProcessed).toHaveBeenCalledTimes(4);
  });

  it("shadow + max=1 with 3 items → planner once, all 3 V1 processed", async () => {
    mockGetEditorialV2Mode.mockResolvedValue("shadow");
    mockGetShadowMax.mockResolvedValue(1);
    mockRQFindMany.mockResolvedValue(items(3));
    await GET(req());
    expect(mockPlanEditorial).toHaveBeenCalledTimes(1);
    expect(mockWriteReview).toHaveBeenCalledTimes(3);
    expect(mockMarkProcessed).toHaveBeenCalledTimes(3);
  });

  it("shadow + max=3 with 5 items → planner exactly 3, V1 called 5", async () => {
    mockGetEditorialV2Mode.mockResolvedValue("shadow");
    mockGetShadowMax.mockResolvedValue(3);
    mockRQFindMany.mockResolvedValue(items(5));
    await GET(req());
    expect(mockPlanEditorial).toHaveBeenCalledTimes(3);
    expect(mockWriteReview).toHaveBeenCalledTimes(5);
    expect(mockMarkProcessed).toHaveBeenCalledTimes(5);
  });

  it("a failed planner attempt counts toward the cap (attempts, not successes)", async () => {
    mockGetEditorialV2Mode.mockResolvedValue("shadow");
    mockGetShadowMax.mockResolvedValue(1);
    mockRQFindMany.mockResolvedValue(items(2));
    mockPlanEditorial.mockRejectedValueOnce(new Error("boom")); // first attempt fails
    await GET(req());
    expect(mockPlanEditorial).toHaveBeenCalledTimes(1); // cap consumed by the failed attempt
    expect(mockWriteReview).toHaveBeenCalledTimes(2);   // both V1 items still processed
    expect(mockMarkProcessed).toHaveBeenCalledTimes(2);
  });

  it("on mode obeys the ON canary cap: onMax=1 with 3 items → 1 plan-driven + 2 V1 writes", async () => {
    mockGetEditorialV2Mode.mockResolvedValue("on");
    mockGetOnMax.mockResolvedValue(1);
    mockRQFindMany.mockResolvedValue(items(3));
    await GET(req());
    expect(mockPlanEditorial).toHaveBeenCalledTimes(1);
    expect(mockWriteReview).toHaveBeenCalledTimes(3);
    expect(mockWriteReview.mock.calls[0]).toHaveLength(4); // first = plan-driven
    expect(mockWriteReview.mock.calls[1]).toHaveLength(3); // rest = V1
    expect(mockWriteReview.mock.calls[2]).toHaveLength(3);
  });

  it("off → shadow AND on cap accessors are not even read", async () => {
    mockGetEditorialV2Mode.mockResolvedValue("off");
    mockRQFindMany.mockResolvedValue(items(3));
    await GET(req());
    expect(mockGetShadowMax).not.toHaveBeenCalled();
    expect(mockGetOnMax).not.toHaveBeenCalled();
    expect(mockPlanEditorial).not.toHaveBeenCalled();
    expect(mockWriteReview).toHaveBeenCalledTimes(3);
  });

  it("shadow mode does not read the ON cap accessor", async () => {
    mockGetEditorialV2Mode.mockResolvedValue("shadow");
    mockRQFindMany.mockResolvedValue(items(2));
    await GET(req());
    expect(mockGetOnMax).not.toHaveBeenCalled();
  });
});

describe("process-review — editorial V2-A3 on-mode (plan-driven writer)", () => {
  beforeEach(() => mockGetEditorialV2Mode.mockResolvedValue("on"));

  it("onMax=0 → no plan-driven items, planner never called, all V1", async () => {
    mockGetOnMax.mockResolvedValue(0);
    mockRQFindMany.mockResolvedValue(items(3));
    await GET(req());
    expect(mockPlanEditorial).not.toHaveBeenCalled();
    expect(mockWriteReview).toHaveBeenCalledTimes(3);
    mockWriteReview.mock.calls.forEach((c) => expect(c).toHaveLength(3));
    expect(mockMarkProcessed).toHaveBeenCalledTimes(3);
  });

  it("onMax=1, first eligible item only → plan writer once, rest V1", async () => {
    mockGetOnMax.mockResolvedValue(1);
    mockRQFindMany.mockResolvedValue(items(3));
    await GET(req());
    expect(mockPlanEditorial).toHaveBeenCalledTimes(1);
    expect(mockWriteReview.mock.calls[0]).toHaveLength(4);
    expect(mockWriteReview.mock.calls[1]).toHaveLength(3);
  });

  it("planner success (non-fallback) → plan-driven writer gets the plan", async () => {
    mockGetOnMax.mockResolvedValue(1);
    await GET(req());
    expect(mockWriteReview.mock.calls[0]).toHaveLength(4);
    expect(mockWriteReview.mock.calls[0][3]).toHaveProperty("storyType", "STANDARD_NEWS");
  });

  it("planner throws → degrade to V1 writer (3 args), item still processed", async () => {
    mockGetOnMax.mockResolvedValue(1);
    mockPlanEditorial.mockRejectedValue(new Error("planner boom"));
    const res = await GET(req());
    expect(mockPlanEditorial).toHaveBeenCalledTimes(1);
    expect(mockWriteReview).toHaveBeenCalledTimes(1);
    expect(mockWriteReview.mock.calls[0]).toHaveLength(3);
    expect(mockMarkProcessed).toHaveBeenCalledTimes(1);
    expect(mockMarkFailed).not.toHaveBeenCalled();
    expect(res.status).toBeLessThan(500);
  });

  it("planner conservative fallback (fallbackUsed) → V1 writer", async () => {
    mockGetOnMax.mockResolvedValue(1);
    mockPlanEditorial.mockResolvedValue({ status: "fallback", plan: { sections: [] }, hint: "STANDARD_NEWS", fallbackUsed: true });
    await GET(req());
    expect(mockWriteReview).toHaveBeenCalledTimes(1);
    expect(mockWriteReview.mock.calls[0]).toHaveLength(3);
  });

  it("failed_nonblocking planner status → V1 writer", async () => {
    mockGetOnMax.mockResolvedValue(1);
    mockPlanEditorial.mockResolvedValue({ status: "failed_nonblocking", plan: { sections: [] }, hint: "STANDARD_NEWS", fallbackUsed: true });
    await GET(req());
    expect(mockWriteReview.mock.calls[0]).toHaveLength(3);
  });

  it("plan-driven writer throws → falls back to V1 writer, item still processed", async () => {
    mockGetOnMax.mockResolvedValue(1);
    mockWriteReview
      .mockRejectedValueOnce(new Error("plan write boom")) // plan-driven attempt
      .mockResolvedValueOnce({ isAiRelated: true, contentAr: "## X\nن", featuredImagePrompt: null, titleAr: "t" }); // V1 fallback
    await GET(req());
    expect(mockWriteReview).toHaveBeenCalledTimes(2);
    expect(mockWriteReview.mock.calls[0]).toHaveLength(4); // plan attempt
    expect(mockWriteReview.mock.calls[1]).toHaveLength(3); // V1 fallback
    expect(mockMarkProcessed).toHaveBeenCalledTimes(1);
    expect(mockMarkFailed).not.toHaveBeenCalled();
  });

  it("a failed on-attempt consumes the canary cap", async () => {
    mockGetOnMax.mockResolvedValue(1);
    mockRQFindMany.mockResolvedValue(items(2));
    mockPlanEditorial.mockRejectedValueOnce(new Error("boom")); // first attempt fails
    await GET(req());
    expect(mockPlanEditorial).toHaveBeenCalledTimes(1); // cap consumed by the failed attempt
    expect(mockWriteReview).toHaveBeenCalledTimes(2);   // both items written via V1
    mockWriteReview.mock.calls.forEach((c) => expect(c).toHaveLength(3));
  });

  it("happy path performs no extra reviewQueue.update (no plan persisted)", async () => {
    mockGetOnMax.mockResolvedValue(1);
    await GET(req());
    expect(mockRQUpdate).not.toHaveBeenCalled();
  });
});

describe("process-review — A5-lite quality gate (phase 1, shadow/log-only)", () => {
  it("gate OFF → evaluator NOT invoked", async () => {
    mockGetEditorialV2Mode.mockResolvedValue("off");
    mockGetGateMode.mockResolvedValue("off");
    await GET(req());
    expect(mockEvaluateGate).not.toHaveBeenCalled();
    expect(mockMarkProcessed).toHaveBeenCalledTimes(1);
  });

  it("gate SHADOW → evaluator runs once per processed item", async () => {
    mockGetEditorialV2Mode.mockResolvedValue("off");
    mockGetGateMode.mockResolvedValue("shadow");
    mockRQFindMany.mockResolvedValue(items(3));
    await GET(req());
    expect(mockEvaluateGate).toHaveBeenCalledTimes(3);
    expect(mockMarkProcessed).toHaveBeenCalledTimes(3);
  });

  it("diagnostic REJECT_DRAFT does NOT change lifecycle (still processed, no fail, not rejected)", async () => {
    mockGetEditorialV2Mode.mockResolvedValue("off");
    mockGetGateMode.mockResolvedValue("shadow");
    mockEvaluateGate.mockReturnValue({ outcome: "REJECT_DRAFT", hardFailCodes: ["LEAKAGE"], reviewCodes: [], warningCodes: [], metrics: {} });
    const res = await GET(req());
    expect(mockMarkProcessed).toHaveBeenCalledTimes(1);
    expect(mockMarkFailed).not.toHaveBeenCalled();
    expect(mockRQUpdate).not.toHaveBeenCalled(); // no rejected status write
    expect(res.status).toBeLessThan(500);
  });

  it("diagnostic EDITOR_REVIEW does NOT change lifecycle", async () => {
    mockGetEditorialV2Mode.mockResolvedValue("off");
    mockGetGateMode.mockResolvedValue("shadow");
    mockEvaluateGate.mockReturnValue({ outcome: "EDITOR_REVIEW", hardFailCodes: [], reviewCodes: ["MENA_AGAINST_PLAN"], warningCodes: [], metrics: {} });
    await GET(req());
    expect(mockMarkProcessed).toHaveBeenCalledTimes(1);
    expect(mockMarkFailed).not.toHaveBeenCalled();
  });

  it("PASS_WITH_WARNINGS still markReviewProcessed", async () => {
    mockGetEditorialV2Mode.mockResolvedValue("off");
    mockGetGateMode.mockResolvedValue("shadow");
    mockEvaluateGate.mockReturnValue({ outcome: "PASS_WITH_WARNINGS", hardFailCodes: [], reviewCodes: [], warningCodes: ["TOO_SHORT"], metrics: {} });
    await GET(req());
    expect(mockMarkProcessed).toHaveBeenCalledTimes(1);
  });

  it("a thrown gate evaluator is non-blocking — item still processed, no throw", async () => {
    mockGetEditorialV2Mode.mockResolvedValue("off");
    mockGetGateMode.mockResolvedValue("shadow");
    mockEvaluateGate.mockImplementation(() => { throw new Error("gate boom"); });
    const res = await GET(req());
    expect(mockMarkProcessed).toHaveBeenCalledTimes(1);
    expect(mockMarkFailed).not.toHaveBeenCalled();
    expect(res.status).toBeLessThan(500);
  });

  it("enforce mode behaves as shadow in phase 1 (evaluator runs, lifecycle unchanged)", async () => {
    mockGetEditorialV2Mode.mockResolvedValue("off");
    mockGetGateMode.mockResolvedValue("enforce");
    mockEvaluateGate.mockReturnValue({ outcome: "REJECT_DRAFT", hardFailCodes: ["EMPTY_CONTENT"], reviewCodes: [], warningCodes: [], metrics: {} });
    await GET(req());
    expect(mockEvaluateGate).toHaveBeenCalledTimes(1);
    expect(mockMarkProcessed).toHaveBeenCalledTimes(1); // NOT blocked
    expect(mockMarkFailed).not.toHaveBeenCalled();
  });

  it("on-path A3 item: gate receives writerPath a3 and the plan", async () => {
    mockGetEditorialV2Mode.mockResolvedValue("on");
    mockGetOnMax.mockResolvedValue(1);
    mockGetGateMode.mockResolvedValue("shadow");
    await GET(req());
    const arg = mockEvaluateGate.mock.calls[0][0] as { writerPath: string; plan?: unknown };
    expect(arg.writerPath).toBe("a3");
    expect(arg.plan).toBeTruthy();
  });

  it("gate does not run for non-AI-related (rejected) drafts", async () => {
    mockGetEditorialV2Mode.mockResolvedValue("off");
    mockGetGateMode.mockResolvedValue("shadow");
    mockWriteReview.mockResolvedValue({ isAiRelated: false, contentAr: "", featuredImagePrompt: null, titleAr: "t" });
    await GET(req());
    expect(mockEvaluateGate).not.toHaveBeenCalled();
    expect(mockMarkProcessed).not.toHaveBeenCalled();
  });
});
