import { describe, it, expect } from "vitest";
import { TOOLS, getToolBySlug, getLiveTools, getComingSoonTools } from "./registry";

describe("getToolBySlug", () => {
  it("returns the live arabic-calligraphy tool", () => {
    const tool = getToolBySlug("arabic-calligraphy");
    expect(tool?.slug).toBe("arabic-calligraphy");
    expect(tool?.comingSoon).toBeUndefined();
  });

  it("returns the now-live hijri + qr tools", () => {
    expect(getToolBySlug("hijri-date-converter")?.slug).toBe("hijri-date-converter");
    expect(getToolBySlug("qr-code-generator")?.slug).toBe("qr-code-generator");
  });

  it("never returns a comingSoon entry as a live page", () => {
    // Invariant, data-independent: if a comingSoon tool is ever added back,
    // getToolBySlug must not resolve it to a linkable live page.
    for (const t of TOOLS.filter((x) => x.comingSoon)) {
      expect(getToolBySlug(t.slug)).toBeUndefined();
    }
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
  it("returns only comingSoon entries (currently none — all tools shipped)", () => {
    const upcoming = getComingSoonTools();
    expect(upcoming.every((t) => t.comingSoon)).toBe(true);
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
