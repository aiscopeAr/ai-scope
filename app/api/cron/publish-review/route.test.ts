import { beforeEach, describe, expect, it, vi } from "vitest";

// A ReviewQueue item with a blank/whitespace slug must never reach
// approveReview() — the function that creates the Review row and fires
// every downstream side effect (Distribution, SocialPost, Telegram,
// WordPress syndication). This proved to happen once in production
// (Review cmrypu1400003l2042ppwvgbe) because the selection query's
// `slug: { not: null }` filter treats "" as a valid, non-null value.

const mockApproveReview = vi.fn();
const mockMarkReviewFailed = vi.fn();
const mockGenerateReviewImage = vi.fn();
const mockGetSetting = vi.fn();
const mockReviewCount = vi.fn();
const mockReviewQueueFindMany = vi.fn();
const mockCategoryFindFirst = vi.fn();
const mockCategoryFindMany = vi.fn();

vi.mock("@/lib/review-queue", () => ({
  approveReview: (...args: unknown[]) => mockApproveReview(...args),
  markReviewFailed: (...args: unknown[]) => mockMarkReviewFailed(...args),
}));
vi.mock("@/lib/images", () => ({
  generateReviewImage: (...args: unknown[]) => mockGenerateReviewImage(...args),
}));
vi.mock("@/lib/settings", () => ({
  getSetting: (...args: unknown[]) => mockGetSetting(...args),
  SETTING_KEYS: { DAILY_PUBLISH_LIMIT: "pipeline.dailyPublishLimit", MAX_PER_RUN: "pipeline.maxPerRun" },
}));
vi.mock("@/lib/authors", () => ({
  categorySlugCandidatesForAuthor: () => ["ai-models"],
}));
vi.mock("@/lib/db", () => ({
  prisma: {
    review: { count: (...args: unknown[]) => mockReviewCount(...args) },
    reviewQueue: { findMany: (...args: unknown[]) => mockReviewQueueFindMany(...args) },
    category: {
      findFirst: (...args: unknown[]) => mockCategoryFindFirst(...args),
      findMany: (...args: unknown[]) => mockCategoryFindMany(...args),
    },
  },
}));

function queueItem(overrides: Partial<{ id: string; slug: string | null; authorSlug: string; featuredImagePrompt: string | null; imageUrl: string | null }> = {}) {
  return {
    id: "queue-1",
    slug: "a-valid-slug",
    authorSlug: "zayd",
    featuredImagePrompt: null,
    imageUrl: null,
    newsItems: [],
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockGetSetting.mockResolvedValue(10);
  mockReviewCount.mockResolvedValue(0);
  mockCategoryFindFirst.mockResolvedValue({ id: "cat-1" });
  mockCategoryFindMany.mockResolvedValue([{ id: "cat-1", slug: "ai-models" }]);
  mockApproveReview.mockResolvedValue("review-created-id");
  mockMarkReviewFailed.mockResolvedValue(undefined);
});

async function callRoute() {
  const { GET } = await import("./route");
  return GET(new Request("http://localhost/api/cron/publish-review"));
}

describe("GET /api/cron/publish-review — blank slug guard", () => {
  it("A: slug = null is not published", async () => {
    mockReviewQueueFindMany.mockResolvedValue([queueItem({ id: "q-null", slug: null })]);

    const res = await callRoute();
    const body = await res.json();

    expect(mockApproveReview).not.toHaveBeenCalled();
    expect(body.published).toBe(0);
  });

  it("B: slug = \"\" is not published", async () => {
    mockReviewQueueFindMany.mockResolvedValue([queueItem({ id: "q-empty", slug: "" })]);

    const res = await callRoute();
    const body = await res.json();

    expect(mockApproveReview).not.toHaveBeenCalled();
    expect(body.published).toBe(0);
  });

  it("C: slug = \"   \" (whitespace-only) is not published", async () => {
    mockReviewQueueFindMany.mockResolvedValue([queueItem({ id: "q-ws", slug: "   " })]);

    const res = await callRoute();
    const body = await res.json();

    expect(mockApproveReview).not.toHaveBeenCalled();
    expect(body.published).toBe(0);
  });

  it("D: a valid slug publishes normally", async () => {
    mockReviewQueueFindMany.mockResolvedValue([queueItem({ id: "q-valid", slug: "a-valid-slug" })]);

    const res = await callRoute();
    const body = await res.json();

    expect(mockApproveReview).toHaveBeenCalledWith(
      "q-valid",
      expect.objectContaining({ slug: "a-valid-slug", published: true }),
    );
    expect(body.published).toBe(1);
  });

  it("E: an invalid item between two valid items does not stop either valid item from publishing", async () => {
    mockReviewQueueFindMany.mockResolvedValue([
      queueItem({ id: "q-A", slug: "review-a" }),
      queueItem({ id: "q-B", slug: "" }),
      queueItem({ id: "q-C", slug: "review-c" }),
    ]);
    mockApproveReview.mockImplementation((id: string) => Promise.resolve(`review-for-${id}`));

    const res = await callRoute();
    const body = await res.json();

    expect(mockApproveReview).toHaveBeenCalledTimes(2);
    expect(mockApproveReview).toHaveBeenCalledWith("q-A", expect.objectContaining({ slug: "review-a" }));
    expect(mockApproveReview).toHaveBeenCalledWith("q-C", expect.objectContaining({ slug: "review-c" }));
    expect(mockApproveReview).not.toHaveBeenCalledWith("q-B", expect.anything());
    expect(body.published).toBe(2);
  });

  it("F: approveReview() is never called for the malformed item, even when it is the only item", async () => {
    mockReviewQueueFindMany.mockResolvedValue([queueItem({ id: "q-only-bad", slug: null })]);

    await callRoute();

    expect(mockApproveReview).not.toHaveBeenCalled();
  });

  it("G: no downstream publication side effect runs for the malformed item — generateReviewImage is never called for it", async () => {
    mockReviewQueueFindMany.mockResolvedValue([
      queueItem({ id: "q-bad", slug: "", featuredImagePrompt: "a prompt that should never be used" }),
    ]);

    await callRoute();

    expect(mockGenerateReviewImage).not.toHaveBeenCalled();
  });

  it("H: trimming does not corrupt a valid slug — the exact original slug is passed through", async () => {
    mockReviewQueueFindMany.mockResolvedValue([queueItem({ id: "q-trim", slug: "  already-clean-slug  " })]);

    await callRoute();

    expect(mockApproveReview).toHaveBeenCalledWith(
      "q-trim",
      expect.objectContaining({ slug: "already-clean-slug" }),
    );
  });

  it("marks the malformed item as failed (existing status/failureReason mechanism) rather than leaving it silently stuck", async () => {
    mockReviewQueueFindMany.mockResolvedValue([queueItem({ id: "q-bad", slug: "" })]);

    await callRoute();

    expect(mockMarkReviewFailed).toHaveBeenCalledWith(
      "q-bad",
      expect.stringContaining("slug"),
    );
  });
});
