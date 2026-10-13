import { describe, it, expect } from "vitest";
import { netZakatable, nisabFromGoldPrice, computeZakat, ZAKAT_RATE, NISAB_GOLD_GRAMS } from "./zakat";

const assets = (o: Partial<Parameters<typeof netZakatable>[0]> = {}) => ({
  cash: 0, gold: 0, silver: 0, investments: 0, trade: 0, debts: 0, ...o,
});

describe("netZakatable", () => {
  it("sums assets and subtracts debts", () => {
    expect(netZakatable(assets({ cash: 10000, gold: 5000, debts: 3000 }))).toBe(12000);
  });
  it("never goes below zero", () => {
    expect(netZakatable(assets({ cash: 1000, debts: 5000 }))).toBe(0);
  });
  it("ignores negative/invalid inputs", () => {
    expect(netZakatable(assets({ cash: -500, trade: 2000 }))).toBe(2000);
  });
});

describe("nisabFromGoldPrice", () => {
  it("is 85g × price", () => {
    expect(nisabFromGoldPrice(300)).toBe(300 * NISAB_GOLD_GRAMS); // 25500
  });
});

describe("computeZakat", () => {
  it("charges 2.5% when above nisab", () => {
    const r = computeZakat(assets({ cash: 40000 }), 25500);
    expect(r.aboveNisab).toBe(true);
    expect(r.due).toBe(1000); // 40000 * 0.025
  });
  it("charges nothing below nisab", () => {
    const r = computeZakat(assets({ cash: 10000 }), 25500);
    expect(r.aboveNisab).toBe(false);
    expect(r.due).toBe(0);
  });
  it("is exactly at the nisab boundary (inclusive)", () => {
    expect(computeZakat(assets({ cash: 25500 }), 25500).aboveNisab).toBe(true);
  });
  it("without a nisab, computes 2.5% of any positive net", () => {
    const r = computeZakat(assets({ cash: 8000 }), null);
    expect(r.nisab).toBeNull();
    expect(r.aboveNisab).toBe(true);
    expect(r.due).toBe(200);
  });
  it("rounds due to 2 decimals", () => {
    expect(computeZakat(assets({ cash: 1234.56 }), null).due).toBe(Math.round(1234.56 * ZAKAT_RATE * 100) / 100);
  });
});
