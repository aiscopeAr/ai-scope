/**
 * lib/editorial/grounding.ts
 *
 * A deterministic "grounding tripwire" for generated Arabic reviews. A more
 * creative writer (e.g. Gemini) reads as more human but is likelier to invent
 * vivid specifics — numbers, dates, named products/companies — that are NOT in
 * the sources. This check extracts the hard, checkable facts from a draft and
 * verifies each appears in the source material. It is a heuristic safety net,
 * NOT a proof of truth: its job is to catch egregious fabrication so the caller
 * can reject the draft (e.g. fall back to the grounded GPT writer).
 *
 * Pure and side-effect free. Normalizes Arabic-Indic digits to Western so
 * "٨٤" and "84" compare equal.
 */

export interface GroundingSource {
  title: string;
  content: string;
  name: string;
}

export interface GroundingResult {
  ok: boolean;
  /** total hard facts checked (numbers + latin-script names) */
  checked: number;
  grounded: number;
  /** facts not found in the sources — numbers are prefixed with "#" */
  ungroundedNumbers: string[];
  ungroundedNames: string[];
}

export interface GroundingOptions {
  /** max ungrounded numbers tolerated before failing (default 0 — strict) */
  maxUngroundedNumbers?: number;
  /** max ungrounded latin-script names tolerated before failing (default 0 — strict) */
  maxUngroundedNames?: number;
}

/** Arabic-Indic (٠-٩) and Eastern Arabic-Indic (۰-۹) digits → Western 0-9. */
export function normalizeDigits(s: string): string {
  return (s || "")
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0));
}

const stripSep = (s: string) => s.replace(/[.,،\s]/g, "");

// Significant numbers only: runs of >= 2 digits, EXCLUDING 4-digit calendar
// years (19xx/20xx), which are commonly contextual/derived and would be noisy
// false positives. Single digits are ignored (too trivial to verify).
function extractNumbers(text: string): string[] {
  const norm = normalizeDigits(text);
  const raw = norm.match(/\d[\d.,،]*\d|\d{2,}/g) ?? [];
  const cleaned = raw
    .map((n) => stripSep(n))
    .filter((n) => n.length >= 2 && !/^(19|20)\d\d$/.test(n));
  return [...new Set(cleaned)];
}

// Latin-script tokens are almost always product/company/model names that must
// come from the sources (e.g. OpenAI, Anthropic, GPT-4o, Hugging). A latin name
// absent from every source is a strong "invented entity" signal. Trailing/
// leading punctuation is trimmed so "Zyntharex." matches "zyntharex".
function extractLatinNames(text: string): string[] {
  const raw = text.match(/[A-Za-z][A-Za-z0-9.\-]{2,}/g) ?? [];
  const cleaned = raw
    .map((t) => t.toLowerCase().replace(/^[^a-z0-9]+|[^a-z0-9]+$/g, ""))
    .filter((t) => t.length >= 3);
  return [...new Set(cleaned)];
}

/**
 * Check how well a draft's hard facts are supported by its sources. Returns the
 * ungrounded numbers/names and an `ok` verdict governed by the tolerances.
 */
export function checkGrounding(
  content: string,
  sources: GroundingSource[],
  opts: GroundingOptions = {},
): GroundingResult {
  const maxNums = opts.maxUngroundedNumbers ?? 0;
  const maxNames = opts.maxUngroundedNames ?? 0;

  const hayRaw = sources.map((s) => `${s.title}\n${s.content}\n${s.name}`).join("\n");
  const hayNumHay = stripSep(normalizeDigits(hayRaw));
  const hayNameHay = hayRaw.toLowerCase();

  const ungroundedNumbers = extractNumbers(content).filter((n) => !hayNumHay.includes(n));
  const ungroundedNames = extractLatinNames(content).filter((name) => !hayNameHay.includes(name));

  const numbers = extractNumbers(content).length;
  const names = extractLatinNames(content).length;
  const checked = numbers + names;
  const grounded = checked - ungroundedNumbers.length - ungroundedNames.length;

  const ok =
    ungroundedNumbers.length <= maxNums && ungroundedNames.length <= maxNames;

  return { ok, checked, grounded, ungroundedNumbers, ungroundedNames };
}
