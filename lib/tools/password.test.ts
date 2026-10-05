import { describe, it, expect } from "vitest";
import {
  buildCharset,
  clampLength,
  generatePassword,
  estimateStrength,
  CHAR_SETS,
  MIN_LENGTH,
  MAX_LENGTH,
  type PasswordOptions,
} from "./password";

const ALL: PasswordOptions = { length: 16, lower: true, upper: true, digits: true, symbols: true };

// Deterministic rng: always returns 0 → picks the first char of the pool.
const zero = () => 0;

describe("buildCharset", () => {
  it("concatenates only enabled sets", () => {
    expect(buildCharset({ length: 8, lower: true, upper: false, digits: false, symbols: false })).toBe(CHAR_SETS.lower);
    expect(buildCharset({ length: 8, lower: false, upper: false, digits: true, symbols: false })).toBe(CHAR_SETS.digits);
  });
  it("excludes ambiguous characters", () => {
    const all = buildCharset(ALL);
    for (const ch of ["I", "l", "1", "O", "0", "o"]) expect(all).not.toContain(ch);
  });
});

describe("clampLength", () => {
  it("clamps to [MIN, MAX] and floors", () => {
    expect(clampLength(2)).toBe(MIN_LENGTH);
    expect(clampLength(999)).toBe(MAX_LENGTH);
    expect(clampLength(12.9)).toBe(12);
    expect(clampLength(NaN)).toBe(MIN_LENGTH);
  });
});

describe("generatePassword", () => {
  it("respects requested length", () => {
    expect(generatePassword({ ...ALL, length: 20 }, zero)).toHaveLength(20);
  });
  it("only uses characters from the enabled sets", () => {
    const pw = generatePassword({ length: 40, lower: false, upper: false, digits: true, symbols: false }, (max) =>
      Math.floor(Math.random() * max),
    );
    expect(/^[23456789]+$/.test(pw)).toBe(true);
  });
  it("returns empty string when no set is enabled", () => {
    expect(generatePassword({ length: 12, lower: false, upper: false, digits: false, symbols: false })).toBe("");
  });
  it("is deterministic under an injected rng", () => {
    // zero() always picks index 0 → first char of pool repeated.
    const pool = buildCharset(ALL);
    expect(generatePassword({ ...ALL, length: 5 }, zero)).toBe(pool[0].repeat(5));
  });
});

describe("estimateStrength", () => {
  it("rates a long all-sets password very strong", () => {
    expect(estimateStrength({ ...ALL, length: 20 }).label).toBe("قوية جدًا");
  });
  it("rates a short digits-only password weak", () => {
    expect(estimateStrength({ length: 4, lower: false, upper: false, digits: true, symbols: false }).label).toBe("ضعيفة");
  });
});
