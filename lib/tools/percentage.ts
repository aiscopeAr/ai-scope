/**
 * lib/tools/percentage.ts
 *
 * Pure percentage math for the "حاسبة النسبة المئوية" tool. Each function
 * returns `null` when the result is undefined (division by zero). No deps.
 */

/** X% of Y. */
export function percentOf(percent: number, total: number): number {
  return (percent / 100) * total;
}

/** X is what percent of Y. */
export function whatPercent(part: number, total: number): number | null {
  if (total === 0) return null;
  return (part / total) * 100;
}

/** Percent change from A to B (negative = decrease). */
export function percentChange(from: number, to: number): number | null {
  if (from === 0) return null;
  return ((to - from) / from) * 100;
}

/** Round to at most `dp` decimals, dropping trailing zeros. */
export function roundSmart(n: number, dp = 2): number {
  const f = 10 ** dp;
  return Math.round(n * f) / f;
}
