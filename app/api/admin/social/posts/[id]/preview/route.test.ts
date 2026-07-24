import { describe, it, expect, vi, beforeEach } from "vitest";
import { buildReviewTelegramMessage } from "@/lib/social/telegram-message";

const socialPostFindUnique = vi.fn();
const reviewFindUnique = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    socialPost: { findUnique: (...args: unknown[]) => socialPostFindUnique(...args) },
    review: { findUnique: (...args: unknown[]) => reviewFindUnique(...args) },
  },
}));

const sampleReview = {
  titleAr: "عنوان تجريبي للمعاينة",
  summary: "ملخص تجريبي للمقال",
  content: "محتوى تجريبي [[tool:notion-ai|Notion AI]]",
  tags: ["إنتاجية", "أدوات"],
  slug: "sample-review-slug",
  imageUrl: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
  publishedAt: new Date("2020-01-01"),
  sources: JSON.stringify([{ name: "TechCrunch" }]),
  category: { slug: "ai-tools", nameAr: "أدوات الذكاء الاصطناعي" },
};

describe("admin preview endpoint — equals production output", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    socialPostFindUnique.mockResolvedValue({ id: "post-1", platform: "telegram", reviewId: "review-1" });
    reviewFindUnique.mockResolvedValue(sampleReview);
  });

  it("returns a caption identical to what buildReviewTelegramMessage produces directly for the same review data", async () => {
    const { GET } = await import("./route");
    const req = new Request("https://x.test/api/admin/social/posts/post-1/preview");
    const res = await GET(req, { params: Promise.resolve({ id: "post-1" }) });
    const data = await res.json();

    const expected = buildReviewTelegramMessage({
      titleAr: sampleReview.titleAr,
      summary: sampleReview.summary,
      content: sampleReview.content,
      tags: sampleReview.tags,
      category: sampleReview.category,
      publishedAt: sampleReview.publishedAt,
      sources: [{ name: "TechCrunch" }],
      slug: sampleReview.slug,
    });

    expect(data.caption).toBe(expected.body);
    expect(data.template).toBe(expected.template);
    expect(data.hashtags).toEqual(expected.hashtags);
  });

  it("includes a UTM-tagged article URL", async () => {
    const { GET } = await import("./route");
    const req = new Request("https://x.test/api/admin/social/posts/post-1/preview");
    const res = await GET(req, { params: Promise.resolve({ id: "post-1" }) });
    const data = await res.json();

    expect(data.articleUrl).toContain("utm_source=telegram");
    expect(data.articleUrl).toContain("utm_medium=social");
    expect(data.articleUrl).toContain(sampleReview.slug);
  });

  it("returns the image URL Telegram is expected to unfurl", async () => {
    const { GET } = await import("./route");
    const req = new Request("https://x.test/api/admin/social/posts/post-1/preview");
    const res = await GET(req, { params: Promise.resolve({ id: "post-1" }) });
    const data = await res.json();

    expect(data.imageUrl).toBe(sampleReview.imageUrl);
  });

  it("returns null imageUrl (not an error) when the review has no image", async () => {
    reviewFindUnique.mockResolvedValueOnce({ ...sampleReview, imageUrl: null });
    const { GET } = await import("./route");
    const req = new Request("https://x.test/api/admin/social/posts/post-1/preview");
    const res = await GET(req, { params: Promise.resolve({ id: "post-1" }) });
    const data = await res.json();

    expect(data.imageUrl).toBeNull();
  });

  it("never sends a real Telegram request — no fetch to api.telegram.org occurs", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    const { GET } = await import("./route");
    const req = new Request("https://x.test/api/admin/social/posts/post-1/preview");
    await GET(req, { params: Promise.resolve({ id: "post-1" }) });

    expect(fetchSpy).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it("returns 404 when the post does not exist", async () => {
    socialPostFindUnique.mockResolvedValueOnce(null);
    const { GET } = await import("./route");
    const req = new Request("https://x.test/api/admin/social/posts/missing/preview");
    const res = await GET(req, { params: Promise.resolve({ id: "missing" }) });
    expect(res.status).toBe(404);
  });
});
