/**
 * lib/tools/export-image.ts
 *
 * Client-only DOM-to-PNG export via html-to-image. Kept separate from the
 * React component so the "await fonts ready, then rasterize at N×
 * pixel-ratio" sequence is one reviewable unit, and so it can be
 * dynamically imported (next/dynamic) to keep html-to-image out of the
 * initial page bundle — it's only needed once the user actually exports.
 *
 * html-to-image was chosen over html2canvas: ~10x smaller (315KB vs
 * 3.4MB unpacked), defaults to a transparent background, and works by
 * serializing the DOM node to SVG rather than manually replaying canvas
 * draw calls — the SVG path is what makes it render Arabic shaping
 * faithfully, since it reuses the browser's own text layout instead of
 * re-implementing it. See docs/lumiq-tools-discovery-2026-08-17.html §7.
 */

import { toPng } from "html-to-image";

/** Rasterize at a higher pixel ratio than the on-screen preview so the
 *  export is print/social-usable, not a screenshot-resolution image. */
const EXPORT_PIXEL_RATIO = 3;

export async function exportNodeToPng(node: HTMLElement): Promise<string> {
  // Arabic web fonts must be fully loaded before rasterizing, or html-to-image
  // can capture a fallback-font frame — this is the exact pitfall the
  // discovery sprint flagged.
  await document.fonts.ready;

  return toPng(node, {
    pixelRatio: EXPORT_PIXEL_RATIO,
    cacheBust: true,
  });
}

export function downloadDataUrl(dataUrl: string, filename: string) {
  const link = document.createElement("a");
  link.download = filename;
  link.href = dataUrl;
  link.click();
}
