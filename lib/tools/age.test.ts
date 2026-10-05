import { describe, it, expect } from "vitest";
import { computeAge } from "./age";

const utc = (y: number, m: number, d: number) => new Date(Date.UTC(y, m - 1, d));

describe("computeAge", () => {
  it("computes a simple whole-year age", () => {
    const r = computeAge(utc(2000, 1, 1), utc(2025, 1, 1));
    expect(r).not.toBeNull();
    expect(r!.years).toBe(25);
    expect(r!.months).toBe(0);
    expect(r!.days).toBe(0);
  });

  it("handles a date before the birthday this year", () => {
    const r = computeAge(utc(2000, 6, 15), utc(2025, 3, 10))!;
    expect(r.years).toBe(24);
    expect(r.months).toBe(8);
    expect(r.days).toBe(23); // 15 Jun → 10 Mar: borrows from February
  });

  it("borrows days correctly across month boundaries", () => {
    const r = computeAge(utc(2024, 1, 31), utc(2024, 3, 1))!;
    expect(r.years).toBe(0);
    expect(r.months).toBe(1);
    // Feb 2024 (leap) has 29 days; 31 Jan → 1 Mar
    expect(r.days).toBe(1);
  });

  it("returns null when birth is in the future", () => {
    expect(computeAge(utc(2030, 1, 1), utc(2025, 1, 1))).toBeNull();
  });

  it("computes totals", () => {
    const r = computeAge(utc(2020, 1, 1), utc(2020, 1, 31))!;
    expect(r.totalDays).toBe(30);
    expect(r.totalWeeks).toBe(4);
  });

  it("includes a plausible Hijri age", () => {
    const r = computeAge(utc(2000, 1, 1), utc(2025, 1, 1))!;
    // Hijri years run ~11 days shorter, so Hijri age > Gregorian age.
    expect(r.hijriYears).toBeGreaterThanOrEqual(25);
    expect(r.hijriYears).toBeLessThanOrEqual(27);
  });

  it("computes days until next birthday", () => {
    const r = computeAge(utc(2000, 12, 31), utc(2025, 1, 1))!;
    expect(r.nextBirthdayInDays).toBe(364); // next 31 Dec 2025
  });

  it("reports weekday born in Arabic", () => {
    // 1 Jan 2000 was a Saturday.
    expect(computeAge(utc(2000, 1, 1), utc(2025, 1, 1))!.weekdayBorn).toBe("السبت");
  });
});
