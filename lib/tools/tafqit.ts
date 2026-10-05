/**
 * lib/tools/tafqit.ts
 *
 * تفقيط — convert a number into written Arabic (for invoices/cheques). Pure,
 * no deps. Implements the grammar approved in
 * docs/lumiq-tafqit-spec-2026-10-05.md:
 *  - lightly-marked but grammatically correct: standalone nominative forms,
 *    correct gender, singular/dual/plural, and the necessary accusative endings
 *    (e.g. ألفًا after 11–99, ريالًا سعوديًا for 11–99 of a currency);
 *  - مائة spelling throughout; dual drops its ن in a construct (مائتا ألف،
 *    ألفا ريال);
 *  - currencies none/SAR/AED/EGP/USD/EUR/ILS, each with its own gender and
 *    inflected unit + fraction forms;
 *  - money uses a decimal STRING with integer minor-unit arithmetic (never
 *    float multiplication); extra decimals round to the nearest minor unit,
 *    halves up, range validated AFTER rounding;
 *  - no-currency decimals are read digit-by-digit after "فاصلة", preserving
 *    zeros (12.05 → اثنا عشر فاصلة صفر خمسة).
 *
 * Range: 0 … 999,999,999,999(.99) — up to hundreds of billions, no trillion.
 */

export type CurrencyCode = "none" | "SAR" | "AED" | "EGP" | "USD" | "EUR" | "ILS";

export interface TafqitOptions {
  currency: CurrencyCode;
  chequeSuffix?: boolean; // wrap with فقط … لا غير (ignored for currency "none")
}

export type TafqitResult = { ok: true; text: string } | { ok: false; error: string };

export const MAX_INTEGER = 999_999_999_999; // hundreds of billions

type Gender = "m" | "f";

// ── vocabulary ──────────────────────────────────────────────────────────────
const ONES: Record<Gender, string[]> = {
  m: ["", "واحد", "اثنان", "ثلاثة", "أربعة", "خمسة", "ستة", "سبعة", "ثمانية", "تسعة"],
  f: ["", "واحدة", "اثنتان", "ثلاث", "أربع", "خمس", "ست", "سبع", "ثمان", "تسع"],
};

// index 0 = 10, 1..9 = 11..19
const TEENS: Record<Gender, string[]> = {
  m: ["عشرة", "أحد عشر", "اثنا عشر", "ثلاثة عشر", "أربعة عشر", "خمسة عشر", "ستة عشر", "سبعة عشر", "ثمانية عشر", "تسعة عشر"],
  f: ["عشر", "إحدى عشرة", "اثنتا عشرة", "ثلاث عشرة", "أربع عشرة", "خمس عشرة", "ست عشرة", "سبع عشرة", "ثمان عشرة", "تسع عشرة"],
};

const TENS = ["", "", "عشرون", "ثلاثون", "أربعون", "خمسون", "ستون", "سبعون", "ثمانون", "تسعون"];
const HUNDREDS = ["", "مائة", "مائتان", "ثلاثمائة", "أربعمائة", "خمسمائة", "ستمائة", "سبعمائة", "ثمانمائة", "تسعمائة"];

interface Scale {
  one: string;
  two: string;
  plural: string;
  acc: string;
}
// index 1 = thousand, 2 = million, 3 = milliard
const SCALES: (Scale | null)[] = [
  null,
  { one: "ألف", two: "ألفان", plural: "آلاف", acc: "ألفًا" },
  { one: "مليون", two: "مليونان", plural: "ملايين", acc: "مليونًا" },
  { one: "مليار", two: "ملياران", plural: "مليارات", acc: "مليارًا" },
];

interface Unit {
  gender: Gender;
  one: string;
  two: string;
  plural: string;
  acc: string;
  genitive: string;
}
interface Currency {
  main: Unit;
  fraction: Unit;
}

// EUR is treated as invariable; the count stays explicit even for 2 (اثنان يورو).
const INVARIABLE_EUR: Unit = { gender: "m", one: "يورو", two: "اثنان يورو", plural: "يورو", acc: "يورو", genitive: "يورو" };

export const CURRENCIES: Record<Exclude<CurrencyCode, "none">, Currency> = {
  SAR: {
    main: { gender: "m", one: "ريال سعودي", two: "ريالان سعوديان", plural: "ريالات سعودية", acc: "ريالًا سعوديًا", genitive: "ريال سعودي" },
    fraction: { gender: "f", one: "هللة", two: "هللتان", plural: "هللات", acc: "هللة", genitive: "هللة" },
  },
  AED: {
    main: { gender: "m", one: "درهم إماراتي", two: "درهمان إماراتيان", plural: "دراهم إماراتية", acc: "درهمًا إماراتيًا", genitive: "درهم إماراتي" },
    fraction: { gender: "m", one: "فلس", two: "فلسان", plural: "فلوس", acc: "فلسًا", genitive: "فلس" },
  },
  EGP: {
    main: { gender: "m", one: "جنيه مصري", two: "جنيهان مصريان", plural: "جنيهات مصرية", acc: "جنيهًا مصريًا", genitive: "جنيه مصري" },
    fraction: { gender: "m", one: "قرش", two: "قرشان", plural: "قروش", acc: "قرشًا", genitive: "قرش" },
  },
  USD: {
    main: { gender: "m", one: "دولار أمريكي", two: "دولاران أمريكيان", plural: "دولارات أمريكية", acc: "دولارًا أمريكيًا", genitive: "دولار أمريكي" },
    fraction: { gender: "m", one: "سنت", two: "سنتان", plural: "سنتات", acc: "سنتًا", genitive: "سنت" },
  },
  EUR: {
    main: INVARIABLE_EUR,
    fraction: { gender: "m", one: "سنت", two: "سنتان", plural: "سنتات", acc: "سنتًا", genitive: "سنت" },
  },
  ILS: {
    main: { gender: "m", one: "شيكل إسرائيلي", two: "شيكلان إسرائيليان", plural: "شواكل إسرائيلية", acc: "شيكلًا إسرائيليًا", genitive: "شيكل إسرائيلي" },
    fraction: { gender: "f", one: "أغورة", two: "أغورتان", plural: "أغورات", acc: "أغورة", genitive: "أغورة" },
  },
};

// ── helpers ──────────────────────────────────────────────────────────────────
const DUAL_CONSTRUCT: Record<string, string> = { ألفان: "ألفا", مليونان: "مليونا", ملياران: "مليارا", مائتان: "مائتا" };

/** Drop the ن of a trailing dual when a governed noun follows (مائتان→مائتا,
 *  ألفان→ألفا). Only touches the final word. */
function constructTrailingDual(s: string): string {
  for (const [full, con] of Object.entries(DUAL_CONSTRUCT)) {
    if (s === full) return con;
    if (s.endsWith(" " + full)) return s.slice(0, -full.length) + con;
  }
  return s;
}

const joinWaw = (parts: string[]): string => parts.filter(Boolean).join(" و");

/** Words for 1..999 with the given gender for the 1–19 part. */
function tripletWords(n: number, g: Gender): string {
  const parts: string[] = [];
  const h = Math.floor(n / 100);
  const rem = n % 100;
  if (h > 0) parts.push(HUNDREDS[h]);
  if (rem > 0) {
    if (rem < 10) parts.push(ONES[g][rem]);
    else if (rem < 20) parts.push(TEENS[g][rem - 10]);
    else {
      const u = rem % 10;
      const t = Math.floor(rem / 10);
      parts.push(u > 0 ? `${ONES[g][u]} و${TENS[t]}` : TENS[t]);
    }
  }
  return parts.join(" و");
}

/** count (1..999) + its scale noun with correct pluralization. */
function scaleChunk(c: number, scaleIdx: number): string {
  const sc = SCALES[scaleIdx]!;
  if (c === 1) return sc.one;
  if (c === 2) return sc.two;
  const r = c % 100;
  const countStr = constructTrailingDual(tripletWords(c, "m"));
  const noun = r >= 3 && r <= 10 ? sc.plural : r >= 11 && r <= 99 ? sc.acc : r === 2 ? sc.two : sc.one;
  return `${countStr} ${noun}`;
}

/** Integer 0..MAX → Arabic words. `unitsGender` applies only to the 1–19 part
 *  of the lowest (units) group; scale counts are always masculine. */
function integerWords(n: number, unitsGender: Gender): string {
  if (n === 0) return "صفر";
  const groups: { c: number; scale: number }[] = [];
  let x = n;
  let idx = 0;
  while (x > 0) {
    groups.push({ c: x % 1000, scale: idx });
    x = Math.floor(x / 1000);
    idx++;
  }
  const chunks: string[] = [];
  for (let i = groups.length - 1; i >= 0; i--) {
    const { c, scale } = groups[i];
    if (c === 0) continue;
    chunks.push(scale === 0 ? tripletWords(c, unitsGender) : scaleChunk(c, scale));
  }
  return joinWaw(chunks);
}

/** The counted-noun phrase for `v` of `unit` (v ≥ 0). */
function countedNoun(v: number, unit: Unit): string {
  const wahid = unit.gender === "m" ? "واحد" : "واحدة";
  if (v === 1) return `${unit.one} ${wahid}`;
  if (v === 2) return unit.two;
  const r = v % 100;
  const nounForm = r >= 3 && r <= 10 ? unit.plural : r >= 11 && r <= 99 ? unit.acc : unit.genitive;
  const num = constructTrailingDual(integerWords(v, unit.gender));
  return `${num} ${nounForm}`;
}

// ── money parsing (integer minor-unit arithmetic, no float multiply) ──────────
interface Parsed {
  intStr: string;
  fracStr: string; // may be ""
}

function normalizeDigits(s: string): string {
  return s.replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
}

function parseDecimal(input: string): Parsed | null {
  const s = normalizeDigits(input).replace(/[,\s]/g, "");
  if (!/^\d+(\.\d+)?$/.test(s)) return null;
  const [intStr, fracStr = ""] = s.split(".");
  return { intStr, fracStr };
}

/** Round a decimal to `minor` places (half up), returning {major, frac} as
 *  integers, using string math so money never touches float multiplication. */
function toMinorUnits(p: Parsed, minorPlaces: number): { major: number; frac: number } {
  const padded = (p.fracStr + "0".repeat(minorPlaces + 1)).slice(0, minorPlaces + 1);
  const keep = padded.slice(0, minorPlaces); // e.g. "99"
  const nextDigit = Number(padded[minorPlaces] ?? "0");
  let frac = Number(keep || "0");
  let major = Number(p.intStr);
  if (nextDigit >= 5) frac += 1; // round half up
  const unit = 10 ** minorPlaces;
  if (frac >= unit) {
    frac -= unit;
    major += 1;
  }
  return { major, frac };
}

// ── public API ────────────────────────────────────────────────────────────────
export function tafqit(input: string | number, opts: TafqitOptions): TafqitResult {
  const raw = typeof input === "number" ? String(input) : input;
  const parsed = parseDecimal(raw);
  if (!parsed) return { ok: false, error: "أدخل رقمًا صحيحًا." };

  if (opts.currency === "none") {
    const major = Number(parsed.intStr);
    if (major > MAX_INTEGER) return { ok: false, error: "الرقم خارج النطاق المدعوم." };
    let text = integerWords(major, "m");
    if (parsed.fracStr.length > 0) {
      // read digit-by-digit, preserving zeros exactly as entered (no rounding)
      const digits = parsed.fracStr.split("").map((d) => (d === "0" ? "صفر" : ONES.m[Number(d)]));
      text = `${text} فاصلة ${digits.join(" ")}`;
    }
    return { ok: true, text };
  }

  const cur = CURRENCIES[opts.currency];
  const { major, frac } = toMinorUnits(parsed, 2);
  if (major > MAX_INTEGER) return { ok: false, error: "الرقم خارج النطاق المدعوم." };

  const majorPart = major > 0 ? countedNoun(major, cur.main) : "";
  const fracPart = frac > 0 ? countedNoun(frac, cur.fraction) : "";

  let body: string;
  if (!majorPart && !fracPart) body = `صفر ${cur.main.genitive}`;
  else body = joinWaw([majorPart, fracPart]);

  const useSuffix = opts.chequeSuffix ?? true;
  const text = useSuffix ? `فقط ${body} لا غير` : body;
  return { ok: true, text };
}
