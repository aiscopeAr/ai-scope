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
  SETTING_KEYS: { MAX_PER_RUN: "pipeline.maxPerRun" },
}));
vi.mock("@/lib/editorial/planner", () => ({
  planEditorial: (...a: unknown[]) => mockPlanEditorial(...a),
  buildShadowDiagnostics: (...a: unknown[]) => mockBuildShadowDiagnostics(...a),
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

  it("P: mode=on does NOT activate A3 — writeReview called with 3 args (no plan); planner runs as shadow", async () => {
    mockGetEditorialV2Mode.mockResolvedValue("on");
    await GET(req());
    expect(mockPlanEditorial).toHaveBeenCalledTimes(1);
    expect(mockWriteReview).toHaveBeenCalledTimes(1);
    expect(mockWriteReview.mock.calls[0]).toHaveLength(3); // (topic, sources, authorSlug) — no 4th plan arg
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

  it("on mode obeys the same cap; still no A3 (writeReview 3 args)", async () => {
    mockGetEditorialV2Mode.mockResolvedValue("on");
    mockGetShadowMax.mockResolvedValue(1);
    mockRQFindMany.mockResolvedValue(items(3));
    await GET(req());
    expect(mockPlanEditorial).toHaveBeenCalledTimes(1);
    expect(mockWriteReview).toHaveBeenCalledTimes(3);
    expect(mockWriteReview.mock.calls[0]).toHaveLength(3);
  });

  it("off → shadow cap accessor is not even read", async () => {
    mockGetEditorialV2Mode.mockResolvedValue("off");
    mockRQFindMany.mockResolvedValue(items(3));
    await GET(req());
    expect(mockGetShadowMax).not.toHaveBeenCalled();
    expect(mockPlanEditorial).not.toHaveBeenCalled();
    expect(mockWriteReview).toHaveBeenCalledTimes(3);
  });
});
