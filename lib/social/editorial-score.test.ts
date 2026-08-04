import { describe, it, expect } from "vitest";
import { scoreTelegramMessage } from "./editorial-score";
import { buildTelegramMessageParts, renderTelegramMessage } from "./telegram-templates";

const baseInput = {
  titleAr: "Microsoft وMistral: شراكة أم استحواذ ناعم؟",
  summary: "تتسارع تحالفات التقنية الكبرى في أوروبا مع دخول لاعبين جدد إلى السوق.",
  content: "نص المقال الكامل هنا مع تفاصيل عن الشراكة الجديدة.",
  tags: ["Microsoft", "Mistral"],
  category: { slug: "companies", nameAr: "الشركات" },
  publishedAt: new Date("2020-01-01"),
  sources: [{ name: "Reuters" }],
  slug: "microsoft-mistral-partnership",
  readingMinutes: 3,
};

describe("scoreTelegramMessage — headline sub-score", () => {
  it("penalizes a headline opening with هل or كيف (the Sprint 4 audit's main finding)", () => {
    const questionParts = buildTelegramMessageParts({ ...baseInput, titleAr: "هل يمكن للشراكة أن تغيّر السوق؟" });
    const declarativeParts = buildTelegramMessageParts({ ...baseInput, titleAr: "Microsoft تعيد رسم حدود شراكاتها" });

    const questionScore = scoreTelegramMessage(questionParts, renderTelegramMessage(questionParts));
    const declarativeScore = scoreTelegramMessage(declarativeParts, renderTelegramMessage(declarativeParts));

    expect(questionScore.headline).toBeLessThan(declarativeScore.headline);
  });

  it("penalizes a truncated (ellipsis-ending) headline", () => {
    const longTitle = "عنوان طويل جداً ".repeat(15);
    const parts = buildTelegramMessageParts({ ...baseInput, titleAr: longTitle });
    const score = scoreTelegramMessage(parts, renderTelegramMessage(parts));
    expect(parts.headline.endsWith("…")).toBe(true);
    expect(score.headline).toBeLessThan(100);
  });
});

describe("scoreTelegramMessage — readability sub-score", () => {
  it("rewards a message with highlights and a stated reading time over one without", () => {
    const withSignals = buildTelegramMessageParts(baseInput);
    const withoutSignals = buildTelegramMessageParts({
      ...baseInput,
      sources: [],
      category: { slug: "companies", nameAr: "" },
      readingMinutes: undefined,
    });

    const withScore = scoreTelegramMessage(withSignals, renderTelegramMessage(withSignals));
    const withoutScore = scoreTelegramMessage(withoutSignals, renderTelegramMessage(withoutSignals));

    expect(withScore.readability).toBeGreaterThan(withoutScore.readability);
  });
});

describe("scoreTelegramMessage — visual quality sub-score", () => {
  it("rewards a specific template over the generic fallback", () => {
    const specific = buildTelegramMessageParts(baseInput); // routes to "company"
    const generic = buildTelegramMessageParts({
      ...baseInput,
      category: { slug: "applications", nameAr: "تطبيقات" },
      publishedAt: new Date("2020-01-01"),
      titleAr: "خبر عادي بدون زاوية خاصة",
    });

    const specificScore = scoreTelegramMessage(specific, renderTelegramMessage(specific));
    const genericScore = scoreTelegramMessage(generic, renderTelegramMessage(generic));

    expect(specific.template).toBe("company");
    expect(genericScore.visualQuality).toBeLessThanOrEqual(specificScore.visualQuality);
  });
});

describe("scoreTelegramMessage — brand consistency sub-score", () => {
  it("penalizes the legacy Markdown-asterisk format if it ever appears in a rendered body", () => {
    const parts = buildTelegramMessageParts(baseInput);
    const legacyBody = `📰 *${parts.headline}*\n\nنص`;
    const modernBody = renderTelegramMessage(parts);

    const legacyScore = scoreTelegramMessage(parts, legacyBody);
    const modernScore = scoreTelegramMessage(parts, modernBody);

    expect(legacyScore.brandConsistency).toBeLessThan(modernScore.brandConsistency);
  });

  it("gives a real renderTelegramMessage() output full brand-consistency marks", () => {
    const parts = buildTelegramMessageParts(baseInput);
    const body = renderTelegramMessage(parts);
    const score = scoreTelegramMessage(parts, body);
    expect(score.brandConsistency).toBe(100);
  });
});

describe("scoreTelegramMessage — overall", () => {
  it("stays within 0–100 for every sub-score and the overall", () => {
    const parts = buildTelegramMessageParts(baseInput);
    const score = scoreTelegramMessage(parts, renderTelegramMessage(parts));

    for (const value of Object.values(score)) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(100);
    }
  });

  it("is deterministic — same input always yields the same score", () => {
    const parts = buildTelegramMessageParts(baseInput);
    const body = renderTelegramMessage(parts);
    const a = scoreTelegramMessage(parts, body);
    const b = scoreTelegramMessage(parts, body);
    expect(a).toEqual(b);
  });
});
