/**
 * lib/tools/age.ts
 *
 * Pure age math for the "حاسبة العمر" tool. All dates are treated at UTC
 * midnight so results never shift with the viewer's timezone. Includes the
 * Hijri age (via lib/tools/hijri) — a differentiator for the Arabic audience.
 */

import { gregorianToHijri, weekdayAr } from "./hijri";

export interface AgeResult {
  years: number;
  months: number;
  days: number;
  totalDays: number;
  totalWeeks: number;
  totalMonths: number;
  hijriYears: number;
  nextBirthdayInDays: number;
  weekdayBorn: string;
}

const DAY_MS = 86_400_000;

function daysInMonth(year: number, monthZeroBased: number): number {
  // Day 0 of the next month = last day of this month.
  return new Date(Date.UTC(year, monthZeroBased + 1, 0)).getUTCDate();
}

/** birth + `k` whole months, clamping the day to the target month's length
 *  (e.g. 31 Jan + 1 month → 28/29 Feb). */
function addMonthsClamped(birth: Date, k: number): Date {
  const total = birth.getUTCMonth() + k;
  const year = birth.getUTCFullYear() + Math.floor(total / 12);
  const month = ((total % 12) + 12) % 12;
  const day = Math.min(birth.getUTCDate(), daysInMonth(year, month));
  return new Date(Date.UTC(year, month, day));
}

/** Compute age breakdown, or `null` if the birth date is after `now`. */
export function computeAge(birth: Date, now: Date): AgeResult | null {
  const b = new Date(Date.UTC(birth.getUTCFullYear(), birth.getUTCMonth(), birth.getUTCDate()));
  const n = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  if (b.getTime() > n.getTime()) return null;

  // Whole months elapsed, then derive Y/M/D from a clamped anchor so the day
  // component can never go negative across uneven month lengths.
  let totalMonthsElapsed = (n.getUTCFullYear() - b.getUTCFullYear()) * 12 + (n.getUTCMonth() - b.getUTCMonth());
  if (n.getUTCDate() < b.getUTCDate() && addMonthsClamped(b, totalMonthsElapsed).getTime() > n.getTime()) {
    totalMonthsElapsed -= 1;
  }
  const years = Math.floor(totalMonthsElapsed / 12);
  const months = totalMonthsElapsed % 12;
  const anchor = addMonthsClamped(b, totalMonthsElapsed);
  const days = Math.floor((n.getTime() - anchor.getTime()) / DAY_MS);

  const totalDays = Math.floor((n.getTime() - b.getTime()) / DAY_MS);
  const totalWeeks = Math.floor(totalDays / 7);
  const totalMonths = years * 12 + months;

  // Hijri age in whole years.
  const hb = gregorianToHijri(b);
  const hn = gregorianToHijri(n);
  const hijriNotReached = hn.month < hb.month || (hn.month === hb.month && hn.day < hb.day);
  const hijriYears = hn.year - hb.year - (hijriNotReached ? 1 : 0);

  // Days until the next Gregorian birthday.
  let next = new Date(Date.UTC(n.getUTCFullYear(), b.getUTCMonth(), b.getUTCDate()));
  if (next.getTime() < n.getTime()) {
    next = new Date(Date.UTC(n.getUTCFullYear() + 1, b.getUTCMonth(), b.getUTCDate()));
  }
  const nextBirthdayInDays = Math.round((next.getTime() - n.getTime()) / DAY_MS);

  return {
    years,
    months,
    days,
    totalDays,
    totalWeeks,
    totalMonths,
    hijriYears,
    nextBirthdayInDays,
    weekdayBorn: weekdayAr(b),
  };
}
