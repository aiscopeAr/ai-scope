import { describe, it, expect } from "vitest";
import type { EditorialPlan } from "./plan-types";
import { evaluateDraftQuality, type GateInput } from "./quality-gate";

function plan(overrides: Partial<EditorialPlan> = {}): EditorialPlan {
  return {
    storyType: "STANDARD_NEWS",
    depth: "breaking",
    centralEvent: "حدث",
    primaryAngle: "WHAT_CHANGED",
    editorialThesis: "أطروحة",
    readerValue: "قيمة",
    openingStrategy: "FACT_FIRST",
    authorLens: "zayd",
    sections: [
      { workingTitle: "أولاً", purpose: "p", questionsToAnswer: ["q"] },
      { workingTitle: "ثانياً", purpose: "p", questionsToAnswer: ["q"] },
      { workingTitle: "ثالثاً", purpose: "p", questionsToAnswer: ["q"] },
      { workingTitle: "رابعاً", purpose: "p", questionsToAnswer: ["q"] },
    ],
    includeFaq: false,
    includeComparison: false,
    includeMena: false,
    uncertainties: [],
    ...overrides,
  };
}

/** Build content with the given H2 headings, each padded to ~`wordsPerSection` words. */
function content(headings: string[], wordsPerSection = 80): string {
  return headings.map((h) => `## ${h}\n${("نصٌّ ".repeat(wordsPerSection)).trim()}`).join("\n\n");
}

function input(over: Partial<GateInput> = {}): GateInput {
  return {
    plan: plan(),
    draft: { titleAr: "عنوان", summaryAr: "ملخص", contentAr: content(["أولاً", "ثانياً", "ثالثاً", "رابعاً"]), faq: [] },
    writerPath: "a3",
    sourceCount: 5,
    ...over,
  };
}

describe("evaluateDraftQuality — PASS", () => {
  it("valid A3-style draft passes with no codes", () => {
    const r = evaluateDraftQuality(input());
    expect(r.outcome).toBe("PASS");
    expect(r.hardFailCodes).toEqual([]);
    expect(r.reviewCodes).toEqual([]);
    expect(r.warningCodes).toEqual([]);
    expect(r.metrics.h2Count).toBe(4);
    expect(r.metrics.plannedSectionCount).toBe(4);
  });
  it("breaking concise article (≥ threshold) passes cleanly", () => {
    const r = evaluateDraftQuality(input({ draft: { contentAr: content(["أولاً", "ثانياً", "ثالثاً", "رابعاً"], 70), faq: [] } }));
    expect(r.outcome).toBe("PASS");
    expect(r.warningCodes).not.toContain("TOO_SHORT");
  });
});

describe("evaluateDraftQuality — HARD fails (→ REJECT_DRAFT)", () => {
  it("empty content → EMPTY_CONTENT", () => {
    const r = evaluateDraftQuality(input({ draft: { contentAr: "   ", faq: [] } }));
    expect(r.hardFailCodes).toContain("EMPTY_CONTENT");
    expect(r.outcome).toBe("REJECT_DRAFT");
  });
  it("generator/SEO leakage → LEAKAGE", () => {
    const c = content(["أولاً", "ثانياً", "ثالثاً", "رابعاً"]) + "\n\n## الكلمات المفتاحية\n- x";
    const r = evaluateDraftQuality(input({ draft: { contentAr: c, faq: [] } }));
    expect(r.hardFailCodes).toContain("LEAKAGE");
  });
  it("first-hand Arabic claim → FIRST_HAND", () => {
    const c = content(["أولاً", "ثانياً", "ثالثاً", "رابعاً"]) + "\n\nجرّبنا الأداة بأنفسنا ووجدنا أنها سريعة.";
    const r = evaluateDraftQuality(input({ draft: { contentAr: c, faq: [] } }));
    expect(r.hardFailCodes).toContain("FIRST_HAND");
  });
  it("third-party attributed testing is NOT flagged as first-hand", () => {
    const c = content(["أولاً", "ثانياً", "ثالثاً", "رابعاً"]) + "\n\nقالت الشركة إنها اختبرت النموذج داخلياً.";
    const r = evaluateDraftQuality(input({ draft: { contentAr: c, faq: [] } }));
    expect(r.hardFailCodes).not.toContain("FIRST_HAND");
  });
  it("legacy 5-section skeleton on the A3 path → LEGACY_SKELETON", () => {
    const legacy = content(["السياق", "التفاصيل", "التحليل", "المقارنة", "التداعيات"]);
    const r = evaluateDraftQuality(input({ draft: { contentAr: legacy, faq: [] }, plan: plan({ sections: plan().sections.slice(0, 5).concat([{ workingTitle: "خامساً", purpose: "p", questionsToAnswer: ["q"] }]) }) }));
    expect(r.hardFailCodes).toContain("LEGACY_SKELETON");
  });
  it("plan had ≥3 sections but draft has ≤1 H2 → PLAN_SECTION_COLLAPSE", () => {
    const r = evaluateDraftQuality(input({ draft: { contentAr: "## وحيد\n" + "نص ".repeat(300), faq: [] } }));
    expect(r.hardFailCodes).toContain("PLAN_SECTION_COLLAPSE");
  });
});

describe("evaluateDraftQuality — length is DIAGNOSTIC only (never hard)", () => {
  it("standard ~240 words → TOO_SHORT warning, NOT a hard fail", () => {
    const c = content(["أولاً", "ثانياً", "ثالثاً"], 80); // 3 sections × 80 ≈ 240 words
    const r = evaluateDraftQuality(input({ plan: plan({ depth: "standard", sections: plan().sections.slice(0, 3) }), draft: { contentAr: c, faq: [] } }));
    expect(r.warningCodes).toContain("TOO_SHORT");
    expect(r.hardFailCodes).toEqual([]);
    expect(r.outcome).toBe("PASS_WITH_WARNINGS");
  });
  it("deep thin article → TOO_SHORT warning, no padding demanded, not hard", () => {
    const c = content(["أولاً", "ثانياً", "ثالثاً", "رابعاً"], 70); // ~280 words vs deep band 900
    const r = evaluateDraftQuality(input({ plan: plan({ depth: "deep" }), draft: { contentAr: c, faq: [] } }));
    expect(r.warningCodes).toContain("TOO_SHORT");
    expect(r.hardFailCodes).toEqual([]);
  });
  it("depthDowngradedReason suppresses the TOO_SHORT warning", () => {
    const c = content(["أولاً", "ثانياً", "ثالثاً"], 80);
    const r = evaluateDraftQuality(input({ plan: plan({ depth: "standard", sections: plan().sections.slice(0, 3), depthDowngradedReason: "أدلة غير كافية" }), draft: { contentAr: c, faq: [] } }));
    expect(r.warningCodes).not.toContain("TOO_SHORT");
  });
});

describe("evaluateDraftQuality — plan↔draft soft/review", () => {
  it("FAQ present when plan.includeFaq=false → FAQ_AGAINST_PLAN (EDITOR_REVIEW)", () => {
    const r = evaluateDraftQuality(input({ draft: { contentAr: content(["أولاً", "ثانياً", "ثالثاً", "رابعاً"]), faq: [{ question: "س", answer: "ج" }] } }));
    expect(r.reviewCodes).toContain("FAQ_AGAINST_PLAN");
    expect(r.outcome).toBe("EDITOR_REVIEW");
    expect(r.hardFailCodes).toEqual([]);
  });
  it("FAQ missing when plan.includeFaq=true → FAQ_MISSING_FROM_PLAN (warning)", () => {
    const r = evaluateDraftQuality(input({ plan: plan({ includeFaq: true, faqIntent: ["السعر"] }), draft: { contentAr: content(["أولاً", "ثانياً", "ثالثاً", "رابعاً"]), faq: [] } }));
    expect(r.warningCodes).toContain("FAQ_MISSING_FROM_PLAN");
  });
  it("comparison heading when plan.includeComparison=false → COMPARISON_AGAINST_PLAN (warning)", () => {
    const r = evaluateDraftQuality(input({ draft: { contentAr: content(["أولاً", "مقارنة بين X وY", "ثالثاً", "رابعاً"]), faq: [] } }));
    expect(r.warningCodes).toContain("COMPARISON_AGAINST_PLAN");
  });
  it("MENA markers when plan.includeMena=false → MENA_AGAINST_PLAN (EDITOR_REVIEW)", () => {
    const c = content(["أولاً", "ثانياً", "ثالثاً", "رابعاً"]) + "\n\nوماذا يعني هذا للمستخدم العربي في المنطقة العربية؟";
    const r = evaluateDraftQuality(input({ draft: { contentAr: c, faq: [] } }));
    expect(r.reviewCodes).toContain("MENA_AGAINST_PLAN");
    expect(r.outcome).toBe("EDITOR_REVIEW");
  });
  it("section-count off by >1 → SECTION_COUNT_MISMATCH (warning)", () => {
    const r = evaluateDraftQuality(input({ draft: { contentAr: content(["a", "b", "c", "d", "e", "f"]), faq: [] } }));
    expect(r.warningCodes).toContain("SECTION_COUNT_MISMATCH");
    expect(r.hardFailCodes).not.toContain("PLAN_SECTION_COLLAPSE");
  });
  it("warnings never populate hardFailCodes", () => {
    const c = content(["أولاً", "ثانياً", "ثالثاً"], 80);
    const r = evaluateDraftQuality(input({ plan: plan({ depth: "standard", sections: plan().sections.slice(0, 3) }), draft: { contentAr: c, faq: [] } }));
    expect(r.warningCodes.length).toBeGreaterThan(0);
    expect(r.hardFailCodes).toEqual([]);
  });
});

describe("evaluateDraftQuality — V1 path (no plan) invents no plan failures", () => {
  it("no plan → no plan-based codes, legacy skeleton NOT flagged for V1", () => {
    const legacy = content(["السياق", "التفاصيل", "التحليل", "المقارنة", "التداعيات"]);
    const r = evaluateDraftQuality({ plan: undefined, draft: { contentAr: legacy, faq: [{ question: "س", answer: "ج" }] }, writerPath: "v1", sourceCount: 3 });
    expect(r.hardFailCodes).not.toContain("LEGACY_SKELETON");
    expect(r.hardFailCodes).not.toContain("PLAN_SECTION_COLLAPSE");
    expect(r.reviewCodes).not.toContain("FAQ_AGAINST_PLAN");
    expect(r.reviewCodes).not.toContain("MENA_AGAINST_PLAN");
    expect(r.warningCodes).not.toContain("SECTION_COUNT_MISMATCH");
    expect(r.metrics.plannedSectionCount).toBeNull();
  });
  it("V1 path still catches plan-independent integrity (empty, leakage, first-hand)", () => {
    expect(evaluateDraftQuality({ draft: { contentAr: "" }, writerPath: "v1", sourceCount: 0 }).hardFailCodes).toContain("EMPTY_CONTENT");
    expect(evaluateDraftQuality({ draft: { contentAr: "نص\n\nجرّبنا الأداة بأنفسنا" }, writerPath: "v1", sourceCount: 0 }).hardFailCodes).toContain("FIRST_HAND");
  });
});
