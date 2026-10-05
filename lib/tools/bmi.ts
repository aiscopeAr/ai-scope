/**
 * lib/tools/bmi.ts
 *
 * Pure BMI (مؤشر كتلة الجسم) math for the calculator tool. WHO adult
 * categories. No deps. BMI = weight(kg) / height(m)². This is a general
 * wellness indicator, not medical advice (the tool says so in its FAQ).
 */

export interface BmiCategory {
  id: string;
  labelAr: string;
  /** inclusive lower bound (bmi >= min); the first category has min 0 */
  min: number;
}

// Ordered low → high; a BMI falls in the last category whose `min` it meets.
export const BMI_CATEGORIES: BmiCategory[] = [
  { id: "underweight", labelAr: "نقص في الوزن", min: 0 },
  { id: "normal", labelAr: "وزن طبيعي", min: 18.5 },
  { id: "overweight", labelAr: "زيادة في الوزن", min: 25 },
  { id: "obese1", labelAr: "سمنة من الدرجة الأولى", min: 30 },
  { id: "obese2", labelAr: "سمنة من الدرجة الثانية", min: 35 },
  { id: "obese3", labelAr: "سمنة مفرطة (الدرجة الثالثة)", min: 40 },
];

export function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

/** BMI for weight (kg) and height (cm), or null for non-positive input. */
export function computeBmi(weightKg: number, heightCm: number): number | null {
  if (!(weightKg > 0) || !(heightCm > 0)) return null;
  const m = heightCm / 100;
  return round1(weightKg / (m * m));
}

export function bmiCategory(bmi: number): BmiCategory {
  let found = BMI_CATEGORIES[0];
  for (const c of BMI_CATEGORIES) {
    if (bmi >= c.min) found = c;
  }
  return found;
}

/** Healthy weight range (kg) for a height, from the normal BMI band 18.5–24.9. */
export function healthyWeightRange(heightCm: number): { min: number; max: number } | null {
  if (!(heightCm > 0)) return null;
  const m = heightCm / 100;
  return { min: round1(18.5 * m * m), max: round1(24.9 * m * m) };
}
