import { beforeEach, describe, expect, it, vi } from "vitest";

const mockFindUnique = vi.fn();
vi.mock("@/lib/db", () => ({
  prisma: { systemSetting: { findUnique: (...a: unknown[]) => mockFindUnique(...a) } },
}));

import { getEditorialV2ShadowMaxPerRun, DEFAULT_EDITORIAL_V2_SHADOW_MAX_PER_RUN } from "./settings";

beforeEach(() => vi.clearAllMocks());

describe("getEditorialV2ShadowMaxPerRun", () => {
  it("returns the default when no row exists", async () => {
    mockFindUnique.mockResolvedValue(null);
    expect(await getEditorialV2ShadowMaxPerRun()).toBe(DEFAULT_EDITORIAL_V2_SHADOW_MAX_PER_RUN);
  });

  it("HONORS an explicit stored 0 (does not coerce to default)", async () => {
    mockFindUnique.mockResolvedValue({ value: "0" });
    expect(await getEditorialV2ShadowMaxPerRun()).toBe(0);
  });

  it("parses a normal integer", async () => {
    mockFindUnique.mockResolvedValue({ value: "7" });
    expect(await getEditorialV2ShadowMaxPerRun()).toBe(7);
  });

  it("clamps above the ceiling", async () => {
    mockFindUnique.mockResolvedValue({ value: "999" });
    expect(await getEditorialV2ShadowMaxPerRun()).toBe(25);
  });

  it("floors negatives at 0", async () => {
    mockFindUnique.mockResolvedValue({ value: "-5" });
    expect(await getEditorialV2ShadowMaxPerRun()).toBe(0);
  });

  it("falls back to default on non-numeric value", async () => {
    mockFindUnique.mockResolvedValue({ value: "abc" });
    expect(await getEditorialV2ShadowMaxPerRun()).toBe(DEFAULT_EDITORIAL_V2_SHADOW_MAX_PER_RUN);
  });

  it("falls back to default on DB error", async () => {
    mockFindUnique.mockRejectedValue(new Error("db down"));
    expect(await getEditorialV2ShadowMaxPerRun()).toBe(DEFAULT_EDITORIAL_V2_SHADOW_MAX_PER_RUN);
  });
});
