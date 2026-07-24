import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Telegram Growth Sprint 3 — flooding-prevention tests.
 *
 * These target the structural guarantee (confirmed during this sprint's
 * audit) that lib/review-queue.ts's approveReview() is the ONLY place in
 * the codebase that ever creates a SocialPost row, and that it only runs
 * once per ReviewQueue item at the moment that item is promoted to a live
 * Review — never retroactively against an already-published Review. That
 * means there is no code path capable of "backfilling" old historical
 * content into the Telegram queue.
 */
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/embeddings", () => ({ embedReview: vi.fn().mockResolvedValue(undefined) }));
vi.mock("@/lib/author-memory", () => ({ extractMemoryFromReview: vi.fn().mockResolvedValue(undefined) }));
vi.mock("@/lib/wordpress", () => ({ syndicateReviewToWordPress: vi.fn().mockResolvedValue(undefined) }));
vi.mock("@/lib/cache", () => ({ CACHE_TAGS: { reviews: "reviews", categories: "categories" }, revalidateNow: vi.fn() }));

const reviewQueueFindUniqueOrThrow = vi.fn();
const reviewCreate = vi.fn();
const reviewQueueUpdate = vi.fn();
const socialAccountFindMany = vi.fn();
const socialPostCreateMany = vi.fn();
const categoryFindUniqueOrThrow = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    reviewQueue: {
      findUniqueOrThrow: (...args: unknown[]) => reviewQueueFindUniqueOrThrow(...args),
      update: (...args: unknown[]) => reviewQueueUpdate(...args),
    },
    review: { create: (...args: unknown[]) => reviewCreate(...args) },
    socialAccount: { findMany: (...args: unknown[]) => socialAccountFindMany(...args) },
    socialPost: { createMany: (...args: unknown[]) => socialPostCreateMany(...args) },
    category: { findUniqueOrThrow: (...args: unknown[]) => categoryFindUniqueOrThrow(...args) },
  },
}));

describe("Historical content is never accidentally queued for Telegram", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    reviewQueueFindUniqueOrThrow.mockResolvedValue({
      id: "queue-1", topic: "Test", authorSlug: "zayd",
      titleAr: "عنوان", summaryAr: "ملخص", contentAr: "محتوى", tags: [], newsItems: [],
    });
    reviewCreate.mockResolvedValue({ id: "review-1" });
    reviewQueueUpdate.mockResolvedValue({});
    categoryFindUniqueOrThrow.mockResolvedValue({ slug: "companies", nameAr: "الشركات" });
    socialAccountFindMany.mockResolvedValue([{ id: "acc-1", platform: "telegram", enabled: true, credentials: "{}" }]);
    socialPostCreateMany.mockResolvedValue({ count: 1 });
  });

  it("drafts a SocialPost only when approveReview is explicitly called with published: true", async () => {
    const { approveReview } = await import("./review-queue");
    await approveReview("queue-1", { categoryId: "cat-1", slug: "some-slug", published: false });
    expect(socialPostCreateMany).not.toHaveBeenCalled();
  });

  it("drafts exactly one SocialPost batch per approveReview call — never more than the single call's worth of accounts", async () => {
    const { approveReview } = await import("./review-queue");
    await approveReview("queue-1", { categoryId: "cat-1", slug: "some-slug", published: true });
    expect(socialPostCreateMany).toHaveBeenCalledTimes(1);
  });

  it("approveReview never queries for OTHER, already-published reviews — it only acts on the ReviewQueue item passed in", async () => {
    const { approveReview } = await import("./review-queue");
    await approveReview("queue-1", { categoryId: "cat-1", slug: "some-slug", published: true });

    // The only reviewQueue lookup made is for the exact id passed in — no
    // bulk/backfill query across other queue items or existing Review rows.
    expect(reviewQueueFindUniqueOrThrow).toHaveBeenCalledTimes(1);
    expect(reviewQueueFindUniqueOrThrow).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "queue-1" } }),
    );
  });
});

describe("Duplicate SocialPost prevention — structural guarantee", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    reviewQueueFindUniqueOrThrow.mockResolvedValue({
      id: "queue-1", topic: "Test", authorSlug: "zayd",
      titleAr: "عنوان", summaryAr: "ملخص", contentAr: "محتوى", tags: [], newsItems: [],
    });
    reviewCreate.mockResolvedValue({ id: "review-1" });
    reviewQueueUpdate.mockResolvedValue({});
    categoryFindUniqueOrThrow.mockResolvedValue({ slug: "companies", nameAr: "الشركات" });
    socialAccountFindMany.mockResolvedValue([{ id: "acc-1", platform: "telegram", enabled: true, credentials: "{}" }]);
    socialPostCreateMany.mockResolvedValue({ count: 1 });
  });

  it("marks the ReviewQueue item as approved after drafting, which structurally prevents it from being re-published/re-drafted by the daily cron", async () => {
    const { approveReview } = await import("./review-queue");
    await approveReview("queue-1", { categoryId: "cat-1", slug: "some-slug", published: true });

    expect(reviewQueueUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "queue-1" }, data: expect.objectContaining({ status: "approved" }) }),
    );
  });

  it("creates one SocialPost row per enabled account, not per review-times-account combination re-run", async () => {
    socialAccountFindMany.mockResolvedValueOnce([
      { id: "acc-1", platform: "telegram", enabled: true, credentials: "{}" },
    ]);
    const { approveReview } = await import("./review-queue");
    await approveReview("queue-1", { categoryId: "cat-1", slug: "some-slug", published: true });

    const [{ data }] = socialPostCreateMany.mock.calls[0];
    expect(data).toHaveLength(1);
    expect(data[0].reviewId).toBe("review-1");
  });
});
