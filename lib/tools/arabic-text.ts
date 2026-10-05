/**
 * lib/tools/arabic-text.ts
 *
 * Pure Arabic text normalization for the "منسّق النص العربي" tool. Every
 * transform is objective and reversible-free (no grammar guessing): strip
 * diacritics, unify look-alike letters (the standard search-normalization set),
 * remove tatweel, collapse whitespace, and convert digit systems. No deps.
 */

export interface NormalizeOptions {
  removeTashkeel: boolean;
  unifyLetters: boolean; // أإآ→ا, ى→ي, ؤ→و, ئ→ي, ة→ه
  removeTatweel: boolean;
  collapseWhitespace: boolean;
  digits: "keep" | "toLatin" | "toArabic";
}

export const DEFAULT_NORMALIZE_OPTIONS: NormalizeOptions = {
  removeTashkeel: true,
  unifyLetters: false,
  removeTatweel: true,
  collapseWhitespace: true,
  digits: "keep",
};

// Arabic diacritics (harakat, tanwin, superscript alef, Quranic marks).
const TASHKEEL = /[ؐ-ًؚ-ٰٟۖ-ۜ۟-۪ۨ-ۭ]/g;
const TATWEEL = /ـ/g;
const ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";

export function removeTashkeel(s: string): string {
  return s.replace(TASHKEEL, "");
}

export function unifyLetters(s: string): string {
  return s
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/ة/g, "ه");
}

export function toLatinDigits(s: string): string {
  return s.replace(/[٠-٩]/g, (d) => String(ARABIC_DIGITS.indexOf(d)));
}

export function toArabicDigits(s: string): string {
  return s.replace(/[0-9]/g, (d) => ARABIC_DIGITS[Number(d)]);
}

/** Collapse runs of spaces/tabs to one space, trim each line, and cap blank
 *  lines at one — without destroying paragraph structure. */
export function collapseWhitespace(s: string): string {
  return s
    .replace(/[ \t ]+/g, " ")
    .split("\n")
    .map((line) => line.trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function normalizeArabic(input: string, opts: NormalizeOptions): string {
  let out = input;
  if (opts.removeTashkeel) out = removeTashkeel(out);
  if (opts.removeTatweel) out = out.replace(TATWEEL, "");
  if (opts.unifyLetters) out = unifyLetters(out);
  if (opts.digits === "toLatin") out = toLatinDigits(out);
  else if (opts.digits === "toArabic") out = toArabicDigits(out);
  if (opts.collapseWhitespace) out = collapseWhitespace(out);
  return out;
}
