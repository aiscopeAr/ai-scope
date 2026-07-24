import { describe, it, expect, vi, beforeEach } from "vitest";

// Full isolation of approveReview's dependencies — this test targets one
// specific behavior (drafting-failure visibility + non-blocking publish),
// not the whole review-approval workflow, so every side effect is mocked.
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
    review: {
      create: (...args: unknown[]) => reviewCreate(...args),
    },
    socialAccount: {
      findMany: (...args: unknown[]) => socialAccountFindMany(...args),
    },
    socialPost: {
      createMany: (...args: unknown[]) => socialPostCreateMany(...args),
    },
    category: {
      findUniqueOrThrow: (...args: unknown[]) => categoryFindUniqueOrThrow(...args),
    },
  },
}));

describe("approveReview — drafting failure is logged, never silent, and never blocks publish", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    reviewQueueFindUniqueOrThrow.mockResolvedValue({
      id: "queue-1",
      topic: "Test topic",
      authorSlug: "zayd",
      titleAr: "عنوان تجريبي",
      summaryAr: "ملخص",
      contentAr: "محتوى",
      tags: [],
      newsItems: [],
    });
    reviewCreate.mockResolvedValue({ id: "review-1" });
    reviewQueueUpdate.mockResolvedValue({});
    categoryFindUniqueOrThrow.mockResolvedValue({ slug: "ai-tools", nameAr: "أدوات الذكاء الاصطناعي" });
  });

  it("logs the drafting failure with review id context and does not throw out of approveReview", async () => {
    socialAccountFindMany.mockRejectedValueOnce(new Error("DB connection dropped"));
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const { approveReview } = await import("./review-queue");

    const reviewId = await approveReview("queue-1", {
      categoryId: "cat-1",
      slug: "test-slug",
      published: true,
    });

    // Publish succeeded despite the drafting failure downstream.
    expect(reviewId).toBe("review-1");

    const draftingLog = errorSpy.mock.calls.find((call) =>
      String(call[0]).includes("social post drafting failed"),
    );
    expect(draftingLog).toBeDefined();
    expect(String(draftingLog![0])).toContain("review-1");

    // Never log credentials — nothing in any console.error call should
    // reference a credentials blob or bot token.
    for (const call of errorSpy.mock.calls) {
      const joined = call.map((c) => (typeof c === "string" ? c : JSON.stringify(c))).join(" ");
      expect(joined.toLowerCase()).not.toContain("bottoken");
      expect(joined.toLowerCase()).not.toContain("credentials");
    }

    errorSpy.mockRestore();
  });

  it("still creates SocialPost rows with the escaped Telegram caption when drafting succeeds", async () => {
    socialAccountFindMany.mockResolvedValueOnce([
      { id: "acc-1", platform: "telegram", enabled: true, credentials: "{}" },
    ]);
    socialPostCreateMany.mockResolvedValueOnce({ count: 1 });

    const { approveReview } = await import("./review-queue");

    await approveReview("queue-1", { categoryId: "cat-1", slug: "test-slug", published: true });

    expect(socialPostCreateMany).toHaveBeenCalledTimes(1);
    const [{ data }] = socialPostCreateMany.mock.calls[0];
    expect(data[0].caption).toContain("<b>عنوان تجريبي</b>");
    expect(data[0].status).toBe("approved");
  });
});
