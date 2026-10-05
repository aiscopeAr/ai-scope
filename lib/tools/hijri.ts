/**
 * lib/tools/hijri.ts
 *
 * Hijri ⇄ Gregorian conversion with ZERO dependencies and ZERO runtime cost.
 *
 * The browser (and Node ≥ full-ICU) ships the Umm al-Qura calendar — the
 * official civil Hijri calendar of Saudi Arabia and the Gulf — inside `Intl`.
 * We read Gregorian→Hijri straight from `Intl.DateTimeFormat`, and invert it
 * (Hijri→Gregorian) by binary-searching the Gregorian day whose Umm al-Qura
 * rendering equals the target. The mapping is strictly monotonic and bijective
 * at day granularity, so the search is exact — no hand-rolled astronomical
 * tables to drift out of sync with the official calendar.
 *
 * Pure + side-effect free: trivially testable and runs entirely client-side.
 */

export interface HijriDate {
  year: number;
  month: number; // 1-12
  day: number; // 1-30
}

export const HIJRI_MONTHS_AR = [
  "محرم",
  "صفر",
  "ربيع الأول",
  "ربيع الآخر",
  "جمادى الأولى",
  "جمادى الآخرة",
  "رجب",
  "شعبان",
  "رمضان",
  "شوال",
  "ذو القعدة",
  "ذو الحجة",
] as const;

export const GREGORIAN_MONTHS_AR = [
  "يناير",
  "فبراير",
  "مارس",
  "أبريل",
  "مايو",
  "يونيو",
  "يوليو",
  "أغسطس",
  "سبتمبر",
  "أكتوبر",
  "نوفمبر",
  "ديسمبر",
] as const;

export const WEEKDAYS_AR = [
  "الأحد",
  "الإثنين",
  "الثلاثاء",
  "الأربعاء",
  "الخميس",
  "الجمعة",
  "السبت",
] as const;

const DAY_MS = 86_400_000;

// Umm al-Qura is tabulated roughly 1300–1600 AH (≈1882–2174 CE). Keep the
// search window safely inside that and covering every realistic user input.
const SEARCH_MIN_UTC = Date.UTC(1920, 0, 1);
const SEARCH_MAX_UTC = Date.UTC(2160, 0, 1);

// `en` locale + latn numbers so formatToParts yields plain ASCII digits.
const hijriFormatter = new Intl.DateTimeFormat("en-US-u-ca-islamic-umalqura-nu-latn", {
  year: "numeric",
  month: "numeric",
  day: "numeric",
  timeZone: "UTC",
});

function toComparable(h: HijriDate): number {
  return h.year * 10_000 + h.month * 100 + h.day;
}

/** Gregorian → Umm al-Qura Hijri. `date` is read at UTC midnight. */
export function gregorianToHijri(date: Date): HijriDate {
  const utcMidnight = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const parts = hijriFormatter.formatToParts(utcMidnight);
  const pick = (type: string) => {
    const v = parts.find((p) => p.type === type)?.value ?? "";
    return Number.parseInt(v.replace(/[^0-9]/g, ""), 10);
  };
  return { year: pick("year"), month: pick("month"), day: pick("day") };
}

/**
 * Umm al-Qura Hijri → Gregorian (UTC-midnight Date), or `null` when the Hijri
 * date does not exist (e.g. day 30 of a 29-day month, or out of table range).
 */
export function hijriToGregorian(year: number, month: number, day: number): Date | null {
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return null;
  if (month < 1 || month > 12 || day < 1 || day > 30) return null;

  const target = year * 10_000 + month * 100 + day;

  let lo = Math.floor(SEARCH_MIN_UTC / DAY_MS);
  let hi = Math.floor(SEARCH_MAX_UTC / DAY_MS);

  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    const h = gregorianToHijri(new Date(mid * DAY_MS));
    if (toComparable(h) < target) lo = mid + 1;
    else hi = mid;
  }

  const candidate = new Date(lo * DAY_MS);
  // Verify exactness — guards invalid inputs (no such day) and range edges.
  if (toComparable(gregorianToHijri(candidate)) !== target) return null;
  return candidate;
}

export function isValidHijri(year: number, month: number, day: number): boolean {
  return hijriToGregorian(year, month, day) !== null;
}

export function formatHijriAr(h: HijriDate): string {
  const name = HIJRI_MONTHS_AR[h.month - 1] ?? "";
  return `${h.day} ${name} ${h.year} هـ`;
}

export function formatGregorianAr(date: Date): string {
  const name = GREGORIAN_MONTHS_AR[date.getUTCMonth()] ?? "";
  return `${date.getUTCDate()} ${name} ${date.getUTCFullYear()} م`;
}

export function weekdayAr(date: Date): string {
  return WEEKDAYS_AR[date.getUTCDay()];
}
