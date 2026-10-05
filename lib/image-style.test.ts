import { describe, it, expect } from "vitest";
import { IMAGE_STYLES, pickImageStyle, buildStyledImagePrompt } from "./image-style";

describe("pickImageStyle", () => {
  it("is deterministic — same seed → same style", () => {
    expect(pickImageStyle("review-abc").name).toBe(pickImageStyle("review-abc").name);
  });

  it("returns a style from the palette", () => {
    expect(IMAGE_STYLES.map((s) => s.name)).toContain(pickImageStyle("x-123").name);
  });

  it("spreads across the palette — not collapsed onto one look", () => {
    const seeds = Array.from({ length: 40 }, (_, i) => `review-${i}-slug`);
    const used = new Set(seeds.map((s) => pickImageStyle(s).name));
    expect(used.size).toBeGreaterThanOrEqual(5); // real variety across the feed
  });

  it("handles empty/whitespace seed without throwing", () => {
    expect(IMAGE_STYLES.map((s) => s.name)).toContain(pickImageStyle("").name);
    expect(IMAGE_STYLES.map((s) => s.name)).toContain(pickImageStyle("   ").name);
  });
});

describe("buildStyledImagePrompt", () => {
  it("keeps the scene prompt and appends style + quality suffix, no hardcoded dark look", () => {
    const out = buildStyledImagePrompt("a robot reading a newspaper", "seed-1");
    expect(out).toContain("a robot reading a newspaper");
    expect(out).toContain("no text, no watermark");
    // the old uniform look must NOT be forced on every image
    expect(out).not.toContain("dark background, cinematic lighting");
  });

  it("different articles get different styled prompts", () => {
    const seeds = ["a", "b", "c", "d", "e", "f", "g", "h"];
    const prompts = new Set(seeds.map((s) => buildStyledImagePrompt("same scene", s)));
    expect(prompts.size).toBeGreaterThanOrEqual(4);
  });
});
