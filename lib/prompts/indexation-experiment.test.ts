import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  PROMPT_GSC_ALLOWLIST,
  isPromptIndexationExperimentActive,
  isPromptIndexable,
  shouldIndexPrompt,
  shouldIncludePromptInSitemap,
  promptExperimentRobots,
} from "./indexation-experiment";

const ORIGINAL = process.env.PROMPT_INDEXATION_001;
const setFlag = (v: string | undefined) => {
  if (v === undefined) delete process.env.PROMPT_INDEXATION_001;
  else process.env.PROMPT_INDEXATION_001 = v;
};
beforeEach(() => setFlag(undefined));
afterEach(() => setFlag(ORIGINAL));

const ALLOWED = "create-a-fantasy-landscape"; // in PROMPT_GSC_ALLOWLIST

describe("isPromptIndexable (pure rule, flag-independent)", () => {
  it("featured prompt is indexable", () => {
    expect(isPromptIndexable("some-thin-prompt", true)).toBe(true);
  });
  it("GSC-allowlisted prompt is indexable even if not featured", () => {
    expect(PROMPT_GSC_ALLOWLIST.has(ALLOWED)).toBe(true);
    expect(isPromptIndexable(ALLOWED, false)).toBe(true);
  });
  it("non-featured, non-allowlisted prompt is NOT indexable", () => {
    expect(isPromptIndexable("thin-general-prompt", false)).toBe(false);
  });
});

describe("flag", () => {
  it("defaults OFF; only the exact string 'on' enables it", () => {
    expect(isPromptIndexationExperimentActive()).toBe(false);
    for (const v of ["", "off", "true", "On", "1"]) { setFlag(v); expect(isPromptIndexationExperimentActive()).toBe(false); }
    setFlag("on"); expect(isPromptIndexationExperimentActive()).toBe(true);
  });
});

describe("OFF: nothing changes — every prompt indexable + in sitemap", () => {
  it("non-featured thin prompt stays indexable when flag is off", () => {
    expect(shouldIndexPrompt("thin", false)).toBe(true);
    expect(shouldIncludePromptInSitemap("thin", false)).toBe(true);
    expect(promptExperimentRobots("thin", false)).toBeUndefined();
  });
});

describe("ON: Option A policy (featured OR GSC → index; else noindex)", () => {
  beforeEach(() => setFlag("on"));

  it("featured → indexable, in sitemap, no robots override", () => {
    expect(shouldIndexPrompt("x", true)).toBe(true);
    expect(shouldIncludePromptInSitemap("x", true)).toBe(true);
    expect(promptExperimentRobots("x", true)).toBeUndefined();
  });

  it("GSC-allowlisted → indexable", () => {
    expect(shouldIndexPrompt(ALLOWED, false)).toBe(true);
    expect(promptExperimentRobots(ALLOWED, false)).toBeUndefined();
  });

  it("thin non-featured → noindex,follow + absent from sitemap", () => {
    expect(shouldIndexPrompt("thin-general", false)).toBe(false);
    expect(shouldIncludePromptInSitemap("thin-general", false)).toBe(false);
    expect(promptExperimentRobots("thin-general", false)).toEqual({ index: false, follow: true });
  });
});

describe("invariant: sitemap inclusion ⟺ indexability (both flag states)", () => {
  const sample: [string, boolean][] = [
    ["thin-a", false], ["thin-b", false], ["feat-a", true], [ALLOWED, false], ["feat-b", true],
  ];
  it("holds for every prompt", () => {
    for (const flag of [undefined, "on"] as const) {
      setFlag(flag);
      for (const [slug, featured] of sample) {
        const indexable = promptExperimentRobots(slug, featured) === undefined;
        expect(shouldIndexPrompt(slug, featured)).toBe(indexable);
        expect(shouldIncludePromptInSitemap(slug, featured)).toBe(indexable);
      }
    }
  });
});
