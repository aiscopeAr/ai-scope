/**
 * lib/image-style.ts
 *
 * Visual-style palette for article cover images. The old pipeline appended ONE
 * hardcoded look to every prompt ("digital art, dark background, cinematic
 * lighting"), which made the whole feed read as one dark-neon machine. This
 * spreads covers across distinct aesthetics — deterministically, so the SAME
 * article always gets the SAME style (stable) while the feed as a whole varies.
 *
 * Same Replicate model (flux-schnell), same cost — only the style directive in
 * the prompt changes. Pure and side-effect free (easy to tune + test).
 */

/** Distinct visual styles. Deliberately includes LIGHT backgrounds and non-
 *  "digital-art" looks to break the uniform dark aesthetic. Each is a flux-
 *  friendly style directive; the quality/safety suffix is added separately. */
export const IMAGE_STYLES: readonly { name: string; directive: string }[] = [
  { name: "editorial-photo", directive: "editorial photography, photojournalistic, natural daylight, realistic, shallow depth of field" },
  { name: "isometric-3d",    directive: "3D isometric render, soft studio lighting, clean minimal composition" },
  { name: "flat-vector",     directive: "flat vector illustration, bold geometric shapes, limited color palette" },
  { name: "minimal-light",   directive: "minimalist concept art, bright clean background, generous negative space, soft tones" },
  { name: "watercolor",      directive: "expressive watercolor painting, loose brush strokes, textured paper" },
  { name: "bold-graphic",    directive: "bold modern graphic design, high contrast, dynamic composition" },
  { name: "cinematic",       directive: "cinematic concept art, dramatic volumetric lighting, atmospheric" },
  { name: "blueprint",       directive: "technical schematic blueprint style, clean line art, cool blue tones" },
] as const;

/** Universal quality/safety suffix — kept constant; only the aesthetic varies. */
export const IMAGE_QUALITY_SUFFIX = "high quality, no text, no watermark";

/** Stable FNV-1a hash → style index. Same seed always maps to the same style. */
function hashSeed(seed: string): number {
  let h = 0x811c9dc5 >>> 0;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

/** Deterministic style pick — spreads topics across all styles (mirrors the
 *  writer's pickHeadlineStyle / pickOpeningStrategyHint pattern). */
export function pickImageStyle(seed: string): (typeof IMAGE_STYLES)[number] {
  const s = (seed ?? "").trim() || "default";
  return IMAGE_STYLES[hashSeed(s) % IMAGE_STYLES.length];
}

/**
 * Build the final image prompt: the writer's scene description + a rotated
 * style directive + the constant quality/safety suffix.
 */
export function buildStyledImagePrompt(prompt: string, seed: string): string {
  const style = pickImageStyle(seed);
  return `${prompt}, ${style.directive}, ${IMAGE_QUALITY_SUFFIX}`;
}
