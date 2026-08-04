import { describe, it, expect } from "vitest";
import { resolveDistributionTargets } from "./resolution";
import type { DistributionTarget } from "./types";

function buildTarget(overrides: Partial<DistributionTarget> = {}): DistributionTarget {
  return {
    id: "target-1",
    name: "Test Target",
    targetType: "wordpress",
    enabled: true,
    credentials: { username: "u", applicationPassword: "p" },
    config: { mode: "automatic" },
    ...overrides,
  };
}

describe("resolveDistributionTargets", () => {
  it("selects an enabled target with no category filter regardless of content category", () => {
    const targets = [buildTarget()];
    const result = resolveDistributionTargets({ contentType: "review", category: "anything" }, targets);
    expect(result).toEqual(targets);
  });

  it("excludes a disabled target", () => {
    const targets = [buildTarget({ enabled: false })];
    const result = resolveDistributionTargets({ contentType: "review", category: "ai-news" }, targets);
    expect(result).toEqual([]);
  });

  it("excludes a structurally invalid target even if enabled", () => {
    const targets = [buildTarget({ enabled: true, name: "" })];
    const result = resolveDistributionTargets({ contentType: "review", category: "ai-news" }, targets);
    expect(result).toEqual([]);
  });

  it("includes a target whose categoryFilter matches the content's category", () => {
    const targets = [buildTarget({ config: { mode: "automatic", categoryFilter: ["ai-news", "reviews"] } })];
    const result = resolveDistributionTargets({ contentType: "review", category: "ai-news" }, targets);
    expect(result).toEqual(targets);
  });

  it("excludes a target whose categoryFilter does not match the content's category", () => {
    const targets = [buildTarget({ config: { mode: "automatic", categoryFilter: ["opinion"] } })];
    const result = resolveDistributionTargets({ contentType: "review", category: "ai-news" }, targets);
    expect(result).toEqual([]);
  });

  it("excludes a category-filtered target when the content has no category at all", () => {
    const targets = [buildTarget({ config: { mode: "automatic", categoryFilter: ["ai-news"] } })];
    const result = resolveDistributionTargets({ contentType: "review" }, targets);
    expect(result).toEqual([]);
  });

  it("resolves multiple targets independently — matches some, excludes others", () => {
    const matching = buildTarget({ id: "t1", config: { mode: "automatic", categoryFilter: ["ai-news"] } });
    const nonMatching = buildTarget({ id: "t2", config: { mode: "automatic", categoryFilter: ["opinion"] } });
    const disabled = buildTarget({ id: "t3", enabled: false });

    const result = resolveDistributionTargets({ contentType: "review", category: "ai-news" }, [matching, nonMatching, disabled]);

    expect(result.map((t) => t.id)).toEqual(["t1"]);
  });

  it("returns an empty array for an empty candidate list", () => {
    expect(resolveDistributionTargets({ contentType: "review", category: "ai-news" }, [])).toEqual([]);
  });

  it("does not hardcode or special-case any specific targetType", () => {
    const ghostTarget = buildTarget({ targetType: "ghost" });
    const wordpressTarget = buildTarget({ id: "t2", targetType: "wordpress" });
    const result = resolveDistributionTargets({ contentType: "review", category: undefined }, [ghostTarget, wordpressTarget]);
    expect(result.map((t) => t.targetType).sort()).toEqual(["ghost", "wordpress"]);
  });
});
