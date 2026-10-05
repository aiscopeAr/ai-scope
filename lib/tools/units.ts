/**
 * lib/tools/units.ts
 *
 * Pure unit conversion for the "محوّل الوحدات" tool. Length and weight use a
 * linear factor to a base unit; temperature is handled separately (affine, not
 * a single factor). No deps.
 */

export interface Unit {
  id: string;
  labelAr: string;
  factor: number; // value * factor = value in the category's base unit
}

export interface UnitCategory {
  id: string;
  labelAr: string;
  units: Unit[];
}

export const LENGTH: UnitCategory = {
  id: "length",
  labelAr: "الطول",
  units: [
    { id: "mm", labelAr: "مليمتر", factor: 0.001 },
    { id: "cm", labelAr: "سنتيمتر", factor: 0.01 },
    { id: "m", labelAr: "متر", factor: 1 },
    { id: "km", labelAr: "كيلومتر", factor: 1000 },
    { id: "inch", labelAr: "إنش", factor: 0.0254 },
    { id: "foot", labelAr: "قدم", factor: 0.3048 },
    { id: "mile", labelAr: "ميل", factor: 1609.344 },
  ],
};

export const WEIGHT: UnitCategory = {
  id: "weight",
  labelAr: "الوزن",
  units: [
    { id: "mg", labelAr: "مليغرام", factor: 0.001 },
    { id: "g", labelAr: "غرام", factor: 1 },
    { id: "kg", labelAr: "كيلوغرام", factor: 1000 },
    { id: "ton", labelAr: "طن", factor: 1_000_000 },
    { id: "oz", labelAr: "أونصة", factor: 28.349523125 },
    { id: "lb", labelAr: "رطل (باوند)", factor: 453.59237 },
  ],
};

/** Convert within a linear-factor category (length/weight). */
export function convertLinear(value: number, from: Unit, to: Unit): number {
  return (value * from.factor) / to.factor;
}

// --- Temperature (affine) ---
export type TempUnit = "c" | "f" | "k";

export const TEMP_UNITS: { id: TempUnit; labelAr: string }[] = [
  { id: "c", labelAr: "مئوية (°C)" },
  { id: "f", labelAr: "فهرنهايت (°F)" },
  { id: "k", labelAr: "كلفن (K)" },
];

function toCelsius(value: number, from: TempUnit): number {
  if (from === "c") return value;
  if (from === "f") return (value - 32) * (5 / 9);
  return value - 273.15; // k
}

function fromCelsius(celsius: number, to: TempUnit): number {
  if (to === "c") return celsius;
  if (to === "f") return celsius * (9 / 5) + 32;
  return celsius + 273.15; // k
}

export function convertTemperature(value: number, from: TempUnit, to: TempUnit): number {
  return fromCelsius(toCelsius(value, from), to);
}

/** Round to at most `dp` decimals, dropping trailing zeros. */
export function roundUnit(n: number, dp = 4): number {
  const f = 10 ** dp;
  return Math.round(n * f) / f;
}
