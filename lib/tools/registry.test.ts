import { describe, it, expect } from "vitest";
import { TOOLS, getToolBySlug, getLiveTools, getComingSoonTools } from "./registry";

describe("getToolBySlug", () => {
  it("returns the live arabic-calligraphy tool", () => {
    const tool = getToolBySlug("arabic-calligraphy");
    expect(tool?.slug).toBe("arabic-calligraphy");
    expect(tool?.comingSoon).toBeUndefined();
  });

  it("returns undefined for a coming-soon tool — must never be linkable as a live page", () => {
    expect(getToolBySlug("hijri-date-converter")).toBeUndefined();
    expect(getToolBySlug("qr-code-generator")).toBeUndefined();
  });

  it("returns undefined for an unknown slug", () => {
    expect(getToolBySlug("does-not-exist")).toBeUndefined();
  });
});

describe("getLiveTools", () => {
  it("excludes every comingSoon entry", () => {
    const live = getLiveTools();
    expect(live.every((t) => !t.comingSoon)).toBe(true);
  });

  it("includes arabic-calligraphy", () => {
    expect(getLiveTools().map((t) => t.slug)).toContain("arabic-calligraphy");
  });
});

describe("getComingSoonTools", () => {
  it("includes only comingSoon entries", () => {
    const upcoming = getComingSoonTools();
    expect(upcoming.every((t) => t.comingSoon)).toBe(true);
    expect(upcoming.length).toBeGreaterThan(0);
  });
});

describe("TOOLS registry integrity", () => {
  it("has no duplicate slugs", () => {
    const slugs = TOOLS.map((t) => t.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("every live tool has non-empty SEO title and description", () => {
    for (const tool of getLiveTools()) {
      expect(tool.seo.titleAr.length).toBeGreaterThan(0);
      expect(tool.seo.descriptionAr.length).toBeGreaterThan(0);
    }
  });
});
