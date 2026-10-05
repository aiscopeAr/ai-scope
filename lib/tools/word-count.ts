/**
 * lib/tools/word-count.ts
 *
 * Pure text statistics for the Arabic word/character counter. No deps, no
 * DOM — runs identically in the browser and in vitest. Unicode-aware counts
 * (Array.from) so Arabic letters and emoji count as single characters.
 */

export interface TextStats {
  words: number;
  charsWithSpaces: number;
  charsNoSpaces: number;
  sentences: number;
  lines: number;
  readingMinutes: number;
}

// Average Arabic reading speed ~200 words/min — enough for a rough estimate.
const WORDS_PER_MINUTE = 200;

export function analyzeText(text: string): TextStats {
  const trimmed = text.trim();

  const words = trimmed ? trimmed.split(/\s+/).filter(Boolean).length : 0;
  const charsWithSpaces = Array.from(text).length;
  const charsNoSpaces = Array.from(text.replace(/\s/g, "")).length;

  // Split on Latin + Arabic sentence terminators; count non-empty fragments.
  const sentences = trimmed
    ? trimmed.split(/[.!?؟…]+/).filter((s) => s.trim().length > 0).length
    : 0;

  const lines = text === "" ? 0 : text.split("\n").filter((l) => l.trim().length > 0).length;

  const readingMinutes = words === 0 ? 0 : Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));

  return { words, charsWithSpaces, charsNoSpaces, sentences, lines, readingMinutes };
}
