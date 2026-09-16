import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  PROMPT_INDEXATION_001_TREATMENT,
  PROMPT_INDEXATION_001_CONTROL,
  isPromptIndexationExperimentActive,
  isPromptIndexationTreatment,
  shouldIndexPrompt,
  shouldIncludePromptInSitemap,
  promptExperimentRobots,
} from "./indexation-experiment";

// Fixtures reproduced from the reviewed cohort artifact (docs/seo/prompt-indexation-001-*.json).
// The 14 retained cluster representatives — none may ever be in treatment.
const RETAINED_REPRESENTATIVES = [
  "automate-email-notifications-with-make-1",
  "automate-email-responses-with-zapier-1",
  "create-a-conversational-ai-voice-2",
  "create-a-fantasy-landscape",
  "create-a-weekly-planner-1",
  "create-engaging-presentations-quickly",
  "create-engaging-social-media-posts",
  "creative-writing-prompt-generator-1",
  "effective-clinical-note-taking-strategies-1",
  "effective-marketing-strategy-ideas-1",
  "effective-marketing-strategy-planning",
  "effective-study-strategies-for-students-1",
  "effective-time-management-tips-1",
  "futuristic-cityscape-at-sunset-1",
];
// Protected GSC-signal prompts from A0 — never treatment.
const PROTECTED_GSC = [
  "create-a-fantasy-landscape",
  "midjourney-prompt-master",
  "social-media-content-calendar",
];
const ARBITRARY = ["gemini", "notion-ai", "some-brand-new-prompt", "prompts", "reviews/foo"];

const ORIGINAL = process.env.PROMPT_INDEXATION_001;
const setFlag = (v: string | undefined) => {
  if (v === undefined) delete process.env.PROMPT_INDEXATION_001;
  else process.env.PROMPT_INDEXATION_001 = v;
};
beforeEach(() => setFlag(undefined));
afterEach(() => setFlag(ORIGINAL));

describe("PROMPT_INDEXATION_001 frozen cohort", () => {
  it("has exactly 9 treatment and 6 control slugs, disjoint and de-duplicated", () => {
    expect(PROMPT_INDEXATION_001_TREATMENT).toHaveLength(9);
    expect(PROMPT_INDEXATION_001_CONTROL).toHaveLength(6);
    expect(new Set(PROMPT_INDEXATION_001_TREATMENT).size).toBe(9);
    expect(new Set(PROMPT_INDEXATION_001_CONTROL).size).toBe(6);
    const overlap = PROMPT_INDEXATION_001_TREATMENT.filter((s) =>
      PROMPT_INDEXATION_001_CONTROL.includes(s),
    );
    expect(overlap).toEqual([]);
  });

  it("treatment membership is deterministic and flag-independent", () => {
    for (const slug of PROMPT_INDEXATION_001_TREATMENT) {
      expect(isPromptIndexationTreatment(slug)).toBe(true);
    }
    setFlag("on");
    for (const slug of PROMPT_INDEXATION_001_TREATMENT) {
      expect(isPromptIndexationTreatment(slug)).toBe(true);
    }
  });

  it("never places a retained representative in treatment (no cluster loses its representative)", () => {
    for (const rep of RETAINED_REPRESENTATIVES) {
      expect(isPromptIndexationTreatment(rep)).toBe(false);
    }
  });

  it("never places a protected GSC-signal prompt in treatment", () => {
    for (const slug of PROTECTED_GSC) {
      expect(isPromptIndexationTreatment(slug)).toBe(false);
    }
  });

  it("does not treat control or arbitrary/new slugs", () => {
    for (const slug of [...PROMPT_INDEXATION_001_CONTROL, ...ARBITRARY]) {
      expect(isPromptIndexationTreatment(slug)).toBe(false);
    }
  });
});

describe("experiment flag", () => {
  it("defaults OFF when env is unset", () => {
    expect(isPromptIndexationExperimentActive()).toBe(false);
  });
  it("is OFF for any value other than the exact string 'on'", () => {
    for (const v of ["", "off", "true", "1", "ON", "On"]) {
      setFlag(v);
      expect(isPromptIndexationExperimentActive()).toBe(false);
    }
  });
  it("is ON only for the exact string 'on'", () => {
    setFlag("on");
    expect(isPromptIndexationExperimentActive()).toBe(true);
  });
});

describe("metadata behavior (promptExperimentRobots)", () => {
  it("OFF: every prompt (incl. treatment) stays indexable → no robots override", () => {
    for (const slug of [...PROMPT_INDEXATION_001_TREATMENT, ...PROMPT_INDEXATION_001_CONTROL, ...ARBITRARY]) {
      expect(promptExperimentRobots(slug)).toBeUndefined();
    }
  });
  it("ON: treatment → noindex, follow", () => {
    setFlag("on");
    for (const slug of PROMPT_INDEXATION_001_TREATMENT) {
      expect(promptExperimentRobots(slug)).toEqual({ index: false, follow: true });
    }
  });
  it("ON: control, representatives, protected, arbitrary → unchanged (no robots override)", () => {
    setFlag("on");
    for (const slug of [
      ...PROMPT_INDEXATION_001_CONTROL,
      ...RETAINED_REPRESENTATIVES,
      ...PROTECTED_GSC,
      ...ARBITRARY,
    ]) {
      expect(promptExperimentRobots(slug)).toBeUndefined();
    }
  });
});

describe("sitemap behavior (shouldIncludePromptInSitemap)", () => {
  it("OFF: treatment URLs are still included", () => {
    for (const slug of PROMPT_INDEXATION_001_TREATMENT) {
      expect(shouldIncludePromptInSitemap(slug)).toBe(true);
    }
  });
  it("ON: treatment URLs are excluded", () => {
    setFlag("on");
    for (const slug of PROMPT_INDEXATION_001_TREATMENT) {
      expect(shouldIncludePromptInSitemap(slug)).toBe(false);
    }
  });
  it("ON: control, representatives, protected, arbitrary URLs are retained", () => {
    setFlag("on");
    for (const slug of [
      ...PROMPT_INDEXATION_001_CONTROL,
      ...RETAINED_REPRESENTATIVES,
      ...PROTECTED_GSC,
      ...ARBITRARY,
    ]) {
      expect(shouldIncludePromptInSitemap(slug)).toBe(true);
    }
  });
});

describe("shared decision invariant (metadata ⟺ sitemap)", () => {
  const sample = [
    ...PROMPT_INDEXATION_001_TREATMENT,
    ...PROMPT_INDEXATION_001_CONTROL,
    ...RETAINED_REPRESENTATIVES,
    ...PROTECTED_GSC,
    ...ARBITRARY,
  ];
  it("sitemap inclusion equals indexability for every slug, both OFF and ON", () => {
    for (const flag of [undefined, "on"] as const) {
      setFlag(flag);
      for (const slug of sample) {
        // indexable (no robots override) ⟺ present in sitemap
        const indexable = promptExperimentRobots(slug) === undefined;
        expect(shouldIndexPrompt(slug)).toBe(indexable);
        expect(shouldIncludePromptInSitemap(slug)).toBe(indexable);
      }
    }
  });
});
