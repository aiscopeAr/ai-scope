import { beforeEach, describe, expect, it, vi } from "vitest";

const mockFindUnique = vi.fn();
vi.mock("@/lib/db", () => ({
  prisma: { systemSetting: { findUnique: (...a: unknown[]) => mockFindUnique(...a) } },
}));

import {
  getEditorialV2ShadowMaxPerRun,
  DEFAULT_EDITORIAL_V2_SHADOW_MAX_PER_RUN,
  getEditorialV2OnMaxPerRun,
  DEFAULT_EDITORIAL_V2_ON_MAX_PER_RUN,
  getEditorialV2GateMode,
} from "./settings";

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

describe("getEditorialV2OnMaxPerRun (A3 canary cap)", () => {
  it("defaults to 1 when no row exists", async () => {
    mockFindUnique.mockResolvedValue(null);
    expect(DEFAULT_EDITORIAL_V2_ON_MAX_PER_RUN).toBe(1);
    expect(await getEditorialV2OnMaxPerRun()).toBe(1);
  });

  it("HONORS an explicit stored 0 (does not coerce to default)", async () => {
    mockFindUnique.mockResolvedValue({ value: "0" });
    expect(await getEditorialV2OnMaxPerRun()).toBe(0);
  });

  it("parses a normal integer", async () => {
    mockFindUnique.mockResolvedValue({ value: "5" });
    expect(await getEditorialV2OnMaxPerRun()).toBe(5);
  });

  it("clamps above the ceiling (10)", async () => {
    mockFindUnique.mockResolvedValue({ value: "999" });
    expect(await getEditorialV2OnMaxPerRun()).toBe(10);
  });

  it("floors negatives at 0", async () => {
    mockFindUnique.mockResolvedValue({ value: "-3" });
    expect(await getEditorialV2OnMaxPerRun()).toBe(0);
  });

  it("falls back to default on non-numeric value", async () => {
    mockFindUnique.mockResolvedValue({ value: "abc" });
    expect(await getEditorialV2OnMaxPerRun()).toBe(DEFAULT_EDITORIAL_V2_ON_MAX_PER_RUN);
  });

  it("falls back to default on DB error", async () => {
    mockFindUnique.mockRejectedValue(new Error("db down"));
    expect(await getEditorialV2OnMaxPerRun()).toBe(DEFAULT_EDITORIAL_V2_ON_MAX_PER_RUN);
  });
});

describe("getEditorialV2GateMode (A5-lite quality gate)", () => {
  it("defaults to off when no row exists", async () => {
    mockFindUnique.mockResolvedValue(null);
    expect(await getEditorialV2GateMode()).toBe("off");
  });
  it("parses shadow", async () => {
    mockFindUnique.mockResolvedValue({ value: "shadow" });
    expect(await getEditorialV2GateMode()).toBe("shadow");
  });
  it("parses enforce (reserved; phase 1 treats as shadow at the route)", async () => {
    mockFindUnique.mockResolvedValue({ value: "enforce" });
    expect(await getEditorialV2GateMode()).toBe("enforce");
  });
  it("is case-insensitive and trims", async () => {
    mockFindUnique.mockResolvedValue({ value: "  SHADOW  " });
    expect(await getEditorialV2GateMode()).toBe("shadow");
  });
  it("fails safe to off on an unknown value", async () => {
    mockFindUnique.mockResolvedValue({ value: "blcok" });
    expect(await getEditorialV2GateMode()).toBe("off");
  });
  it("fails safe to off on explicit 'off'", async () => {
    mockFindUnique.mockResolvedValue({ value: "off" });
    expect(await getEditorialV2GateMode()).toBe("off");
  });
  it("fails safe to off on DB error", async () => {
    mockFindUnique.mockRejectedValue(new Error("db down"));
    expect(await getEditorialV2GateMode()).toBe("off");
  });
});
