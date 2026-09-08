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
});

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
