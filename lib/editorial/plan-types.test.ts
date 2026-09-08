import { describe, it, expect } from "vitest";
import {
  validateEditorialPlan,
  isLegacySkeleton,
  impliesFirstHandExperience,
  type EditorialPlan,
} from "./plan-types";

function validPlan(overrides: Partial<EditorialPlan> = {}): EditorialPlan {
  return {
    storyType: "PRODUCT_LAUNCH",
    depth: "standard",
    centralEvent: "شركة أطلقت نموذجاً جديداً للذكاء الاصطناعي",
    primaryAngle: "WHAT_CHANGED",
    editorialThesis: "الإطلاق يغيّر موازين المنافسة",
    readerValue: "يفهم القارئ ما الجديد ولماذا يهم",
    openingStrategy: "FACT_FIRST",
    authorLens: "zayd",
    sections: [
      { purpose: "وصف ما أُطلق", workingTitle: "ما الذي أُطلق", questionsToAnswer: ["ما هو؟"] },
      { purpose: "السعر والتوفر", workingTitle: "السعر والتوفر", questionsToAnswer: ["كم يكلّف؟"] },
      { purpose: "الموقع أمام المنافسين", workingTitle: "أين يقف أمام المنافسين", questionsToAnswer: ["مقابل من؟"] },
    ],
    includeFaq: false,
    includeComparison: false,
    includeMena: false,
    uncertainties: [],
    ...overrides,
  };
}

describe("validateEditorialPlan", () => {
  it("A/B: accepts a well-formed plan with valid enums", () => {
    expect(validateEditorialPlan(validPlan()).ok).toBe(true);
  });

  it("B: rejects invalid enum values", () => {
    expect(validateEditorialPlan(validPlan({ storyType: "NOPE" as never })).ok).toBe(false);
    expect(validateEditorialPlan(validPlan({ depth: "epic" as never })).ok).toBe(false);
    expect(validateEditorialPlan(validPlan({ primaryAngle: "VIBES" as never })).ok).toBe(false);
    expect(validateEditorialPlan(validPlan({ openingStrategy: "SHOUT" as never })).ok).toBe(false);
  });

  it("rejects empty centralEvent / thesis / readerValue", () => {
    expect(validateEditorialPlan(validPlan({ centralEvent: "  " })).ok).toBe(false);
    expect(validateEditorialPlan(validPlan({ editorialThesis: "" })).ok).toBe(false);
    expect(validateEditorialPlan(validPlan({ readerValue: "" })).ok).toBe(false);
  });

  it("E: enforces 2–7 sections", () => {
    expect(validateEditorialPlan(validPlan({ sections: [validPlan().sections[0]] })).ok).toBe(false);
    const eight = Array.from({ length: 8 }, (_, i) => ({ purpose: `غرض ${i}`, workingTitle: `قسم رقم ${i}`, questionsToAnswer: ["س"] }));
    expect(validateEditorialPlan(validPlan({ sections: eight })).ok).toBe(false);
    expect(validateEditorialPlan(validPlan()).ok).toBe(true); // 3 sections
  });

  it("F: rejects duplicate section titles", () => {
    const dup = validPlan({
      sections: [
        { purpose: "أ", workingTitle: "نفس العنوان", questionsToAnswer: ["س"] },
        { purpose: "ب", workingTitle: "نفس العنوان", questionsToAnswer: ["س"] },
      ],
    });
    expect(validateEditorialPlan(dup).ok).toBe(false);
  });

  it("G: rejects the legacy 5-heading skeleton", () => {
    const legacy = validPlan({
      sections: [
        { purpose: "1", workingTitle: "السياق — لماذا هذا الموضوع مهم الآن؟", questionsToAnswer: ["س"] },
        { purpose: "2", workingTitle: "التفاصيل — الحقائق والأرقام", questionsToAnswer: ["س"] },
        { purpose: "3", workingTitle: "التحليل — من يستفيد؟", questionsToAnswer: ["س"] },
        { purpose: "4", workingTitle: "المقارنة — كيف يقارن بما سبق؟", questionsToAnswer: ["س"] },
        { purpose: "5", workingTitle: "التداعيات — ماذا بعد؟", questionsToAnswer: ["س"] },
      ],
    });
    expect(validateEditorialPlan(legacy).ok).toBe(false);
    expect(isLegacySkeleton(legacy.sections.map((s) => s.workingTitle))).toBe(true);
    expect(isLegacySkeleton(["ما الذي أُطلق", "السعر والتوفر", "أمام المنافسين"])).toBe(false);
  });

  it("H: includeFaq=true requires faqIntent", () => {
    expect(validateEditorialPlan(validPlan({ includeFaq: true })).ok).toBe(false);
    expect(validateEditorialPlan(validPlan({ includeFaq: true, faqIntent: ["ما السعر؟"] })).ok).toBe(true);
  });

  it("I: includeComparison=true requires a comparisonTarget", () => {
    expect(validateEditorialPlan(validPlan({ includeComparison: true })).ok).toBe(false);
    expect(validateEditorialPlan(validPlan({ includeComparison: true, comparisonTarget: "GPT-4o" })).ok).toBe(true);
  });

  it("J: includeMena=true requires a specific menaReason", () => {
    expect(validateEditorialPlan(validPlan({ includeMena: true })).ok).toBe(false);
    expect(validateEditorialPlan(validPlan({ includeMena: true, menaReason: "دعم اللغة العربية أُتيح رسمياً" })).ok).toBe(true);
  });

  it("L: rejects a plan implying first-hand testing/usage by Lumiq", () => {
    expect(impliesFirstHandExperience("بعد استخدامنا للأداة لمدة أسبوع")).toBe(true);
    expect(impliesFirstHandExperience("in our hands-on test the model")).toBe(true);
    expect(impliesFirstHandExperience("أعلنت الشركة عن نموذج جديد")).toBe(false);
    const firstHand = validPlan({ editorialThesis: "بعد أن اختبرنا الأداة بأنفسنا وجدنا أنها الأفضل" });
    expect(validateEditorialPlan(firstHand).ok).toBe(false);
  });

  it("rejects invalid uncertainty objects", () => {
    expect(validateEditorialPlan(validPlan({ uncertainties: [{ kind: "made-up" as never, note: "x", material: true }] })).ok).toBe(false);
    expect(validateEditorialPlan(validPlan({ uncertainties: [{ kind: "pricing", note: "السعر غير معلن", material: true }] })).ok).toBe(true);
  });

  it("rejects non-object input", () => {
    expect(validateEditorialPlan(null).ok).toBe(false);
    expect(validateEditorialPlan("nope").ok).toBe(false);
  });
});
