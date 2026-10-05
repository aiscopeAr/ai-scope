import { describe, it, expect } from "vitest";
import { LENGTH, WEIGHT, convertLinear, convertTemperature, roundUnit } from "./units";

const u = (cat: typeof LENGTH, id: string) => cat.units.find((x) => x.id === id)!;

describe("convertLinear (length)", () => {
  it("m → cm", () => {
    expect(convertLinear(1, u(LENGTH, "m"), u(LENGTH, "cm"))).toBe(100);
  });
  it("km → mile", () => {
    expect(roundUnit(convertLinear(1, u(LENGTH, "km"), u(LENGTH, "mile")))).toBe(0.6214);
  });
  it("inch → cm", () => {
    expect(roundUnit(convertLinear(1, u(LENGTH, "inch"), u(LENGTH, "cm")))).toBe(2.54);
  });
});

describe("convertLinear (weight)", () => {
  it("kg → lb", () => {
    expect(roundUnit(convertLinear(1, u(WEIGHT, "kg"), u(WEIGHT, "lb")), 2)).toBe(2.2);
  });
  it("kg → g", () => {
    expect(convertLinear(2, u(WEIGHT, "kg"), u(WEIGHT, "g"))).toBe(2000);
  });
});

describe("convertTemperature", () => {
  it("0°C = 32°F = 273.15K", () => {
    expect(convertTemperature(0, "c", "f")).toBe(32);
    expect(convertTemperature(0, "c", "k")).toBe(273.15);
  });
  it("100°C = 212°F", () => {
    expect(convertTemperature(100, "c", "f")).toBe(212);
  });
  it("98.6°F ≈ 37°C", () => {
    expect(roundUnit(convertTemperature(98.6, "f", "c"), 1)).toBe(37);
  });
  it("round-trips C→F→C", () => {
    expect(roundUnit(convertTemperature(convertTemperature(25, "c", "f"), "f", "c"))).toBe(25);
  });
});
