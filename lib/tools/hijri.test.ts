import { describe, it, expect } from "vitest";
import {
  gregorianToHijri,
  hijriToGregorian,
  isValidHijri,
  formatHijriAr,
  formatGregorianAr,
  HIJRI_MONTHS_AR,
} from "./hijri";

describe("gregorianToHijri", () => {
  it("returns a plausible Hijri triple", () => {
    const h = gregorianToHijri(new Date(Date.UTC(2024, 0, 1)));
    expect(h.year).toBeGreaterThan(1400);
    expect(h.year).toBeLessThan(1500);
    expect(h.month).toBeGreaterThanOrEqual(1);
    expect(h.month).toBeLessThanOrEqual(12);
    expect(h.day).toBeGreaterThanOrEqual(1);
    expect(h.day).toBeLessThanOrEqual(30);
  });

  it("matches a known Umm al-Qura anchor (1 Ramadan 1444 = 23 Mar 2023)", () => {
    const h = gregorianToHijri(new Date(Date.UTC(2023, 2, 23)));
    expect(h).toEqual({ year: 1444, month: 9, day: 1 });
  });
});

describe("hijriToGregorian", () => {
  it("inverts the known anchor", () => {
    const g = hijriToGregorian(1444, 9, 1);
    expect(g).not.toBeNull();
    expect(g!.getUTCFullYear()).toBe(2023);
    expect(g!.getUTCMonth()).toBe(2); // March
    expect(g!.getUTCDate()).toBe(23);
  });

  it("rejects an impossible date (month 13)", () => {
    expect(hijriToGregorian(1445, 13, 1)).toBeNull();
  });

  it("rejects day 0 and day 31", () => {
    expect(hijriToGregorian(1445, 1, 0)).toBeNull();
    expect(hijriToGregorian(1445, 1, 31)).toBeNull();
  });

  it("rejects non-integer input", () => {
    expect(hijriToGregorian(1445.5, 1, 1)).toBeNull();
  });
});

describe("round-trip invariant (strong correctness guarantee)", () => {
  it("gregorian → hijri → gregorian returns the same day across a wide range", () => {
    const start = Date.UTC(1950, 0, 1);
    const end = Date.UTC(2100, 0, 1);
    const DAY = 86_400_000;
    // sample every ~37 days to keep it fast but broad
    for (let t = start; t <= end; t += DAY * 37) {
      const g = new Date(t);
      const h = gregorianToHijri(g);
      const back = hijriToGregorian(h.year, h.month, h.day);
      expect(back).not.toBeNull();
      expect(back!.getTime()).toBe(t);
    }
  });

  it("is strictly monotonic (consecutive days never go backwards)", () => {
    const DAY = 86_400_000;
    let prev = -Infinity;
    for (let i = 0; i < 400; i++) {
      const h = gregorianToHijri(new Date(Date.UTC(2025, 0, 1) + i * DAY));
      const cmp = h.year * 10000 + h.month * 100 + h.day;
      expect(cmp).toBeGreaterThan(prev);
      prev = cmp;
    }
  });
});

describe("isValidHijri", () => {
  it("accepts the anchor and rejects nonsense", () => {
    expect(isValidHijri(1444, 9, 1)).toBe(true);
    expect(isValidHijri(1445, 0, 1)).toBe(false);
  });
});

describe("formatters", () => {
  it("formats Hijri in Arabic with month name + هـ", () => {
    expect(formatHijriAr({ year: 1444, month: 9, day: 1 })).toBe(`1 ${HIJRI_MONTHS_AR[8]} 1444 هـ`);
  });
  it("formats Gregorian in Arabic with م", () => {
    expect(formatGregorianAr(new Date(Date.UTC(2023, 2, 23)))).toContain("2023 م");
  });
});
