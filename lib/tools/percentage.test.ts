import { describe, it, expect } from "vitest";
import { percentOf, whatPercent, percentChange, roundSmart } from "./percentage";

describe("percentOf", () => {
  it("computes X% of Y", () => {
    expect(percentOf(25, 200)).toBe(50);
    expect(percentOf(0, 200)).toBe(0);
  });
});

describe("whatPercent", () => {
  it("computes X is what % of Y", () => {
    expect(whatPercent(50, 200)).toBe(25);
  });
  it("returns null for total 0", () => {
    expect(whatPercent(5, 0)).toBeNull();
  });
});

describe("percentChange", () => {
  it("computes increase and decrease", () => {
    expect(percentChange(100, 150)).toBe(50);
    expect(percentChange(200, 100)).toBe(-50);
  });
  it("returns null when starting from 0", () => {
    expect(percentChange(0, 100)).toBeNull();
  });
});

describe("roundSmart", () => {
  it("rounds to 2 dp and drops trailing zeros", () => {
    expect(roundSmart(33.33333)).toBe(33.33);
    expect(roundSmart(50)).toBe(50);
    expect(roundSmart(12.5)).toBe(12.5);
  });
});
