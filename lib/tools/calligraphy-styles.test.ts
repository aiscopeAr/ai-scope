import { describe, it, expect } from "vitest";
import {
  CALLIGRAPHY_STYLES,
  getStyleById,
  DEFAULT_STYLE_ID,
  TEXT_COLORS,
  BACKGROUNDS,
  MAX_INPUT_LENGTH,
  MIN_FONT_SIZE,
  MAX_FONT_SIZE,
} from "./calligraphy-styles";

describe("getStyleById", () => {
  it("returns the matching style", () => {
    expect(getStyleById("reemKufi").labelAr).toBe("كوفي");
  });

  it("falls back to the first style for an unknown id, never throws", () => {
    expect(getStyleById("unknown-style")).toEqual(CALLIGRAPHY_STYLES[0]);
  });
});

describe("style labels are honest per the discovery sprint's finding", () => {
  it("never claims Thuluth (خط الثلث) or Diwani (خط الديواني) — no verified open-license font for either exists", () => {
    const labels = CALLIGRAPHY_STYLES.map((s) => s.labelAr);
    expect(labels.some((l) => l.includes("الثلث"))).toBe(false);
    expect(labels.some((l) => l.includes("الديواني"))).toBe(false);
    expect(labels.some((l) => l.includes("الإجازة"))).toBe(false);
  });

  it("default style resolves to a real registered style", () => {
    expect(CALLIGRAPHY_STYLES.map((s) => s.id)).toContain(DEFAULT_STYLE_ID);
  });

  it("ships exactly five styles per the Sprint 2 scope", () => {
    expect(CALLIGRAPHY_STYLES).toHaveLength(5);
  });
});

describe("registry integrity", () => {
  it("every style has a unique CSS variable name", () => {
    const vars = CALLIGRAPHY_STYLES.map((s) => s.cssVar);
    expect(new Set(vars).size).toBe(vars.length);
  });

  it("every color has a valid hex value", () => {
    for (const c of TEXT_COLORS) {
      expect(c.value).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });

  it("transparent background has a null value; others have a hex value", () => {
    const transparent = BACKGROUNDS.find((b) => b.id === "transparent");
    expect(transparent?.value).toBeNull();
    const others = BACKGROUNDS.filter((b) => b.id !== "transparent");
    expect(others.every((b) => typeof b.value === "string")).toBe(true);
  });

  it("font size bounds are sane", () => {
    expect(MIN_FONT_SIZE).toBeLessThan(MAX_FONT_SIZE);
    expect(MIN_FONT_SIZE).toBeGreaterThan(0);
  });

  it("max input length is a positive, reasonable cap", () => {
    expect(MAX_INPUT_LENGTH).toBeGreaterThan(0);
    expect(MAX_INPUT_LENGTH).toBeLessThanOrEqual(500);
  });
});
