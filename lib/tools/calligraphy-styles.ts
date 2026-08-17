/**
 * lib/tools/calligraphy-styles.ts
 *
 * The five fonts shipped in V1, after visual QA (see Sprint 2 report).
 * Labels are deliberately honest per the discovery sprint's finding: no
 * verified open-license genuine Thuluth or Diwani font exists, so no style
 * here claims to be one. Every font is Google Fonts, SIL Open Font
 * License — see docs/lumiq-tools-discovery-2026-08-17.html §6.
 */

export type CalligraphyStyleId = "amiri" | "scheherazade" | "reemKufi" | "arefRuqaa" | "rakkas";

export interface CalligraphyStyle {
  id: CalligraphyStyleId;
  labelAr: string;
  /** CSS variable name the font is exposed under (set up per-style in the client component). */
  cssVar: string;
  /** Relative line-height tuned per font — display fonts and Kufi need more room than Naskh. */
  lineHeight: number;
}

export const CALLIGRAPHY_STYLES: CalligraphyStyle[] = [
  { id: "amiri", labelAr: "نسخ كلاسيكي", cssVar: "--font-calligraphy-amiri", lineHeight: 1.6 },
  { id: "scheherazade", labelAr: "نسخ تقليدي", cssVar: "--font-calligraphy-scheherazade", lineHeight: 1.7 },
  { id: "reemKufi", labelAr: "كوفي", cssVar: "--font-calligraphy-reem-kufi", lineHeight: 1.5 },
  { id: "arefRuqaa", labelAr: "رقعة", cssVar: "--font-calligraphy-aref-ruqaa", lineHeight: 1.6 },
  { id: "rakkas", labelAr: "عرض فني", cssVar: "--font-calligraphy-rakkas", lineHeight: 1.65 },
];

export const DEFAULT_STYLE_ID: CalligraphyStyleId = "amiri";

export function getStyleById(id: string): CalligraphyStyle {
  return CALLIGRAPHY_STYLES.find((s) => s.id === id) ?? CALLIGRAPHY_STYLES[0];
}

export type TextColorId = "black" | "charcoal" | "white" | "gold" | "green" | "burgundy";

export interface TextColorOption {
  id: TextColorId;
  labelAr: string;
  value: string;
}

export const TEXT_COLORS: TextColorOption[] = [
  { id: "black", labelAr: "أسود", value: "#141414" },
  { id: "charcoal", labelAr: "رمادي داكن", value: "#3A3A3A" },
  { id: "white", labelAr: "أبيض", value: "#FFFFFF" },
  { id: "gold", labelAr: "ذهبي", value: "#B8933F" },
  { id: "green", labelAr: "أخضر داكن", value: "#1F5C4A" },
  { id: "burgundy", labelAr: "عنّابي", value: "#7A1F2B" },
];

export const DEFAULT_TEXT_COLOR_ID: TextColorId = "black";

export type BackgroundId = "transparent" | "white" | "black";

export interface BackgroundOption {
  id: BackgroundId;
  labelAr: string;
  /** null = transparent, rendered as a checkerboard preview swatch in the UI. */
  value: string | null;
}

export const BACKGROUNDS: BackgroundOption[] = [
  { id: "transparent", labelAr: "شفافة", value: null },
  { id: "white", labelAr: "بيضاء", value: "#FFFFFF" },
  { id: "black", labelAr: "سوداء", value: "#141414" },
];

export const DEFAULT_BACKGROUND_ID: BackgroundId = "transparent";

export type AlignmentId = "right" | "center" | "left";

export const DEFAULT_ALIGNMENT: AlignmentId = "center";

export const DEFAULT_TEXT = "الحياة أجمل بك";

export const MIN_FONT_SIZE = 28;
export const MAX_FONT_SIZE = 96;
export const DEFAULT_FONT_SIZE = 56;

export const MAX_INPUT_LENGTH = 200;
