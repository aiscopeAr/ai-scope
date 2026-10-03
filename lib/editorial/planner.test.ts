import { describe, it, expect } from "vitest";
import {
  planEditorial,
  deterministicStoryTypeHint,
  pickOpeningStrategyHint,
  buildPlannerUserPrompt,
  conservativeFallbackPlan,
  buildShadowDiagnostics,
  extractH2Headings,
  type PlannerSource,
  type CreateCompletion,
} from "./planner";
import { validateEditorialPlan, OPENING_STRATEGIES, type EditorialPlan } from "./plan-types";

const sources: PlannerSource[] = [
  { title: "OpenAI launches GPT-6", content: "OpenAI announced its new model today with a lower price.", url: "https://a.com/1", name: "TechCrunch" },
  { title: "GPT-6 pricing revealed", content: "The new model is cheaper than GPT-4o.", url: "https://b.com/2", name: "The Verge" },
];

function goodPlanJson(overrides: Partial<EditorialPlan> = {}): string {
  const plan: EditorialPlan = {
    storyType: "PRODUCT_LAUNCH",
    depth: "standard",
    centralEvent: "OpenAI أطلقت GPT-6",
    primaryAngle: "WHAT_CHANGED",
    editorialThesis: "الإطلاق يخفض التكلفة ويغيّر المنافسة",
    readerValue: "يعرف القارئ ما الجديد والسعر",
    openingStrategy: "NUMBER_FIRST",
    authorLens: "lina",
    sections: [
      { purpose: "الجديد", workingTitle: "ما الذي أطلقته OpenAI", questionsToAnswer: ["ما هو؟"] },
      { purpose: "السعر", workingTitle: "السعر والتوفر", questionsToAnswer: ["كم؟"] },
    ],
    includeFaq: false,
    includeComparison: false,
    includeMena: false,
    uncertainties: [],
    ...overrides,
  };
  return JSON.stringify(plan);
}

describe("pickOpeningStrategyHint (opening variety)", () => {
  it("is deterministic and returns a valid strategy", () => {
    const a = pickOpeningStrategyHint("GPT-6 launch");
    expect(a).toBe(pickOpeningStrategyHint("GPT-6 launch"));
    expect(OPENING_STRATEGIES).toContain(a);
  });
  it("spreads across strategies — not collapsed onto FACT_FIRST", () => {
    const topics = ["GPT-6 launch","EU AI Act vote","Anthropic funding round","new safety benchmark","Shopify AI rollout","arXiv reasoning paper","Meta model leak","pricing war in LLMs","robotics demo","chip supply shift"];
    const picks = new Set(topics.map(pickOpeningStrategyHint));
    expect(picks.size).toBeGreaterThanOrEqual(4); // real variety, not one default
  });
  it("is surfaced in the planner user prompt as a non-binding suggestion", () => {
    const out = buildPlannerUserPrompt("GPT-6 launch", sources, "zayd", "PRODUCT_LAUNCH", "CONSEQUENCE_FIRST");
    expect(out).toContain("CONSEQUENCE_FIRST");
    expect(out).toContain("FACT_FIRST"); // the "don't default to FACT_FIRST" guidance
  });
});

describe("deterministicStoryTypeHint (C: hybrid hint)", () => {
  it("classifies by keyword family", () => {
    expect(deterministicStoryTypeHint("New study from MIT lab", [])).toBe("RESEARCH_PAPER");
    expect(deterministicStoryTypeHint("EU AI Act regulation passes", [])).toBe("POLICY_REGULATION");
    expect(deterministicStoryTypeHint("Google launches Gemini 3", [])).toBe("PRODUCT_LAUNCH");
    expect(deterministicStoryTypeHint("Anthropic raises funding round", [])).toBe("COMPANY_BUSINESS");
    expect(deterministicStoryTypeHint("How to use Midjourney", [])).toBe("EXPLAINER");
    expect(deterministicStoryTypeHint("AI models discussion", [])).toBe("STANDARD_NEWS");
  });
});

describe("planEditorial", () => {
  it("success: valid plan first try; authorLens forced to pipeline value", async () => {
    const cc: CreateCompletion = async () => goodPlanJson({ authorLens: "zayd" });
    const out = await planEditorial("GPT-6", sources, "lina", { createCompletion: cc });
    expect(out.status).toBe("success");
    expect(out.fallbackUsed).toBe(false);
    expect(out.plan.authorLens).toBe("lina"); // pipeline wins over model
  });

  it("D: invalid JSON → one retry → success", async () => {
    let call = 0;
    const cc: CreateCompletion = async () => (++call === 1 ? "not json {" : goodPlanJson());
    const out = await planEditorial("GPT-6", sources, "lina", { createCompletion: cc });
    expect(call).toBe(2);
    expect(out.status).toBe("retry_success");
  });

  it("D/K: invalid twice → conservative fallback (never deep)", async () => {
    const cc: CreateCompletion = async () => JSON.stringify({ storyType: "BAD" });
    const out = await planEditorial("GPT-6", sources, "tariq", { createCompletion: cc });
    expect(out.status).toBe("fallback");
    expect(out.fallbackUsed).toBe(true);
    expect(out.plan.depth).not.toBe("deep");
    expect(validateEditorialPlan(out.plan).ok).toBe(true); // fallback is itself valid
  });

  it("O-support: call throws → failed_nonblocking, still returns a valid fallback plan", async () => {
    const cc: CreateCompletion = async () => { throw new Error("network down"); };
    const out = await planEditorial("GPT-6", sources, "zayd", { createCompletion: cc });
    expect(out.status).toBe("failed_nonblocking");
    expect(out.fallbackUsed).toBe(true);
    expect(validateEditorialPlan(out.plan).ok).toBe(true);
  });

  it("L: a model plan implying first-hand testing is rejected → fallback (which never implies testing)", async () => {
    const cc: CreateCompletion = async () => goodPlanJson({ readerValue: "بعد أن اختبرنا الأداة بأنفسنا" });
    const out = await planEditorial("GPT-6", sources, "zayd", { createCompletion: cc });
    expect(out.status).toBe("fallback");
    expect(validateEditorialPlan(out.plan).ok).toBe(true);
  });
});

describe("conservativeFallbackPlan (K/8)", () => {
  it("uses breaking depth with <4 sources, standard with >=4, never deep; passes validation", () => {
    const few = conservativeFallbackPlan("t", sources, "STANDARD_NEWS", "zayd");
    expect(few.depth).toBe("breaking");
    const many = conservativeFallbackPlan("t", [...sources, ...sources], "STANDARD_NEWS", "zayd");
    expect(many.depth).toBe("standard");
    expect(few.depth).not.toBe("deep");
    expect(validateEditorialPlan(few).ok).toBe(true);
  });
});

describe("shadow diagnostics (R)", () => {
  it("extracts V1 H2 headings and flags legacy skeleton + structural difference", () => {
    const v1 = `مقدمة\n## السياق — لماذا مهم\nنص\n## التفاصيل\nنص\n## التحليل\nنص\n## المقارنة\nنص\n## التداعيات\nنص`;
    expect(extractH2Headings(v1)).toHaveLength(5);
    const outcome = {
      status: "success" as const,
      plan: {
        ...JSON.parse(goodPlanJson()) as EditorialPlan,
      },
      hint: "PRODUCT_LAUNCH" as const,
      fallbackUsed: false,
      latencyMs: 12,
    };
    const diag = buildShadowDiagnostics("q1", "GPT-6", outcome, v1);
    expect(diag.v1MatchesLegacySkeleton).toBe(true);
    expect(diag.v2SectionCount).toBe(2);
    expect(diag.headingOverlapCount).toBe(0);
    expect(diag.structurallyDifferent).toBe(true);
    expect(diag.plannerStatus).toBe("success");
  });
});
