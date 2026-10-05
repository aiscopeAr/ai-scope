/**
 * lib/tools/password.ts
 *
 * Pure password-generation logic. The randomness source is injectable so the
 * builder is deterministically testable; in the browser it defaults to the
 * CSPRNG (crypto.getRandomValues) with rejection sampling to avoid modulo
 * bias. Ambiguous look-alike characters (I l 1 O 0 o) are excluded so the
 * password is easy to read and transcribe.
 */

export interface PasswordOptions {
  length: number;
  lower: boolean;
  upper: boolean;
  digits: boolean;
  symbols: boolean;
}

export const MIN_LENGTH = 4;
export const MAX_LENGTH = 64;

export const CHAR_SETS = {
  lower: "abcdefghijkmnpqrstuvwxyz",
  upper: "ABCDEFGHJKLMNPQRSTUVWXYZ",
  digits: "23456789",
  symbols: "!@#$%^&*-_=+?",
} as const;

/** `rand(max)` returns a uniform integer in [0, max). */
export type RandomInt = (max: number) => number;

const defaultRandom: RandomInt = (max: number) => {
  const arr = new Uint32Array(1);
  const limit = Math.floor(0xffffffff / max) * max;
  let x = 0;
  do {
    crypto.getRandomValues(arr);
    x = arr[0];
  } while (x >= limit);
  return x % max;
};

export function buildCharset(o: PasswordOptions): string {
  let pool = "";
  if (o.lower) pool += CHAR_SETS.lower;
  if (o.upper) pool += CHAR_SETS.upper;
  if (o.digits) pool += CHAR_SETS.digits;
  if (o.symbols) pool += CHAR_SETS.symbols;
  return pool;
}

export function clampLength(n: number): number {
  if (!Number.isFinite(n)) return MIN_LENGTH;
  return Math.min(MAX_LENGTH, Math.max(MIN_LENGTH, Math.floor(n)));
}

/** Generate a password, or "" if no character set is enabled. */
export function generatePassword(o: PasswordOptions, rand: RandomInt = defaultRandom): string {
  const pool = buildCharset(o);
  if (!pool) return "";
  const n = clampLength(o.length);
  let out = "";
  for (let i = 0; i < n; i++) out += pool[rand(pool.length)];
  return out;
}

export type StrengthLabel = "ضعيفة" | "متوسطة" | "قوية" | "قوية جدًا";

export function estimateStrength(o: PasswordOptions): { bits: number; label: StrengthLabel } {
  const pool = buildCharset(o).length;
  const n = clampLength(o.length);
  const bits = pool > 1 ? Math.round(n * Math.log2(pool)) : 0;
  let label: StrengthLabel;
  if (bits < 40) label = "ضعيفة";
  else if (bits < 60) label = "متوسطة";
  else if (bits < 80) label = "قوية";
  else label = "قوية جدًا";
  return { bits, label };
}
