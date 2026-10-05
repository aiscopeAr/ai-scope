import { describe, it, expect } from "vitest";
import { computeBmi, bmiCategory, healthyWeightRange, round1 } from "./bmi";

describe("computeBmi", () => {
  it("computes a known BMI (70kg, 175cm ≈ 22.9)", () => {
    expect(computeBmi(70, 175)).toBe(22.9);
  });
  it("computes 90kg, 180cm ≈ 27.8", () => {
    expect(computeBmi(90, 180)).toBe(27.8);
  });
  it("returns null for non-positive input", () => {
    expect(computeBmi(0, 175)).toBeNull();
    expect(computeBmi(70, 0)).toBeNull();
    expect(computeBmi(-5, 170)).toBeNull();
  });
});

describe("bmiCategory", () => {
  const label = (bmi: number) => bmiCategory(bmi).labelAr;
  it("maps WHO bands to Arabic labels", () => {
    expect(label(17)).toBe("نقص في الوزن");
    expect(label(22)).toBe("وزن طبيعي");
    expect(label(18.5)).toBe("وزن طبيعي"); // boundary inclusive
    expect(label(27)).toBe("زيادة في الوزن");
    expect(label(32)).toBe("سمنة من الدرجة الأولى");
    expect(label(37)).toBe("سمنة من الدرجة الثانية");
    expect(label(41)).toBe("سمنة مفرطة (الدرجة الثالثة)");
  });
});

describe("healthyWeightRange", () => {
  it("returns the 18.5–24.9 band for a height", () => {
    const r = healthyWeightRange(175)!;
    expect(r.min).toBe(round1(18.5 * 1.75 * 1.75));
    expect(r.max).toBe(round1(24.9 * 1.75 * 1.75));
    expect(r.min).toBeLessThan(r.max);
  });
  it("returns null for non-positive height", () => {
    expect(healthyWeightRange(0)).toBeNull();
  });
});
