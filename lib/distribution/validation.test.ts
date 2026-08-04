import { describe, it, expect } from "vitest";
import { validateTarget, validateTargetConfig, isTargetActive, matchesCategoryFilter } from "./validation";
import type { DistributionTarget, DistributionTargetConfig } from "./types";

function buildTarget(overrides: Partial<DistributionTarget> = {}): DistributionTarget {
  return {
    id: "target-1",
    name: "Test Target",
    targetType: "wordpress",
    enabled: true,
    credentials: { apiKey: "secret" },
    config: { mode: "automatic" },
    ...overrides,
  };
}

describe("validateTargetConfig", () => {
  it("accepts a minimal valid config", () => {
    expect(validateTargetConfig({ mode: "automatic" }).valid).toBe(true);
  });

  it("rejects an invalid mode", () => {
    const result = validateTargetConfig({ mode: "auto" as unknown as DistributionTargetConfig["mode"] });
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/mode/);
  });

  it("rejects a non-array categoryFilter", () => {
    const result = validateTargetConfig({ mode: "manual", categoryFilter: "news" as unknown as string[] });
    expect(result.valid).toBe(false);
  });

  it("rejects a categoryFilter containing an empty string", () => {
    const result = validateTargetConfig({ mode: "manual", categoryFilter: ["news", ""] });
    expect(result.valid).toBe(false);
  });

  it("accepts a populated categoryFilter", () => {
    expect(validateTargetConfig({ mode: "manual", categoryFilter: ["ai-news", "reviews"] }).valid).toBe(true);
  });
});

describe("validateTarget", () => {
  it("accepts a well-formed target", () => {
    expect(validateTarget(buildTarget()).valid).toBe(true);
  });

  it("rejects a missing id", () => {
    expect(validateTarget(buildTarget({ id: "" })).valid).toBe(false);
  });

  it("rejects a missing name", () => {
    expect(validateTarget(buildTarget({ name: "  " })).valid).toBe(false);
  });

  it("rejects a missing targetType", () => {
    expect(validateTarget(buildTarget({ targetType: "" })).valid).toBe(false);
  });

  it("rejects a non-boolean enabled", () => {
    expect(validateTarget(buildTarget({ enabled: "yes" as unknown as boolean })).valid).toBe(false);
  });

  it("rejects null credentials", () => {
    expect(validateTarget(buildTarget({ credentials: null as unknown as Record<string, unknown> })).valid).toBe(false);
  });

  it("bubbles up config errors with the config's own error text", () => {
    const result = validateTarget(buildTarget({ config: { mode: "bad" as unknown as DistributionTargetConfig["mode"] } }));
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("config.mode"))).toBe(true);
  });

  it("does not validate credentials contents (per-targetType concern, not this foundation's)", () => {
    expect(validateTarget(buildTarget({ credentials: {} })).valid).toBe(true);
  });
});

describe("isTargetActive", () => {
  it("is true for an enabled, valid target", () => {
    expect(isTargetActive(buildTarget())).toBe(true);
  });

  it("is false for a disabled target", () => {
    expect(isTargetActive(buildTarget({ enabled: false }))).toBe(false);
  });

  it("is false for an enabled but structurally invalid target", () => {
    expect(isTargetActive(buildTarget({ enabled: true, name: "" }))).toBe(false);
  });
});

describe("matchesCategoryFilter", () => {
  it("accepts any category when no filter is set", () => {
    expect(matchesCategoryFilter({ mode: "automatic" }, "anything")).toBe(true);
  });

  it("accepts any category when the filter is an empty array", () => {
    expect(matchesCategoryFilter({ mode: "automatic", categoryFilter: [] }, "anything")).toBe(true);
  });

  it("accepts a category present in the filter", () => {
    expect(matchesCategoryFilter({ mode: "automatic", categoryFilter: ["ai-news"] }, "ai-news")).toBe(true);
  });

  it("rejects a category absent from the filter", () => {
    expect(matchesCategoryFilter({ mode: "automatic", categoryFilter: ["ai-news"] }, "opinion")).toBe(false);
  });

  it("rejects an undefined category when a filter is set", () => {
    expect(matchesCategoryFilter({ mode: "automatic", categoryFilter: ["ai-news"] }, undefined)).toBe(false);
  });
});
