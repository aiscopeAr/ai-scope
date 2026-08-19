import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockGetServerSession = vi.fn();
const mockGenerateReviewImage = vi.fn();
const mockReviewFindMany = vi.fn();
const mockReviewUpdate = vi.fn();
const mockReviewQueueFindFirst = vi.fn();
const mockReviewQueueUpdate = vi.fn();

vi.mock("next-auth", () => ({ getServerSession: (...args: unknown[]) => mockGetServerSession(...args) }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("@/lib/images", () => ({ generateReviewImage: (...args: unknown[]) => mockGenerateReviewImage(...args) }));
vi.mock("@/lib/db", () => ({
  prisma: {
    review: {
      findMany: (...args: unknown[]) => mockReviewFindMany(...args),
      update: (...args: unknown[]) => mockReviewUpdate(...args),
    },
    reviewQueue: {
      findFirst: (...args: unknown[]) => mockReviewQueueFindFirst(...args),
      update: (...args: unknown[]) => mockReviewQueueUpdate(...args),
    },
  },
}));

// The 12s inter-item delay is real production pacing (Replicate rate limit)
// but would make every test slow; fake timers let it resolve instantly.
beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
  mockGetServerSession.mockResolvedValue({ user: { email: "admin@example.com" } });
});

afterEach(() => {
  vi.useRealTimers();
});

async function callRouteFlushingTimers() {
  const { POST } = await import("./route");
  const resultPromise = POST();
  await vi.runAllTimersAsync();
  return resultPromise;
}

describe("POST /api/admin/backfill-images — prompt source", () => {
  it("uses the Review's real featuredImagePrompt from ReviewQueue when present", async () => {
    mockReviewFindMany.mockResolvedValue([
      { id: "rev1", slug: "some-review", titleAr: "عنوان", imageUrl: null },
    ]);
    mockReviewQueueFindFirst.mockResolvedValue({ id: "q1", featuredImagePrompt: "a very specific curated prompt" });
    mockGenerateReviewImage.mockResolvedValue("https://res.cloudinary.com/demo/x.webp");

    await callRouteFlushingTimers();

    expect(mockGenerateReviewImage).toHaveBeenCalledWith("a very specific curated prompt");
  });

  it("falls back to the hardcoded prompt table only when no featuredImagePrompt exists", async () => {
    mockReviewFindMany.mockResolvedValue([
      { id: "rev1", slug: "what-is-claude-ai-anthropic-guide", titleAr: "عنوان", imageUrl: null },
    ]);
    mockReviewQueueFindFirst.mockResolvedValue(null);
    mockGenerateReviewImage.mockResolvedValue("https://res.cloudinary.com/demo/x.webp");

    await callRouteFlushingTimers();

    const promptUsed = mockGenerateReviewImage.mock.calls[0][0] as string;
    expect(promptUsed).toContain("Claude AI assistant Anthropic");
  });

  it("falls back to a generic title-based prompt when neither featuredImagePrompt nor a hardcoded entry exists", async () => {
    mockReviewFindMany.mockResolvedValue([
      { id: "rev1", slug: "some-unmapped-slug", titleAr: "موضوع غير معروف", imageUrl: null },
    ]);
    mockReviewQueueFindFirst.mockResolvedValue(null);
    mockGenerateReviewImage.mockResolvedValue("https://res.cloudinary.com/demo/x.webp");

    await callRouteFlushingTimers();

    const promptUsed = mockGenerateReviewImage.mock.calls[0][0] as string;
    expect(promptUsed).toContain("موضوع غير معروف");
    expect(promptUsed).toContain("artificial intelligence");
  });
});

describe("POST /api/admin/backfill-images — persistence", () => {
  it("updates both Review.imageUrl and ReviewQueue.imageUrl on success", async () => {
    mockReviewFindMany.mockResolvedValue([
      { id: "rev1", slug: "some-review", titleAr: "عنوان", imageUrl: null },
    ]);
    mockReviewQueueFindFirst.mockResolvedValue({ id: "q1", featuredImagePrompt: "prompt" });
    mockGenerateReviewImage.mockResolvedValue("https://res.cloudinary.com/demo/x.webp");

    await callRouteFlushingTimers();

    expect(mockReviewUpdate).toHaveBeenCalledWith({
      where: { id: "rev1" },
      data: { imageUrl: "https://res.cloudinary.com/demo/x.webp" },
    });
    expect(mockReviewQueueUpdate).toHaveBeenCalledWith({
      where: { id: "q1" },
      data: { imageUrl: "https://res.cloudinary.com/demo/x.webp" },
    });
  });

  it("does not attempt a ReviewQueue update when no matching queue item exists", async () => {
    mockReviewFindMany.mockResolvedValue([
      { id: "rev1", slug: "what-is-claude-ai-anthropic-guide", titleAr: "عنوان", imageUrl: null },
    ]);
    mockReviewQueueFindFirst.mockResolvedValue(null);
    mockGenerateReviewImage.mockResolvedValue("https://res.cloudinary.com/demo/x.webp");

    await callRouteFlushingTimers();

    expect(mockReviewUpdate).toHaveBeenCalled();
    expect(mockReviewQueueUpdate).not.toHaveBeenCalled();
  });

  it("does not update the database when generation returns null", async () => {
    mockReviewFindMany.mockResolvedValue([
      { id: "rev1", slug: "some-review", titleAr: "عنوان", imageUrl: null },
    ]);
    mockReviewQueueFindFirst.mockResolvedValue({ id: "q1", featuredImagePrompt: "prompt" });
    mockGenerateReviewImage.mockResolvedValue(null);

    const res = await callRouteFlushingTimers();
    const body = await res.json();

    expect(mockReviewUpdate).not.toHaveBeenCalled();
    expect(mockReviewQueueUpdate).not.toHaveBeenCalled();
    expect(body.results[0].status).toBe("no_url");
  });
});

describe("POST /api/admin/backfill-images — auth", () => {
  it("returns 401 when there is no session", async () => {
    mockGetServerSession.mockResolvedValue(null);
    const { POST } = await import("./route");
    const res = await POST();
    expect(res.status).toBe(401);
    expect(mockReviewFindMany).not.toHaveBeenCalled();
  });
});

describe("POST /api/admin/backfill-images — blank-slug and blank-prompt guards", () => {
  it("A: never queries ReviewQueue when the Review's slug is an empty string", async () => {
    mockReviewFindMany.mockResolvedValue([
      { id: "rev1", slug: "", titleAr: "عنوان", imageUrl: null },
    ]);

    const res = await callRouteFlushingTimers();
    const body = await res.json();

    expect(mockReviewQueueFindFirst).not.toHaveBeenCalled();
    expect(mockGenerateReviewImage).not.toHaveBeenCalled();
    expect(body.results[0].status).toBe("skipped_blank_slug");
  });

  it("B: whitespace-only slug is treated the same as empty — never queries ReviewQueue", async () => {
    mockReviewFindMany.mockResolvedValue([
      { id: "rev1", slug: "   ", titleAr: "عنوان", imageUrl: null },
    ]);

    const res = await callRouteFlushingTimers();
    const body = await res.json();

    expect(mockReviewQueueFindFirst).not.toHaveBeenCalled();
    expect(mockGenerateReviewImage).not.toHaveBeenCalled();
    expect(body.results[0].status).toBe("skipped_blank_slug");
  });

  it("C: empty-string featuredImagePrompt is treated as missing — falls back rather than generating from an empty prompt", async () => {
    mockReviewFindMany.mockResolvedValue([
      { id: "rev1", slug: "some-review", titleAr: "موضوع عام", imageUrl: null },
    ]);
    mockReviewQueueFindFirst.mockResolvedValue({ id: "q1", featuredImagePrompt: "" });
    mockGenerateReviewImage.mockResolvedValue("https://res.cloudinary.com/demo/x.webp");

    await callRouteFlushingTimers();

    const promptUsed = mockGenerateReviewImage.mock.calls[0][0] as string;
    expect(promptUsed).not.toBe("");
    expect(promptUsed).toContain("موضوع عام");
  });

  it("D: whitespace-only featuredImagePrompt is treated as missing — falls back", async () => {
    mockReviewFindMany.mockResolvedValue([
      { id: "rev1", slug: "some-review", titleAr: "موضوع عام", imageUrl: null },
    ]);
    mockReviewQueueFindFirst.mockResolvedValue({ id: "q1", featuredImagePrompt: "   " });
    mockGenerateReviewImage.mockResolvedValue("https://res.cloudinary.com/demo/x.webp");

    await callRouteFlushingTimers();

    const promptUsed = mockGenerateReviewImage.mock.calls[0][0] as string;
    expect(promptUsed).not.toBe("   ");
    expect(promptUsed).toContain("موضوع عام");
  });

  it("E: a valid slug and a valid prompt preserve current behavior unchanged", async () => {
    mockReviewFindMany.mockResolvedValue([
      { id: "rev1", slug: "a-real-slug", titleAr: "عنوان", imageUrl: null },
    ]);
    mockReviewQueueFindFirst.mockResolvedValue({ id: "q1", featuredImagePrompt: "a real curated prompt" });
    mockGenerateReviewImage.mockResolvedValue("https://res.cloudinary.com/demo/x.webp");

    await callRouteFlushingTimers();

    expect(mockReviewQueueFindFirst).toHaveBeenCalledWith({
      where: { slug: "a-real-slug" },
      select: { id: true, featuredImagePrompt: true },
    });
    expect(mockGenerateReviewImage).toHaveBeenCalledWith("a real curated prompt");
  });

  it("F: duplicate/blank queue rows cannot leak another Review's prompt — blank slug skips the lookup entirely, never selecting an arbitrary row", async () => {
    // Simulates the real-world scenario: multiple ReviewQueue rows share
    // slug: "". Even though the mock would happily return one if queried,
    // the route must never issue that query in the first place for a
    // blank-slug Review.
    mockReviewFindMany.mockResolvedValue([
      { id: "rev1", slug: "", titleAr: "موضوع فارغ", imageUrl: null },
    ]);
    mockReviewQueueFindFirst.mockResolvedValue({
      id: "wrong-queue-row",
      featuredImagePrompt: "an unrelated review's prompt",
    });

    await callRouteFlushingTimers();

    expect(mockReviewQueueFindFirst).not.toHaveBeenCalled();
    expect(mockGenerateReviewImage).not.toHaveBeenCalled();
  });
});
