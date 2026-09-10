import { describe, it, expect } from "vitest";
import type { EditorialPlan } from "./plan-types";
import { buildPlanDirectives, buildPlanDrivenUserPrompt, buildIntegrityRules } from "./plan-to-prompt";

function basePlan(overrides: Partial<EditorialPlan> = {}): EditorialPlan {
  return {
    storyType: "STANDARD_NEWS",
    depth: "standard",
    centralEvent: "إطلاق نموذج جديد",
    primaryAngle: "WHAT_CHANGED",
    editorialThesis: "التغيير الحقيقي ليس في الحجم بل في التكلفة",
    readerValue: "يفهم القارئ متى يهمّه هذا فعلاً",
    openingStrategy: "FACT_FIRST",
    authorLens: "zayd",
    sections: [
      { workingTitle: "ما الذي أُطلق", purpose: "وصف الحدث", questionsToAnswer: ["ما الجديد؟"] },
      { workingTitle: "أين تصمد الأرقام", purpose: "تقييم الأدلة", questionsToAnswer: ["هل الأرقام موثوقة؟"], evidenceNeeded: ["بطاقة النموذج"] },
      { workingTitle: "لمن هذا", purpose: "قيمة عملية", questionsToAnswer: ["من المستفيد؟"] },
    ],
    includeFaq: false,
    includeComparison: false,
    includeMena: false,
    uncertainties: [],
    ...overrides,
  };
}

const LEGACY_STEMS = ["السياق", "التفاصيل", "التحليل", "المقارنة", "التداعيات"];

describe("buildPlanDirectives", () => {
  it("includes the core plan fields", () => {
    const out = buildPlanDirectives(basePlan());
    expect(out).toContain("إطلاق نموذج جديد");
    expect(out).toContain("التغيير الحقيقي ليس في الحجم بل في التكلفة");
    expect(out).toContain("يفهم القارئ متى يهمّه هذا فعلاً");
    expect(out).toContain("STANDARD_NEWS");
    expect(out).toContain("zayd");
    expect(out).toContain("WHAT_CHANGED");
    expect(out).toContain("FACT_FIRST");
  });

  it("preserves the exact planned section order as H2 working titles", () => {
    const out = buildPlanDirectives(basePlan());
    const i1 = out.indexOf("## ما الذي أُطلق");
    const i2 = out.indexOf("## أين تصمد الأرقام");
    const i3 = out.indexOf("## لمن هذا");
    expect(i1).toBeGreaterThanOrEqual(0);
    expect(i2).toBeGreaterThan(i1);
    expect(i3).toBeGreaterThan(i2);
  });

  it("does NOT inject the legacy 5-heading skeleton as H2 section headings", () => {
    const out = buildPlanDirectives(basePlan());
    // The conditional directives may mention a word like «المقارنة» as a label
    // ("المقارنة: غير مطلوبة"); what must never happen is a legacy stem appearing
    // as an actual "## " section heading the writer is told to produce.
    LEGACY_STEMS.forEach((stem) => {
      expect(out).not.toContain(`## ${stem}`);
    });
    // And the only "## " headings present are exactly the plan's section titles.
    const h2s = out.split("\n").filter((l) => l.includes("## ")).map((l) => l.replace(/^.*##\s+/, "").trim());
    expect(h2s).toEqual(["ما الذي أُطلق", "أين تصمد الأرقام", "لمن هذا"]);
  });

  it("emits evidenceNeeded only for sections that declare it", () => {
    const out = buildPlanDirectives(basePlan());
    expect(out).toContain("بطاقة النموذج");
  });

  it("expresses depth as guidance, never a word quota", () => {
    const out = buildPlanDirectives(basePlan());
    expect(out).toContain("استرشادي");
    expect(out).not.toContain("لا تقل عن");
    expect(out).not.toMatch(/حد أدنى/);
  });

  it("includeFaq=false → no FAQ directive, asks for empty faq", () => {
    const out = buildPlanDirectives(basePlan({ includeFaq: false }));
    expect(out).not.toContain("غطِّ نيّات");
    expect(out).toContain("غير مطلوبة");
    expect(out).toContain("faq");
  });

  it("includeFaq=true → FAQ directive with the plan's faqIntent", () => {
    const out = buildPlanDirectives(basePlan({ includeFaq: true, faqIntent: ["السعر", "التوفر"] }));
    expect(out).toContain("غطِّ نيّات");
    expect(out).toContain("السعر");
    expect(out).toContain("التوفر");
  });

  it("includeComparison=false → no comparison target, explicit no-comparison directive", () => {
    const out = buildPlanDirectives(basePlan({ includeComparison: false }));
    expect(out).toContain("المقارنة: غير مطلوبة");
  });

  it("includeComparison=true → names only the plan's comparisonTarget", () => {
    const out = buildPlanDirectives(basePlan({ includeComparison: true, comparisonTarget: "GPT-4o" }));
    expect(out).toContain("GPT-4o");
    expect(out).not.toContain("المقارنة: غير مطلوبة");
  });

  it("includeMena=false → explicit no-MENA directive, no generic Arab paragraph", () => {
    const out = buildPlanDirectives(basePlan({ includeMena: false }));
    expect(out).toContain("لا تُضِف فقرة");
    expect(out).toContain("غير مطلوبة");
  });

  it("includeMena=true → includes only the plan's menaReason", () => {
    const out = buildPlanDirectives(basePlan({ includeMena: true, menaReason: "دعم اللغة العربية أصلاً" }));
    expect(out).toContain("دعم اللغة العربية أصلاً");
  });

  it("uncertainties appear only when present", () => {
    const without = buildPlanDirectives(basePlan({ uncertainties: [] }));
    expect(without).not.toContain("مواطن عدم اليقين");
    const withU = buildPlanDirectives(
      basePlan({ uncertainties: [{ kind: "pricing", note: "السعر غير معلن", material: true }] }),
    );
    expect(withU).toContain("مواطن عدم اليقين");
    expect(withU).toContain("السعر غير معلن");
  });

  it("depthDowngradedReason surfaces only when present", () => {
    expect(buildPlanDirectives(basePlan())).not.toContain("سبب خفض العمق");
    expect(buildPlanDirectives(basePlan({ depthDowngradedReason: "أدلة غير كافية" }))).toContain("سبب خفض العمق");
  });

  it("evidenceRequirements surface only when present", () => {
    expect(buildPlanDirectives(basePlan())).not.toContain("متطلبات الأدلة");
    expect(buildPlanDirectives(basePlan({ evidenceRequirements: ["مصدر أولي واحد على الأقل"] }))).toContain(
      "مصدر أولي واحد على الأقل",
    );
  });
});

describe("buildIntegrityRules", () => {
  it("bans invented facts/numbers/quotes and first-hand experience", () => {
    const r = buildIntegrityRules();
    expect(r).toContain("لا تختلق");
    expect(r).toContain("لا تخترع أرقاماً");
    expect(r).toContain("لا تخترع اقتباسات");
    expect(r).toContain("لا تدّعِ ولا تلمّح إلى أن لوميك جرّبت");
  });
});

describe("buildPlanDrivenUserPrompt", () => {
  const sources = [{ title: "t", content: "c".repeat(5000), url: "https://a/1", name: "TC" }];

  it("contains sources, directives, integrity rules and the JSON schema", () => {
    const out = buildPlanDrivenUserPrompt(sources, "", basePlan());
    expect(out).toContain("مصدر 1: TC");
    expect(out).toContain("## ما الذي أُطلق");
    expect(out).toContain("لا تدّعِ ولا تلمّح إلى أن لوميك جرّبت");
    expect(out).toContain('"titleAr"');
    expect(out).toContain('"contentAr"');
    expect(out).toContain('"faq"');
  });

  it("truncates overly long source bodies", () => {
    const out = buildPlanDrivenUserPrompt(sources, "", basePlan());
    expect(out).toContain("…"); // body was > 2000 chars
  });

  it("carries no word-count quota language", () => {
    const out = buildPlanDrivenUserPrompt(sources, "", basePlan());
    expect(out).not.toContain("لا تقل عن");
    expect(out).toContain("استرشادي");
  });
});
