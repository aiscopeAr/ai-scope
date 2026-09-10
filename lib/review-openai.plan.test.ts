import { beforeEach, describe, expect, it, vi } from "vitest";
import type { EditorialPlan } from "./editorial/plan-types";

// Capture the prompt handed to OpenAI so we can assert which writer path ran.
const mockCreate = vi.fn();
vi.mock("openai", () => ({
  default: class {
    chat = { completions: { create: (...a: unknown[]) => mockCreate(...a) } };
  },
}));
vi.mock("@/lib/embeddings", () => ({ findSimilarReviews: vi.fn().mockResolvedValue([]) }));
vi.mock("@/lib/author-memory", () => ({ getAuthorMemoryBlock: vi.fn().mockResolvedValue("") }));

import { writeReview } from "./review-openai";

const sources = [{ title: "t", content: "c", url: "https://a/1", name: "TC" }];

const draftJson = JSON.stringify({
  titleAr: "عنوان", summaryAr: "ملخص", contentAr: "## قسم\nنص",
  tags: ["a"], keywords: ["b"], faq: [], seoTitle: "s", seoDescription: "d",
  isAiRelated: true, suggestedCategory: "ai-models", slug: "x-y", featuredImagePrompt: "p", imageAlt: "alt",
});

function plan(overrides: Partial<EditorialPlan> = {}): EditorialPlan {
  return {
    storyType: "STANDARD_NEWS", depth: "standard",
    centralEvent: "حدث", primaryAngle: "WHAT_CHANGED",
    editorialThesis: "أطروحة", readerValue: "قيمة", openingStrategy: "FACT_FIRST",
    authorLens: "zayd",
    sections: [
      { workingTitle: "ما الذي أُطلق", purpose: "وصف", questionsToAnswer: ["ما الجديد؟"] },
      { workingTitle: "لمن هذا", purpose: "قيمة", questionsToAnswer: ["من المستفيد؟"] },
    ],
    includeFaq: false, includeComparison: false, includeMena: false, uncertainties: [],
    ...overrides,
  };
}

function lastUserPrompt(): string {
  const call = mockCreate.mock.calls[mockCreate.mock.calls.length - 1][0] as {
    messages: Array<{ role: string; content: string }>;
  };
  return call.messages.find((m) => m.role === "user")!.content;
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.OPENAI_API_KEY = "test-key";
  mockCreate.mockResolvedValue({ choices: [{ message: { content: draftJson } }] });
});

describe("writeReview — A3 plan consumption", () => {
  it("no plan → exact V1 prompt path (legacy suggested skeleton present, no plan block)", async () => {
    await writeReview("topic", sources, "zayd");
    const prompt = lastUserPrompt();
    expect(prompt).toContain("بنيّة مقترحة"); // V1 marker
    expect(prompt).not.toContain("الخطة التحريرية"); // plan block absent
  });

  it("valid plan → plan-driven prompt (plan block + planned headings; no V1 skeleton)", async () => {
    await writeReview("topic", sources, "zayd", plan());
    const prompt = lastUserPrompt();
    expect(prompt).toContain("الخطة التحريرية");
    expect(prompt).toContain("## ما الذي أُطلق");
    expect(prompt).toContain("## لمن هذا");
    expect(prompt).not.toContain("بنيّة مقترحة"); // no V1 legacy skeleton suggestion
  });

  it("plan with FAQ/comparison/MENA disabled → no forced sections", async () => {
    await writeReview("topic", sources, "zayd", plan());
    const prompt = lastUserPrompt();
    expect(prompt).not.toContain("غطِّ نيّات"); // no FAQ directive
    expect(prompt).toContain("المقارنة: غير مطلوبة");
    expect(prompt).toContain("لا تُضِف فقرة"); // no MENA paragraph
  });

  it("plan path returns the same ReviewDraft schema", async () => {
    const draft = await writeReview("topic", sources, "zayd", plan());
    expect(draft).toMatchObject({
      titleAr: "عنوان", summaryAr: "ملخص", contentAr: "## قسم\nنص",
      slug: "x-y", isAiRelated: true, authorSlug: "zayd",
    });
    expect(Array.isArray(draft.faq)).toBe(true);
    expect(draft.faq).toHaveLength(0);
  });

  it("same system prompt (author persona) is used on the plan path", async () => {
    await writeReview("topic", sources, "zayd", plan());
    const call = mockCreate.mock.calls[0][0] as { messages: Array<{ role: string; content: string }> };
    const system = call.messages.find((m) => m.role === "system")!.content;
    expect(system).toContain("زيد");
  });
});
