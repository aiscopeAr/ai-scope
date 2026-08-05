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

describe("resolveDistributionTargets — no-backfill guard (activatedAt)", () => {
  const activatedAt = "2026-08-05T12:00:00.000Z";

  it("excludes a target when the content's timestamp predates the target's activatedAt", () => {
    const targets = [buildTarget({ config: { mode: "automatic", activatedAt } })];
    const contentTimestamp = new Date("2026-08-05T11:59:59.000Z"); // 1 second before activation
    const result = resolveDistributionTargets({ contentType: "review", contentTimestamp }, targets);
    expect(result).toEqual([]);
  });

  it("includes a target when the content's timestamp is at or after activatedAt", () => {
    const targets = [buildTarget({ config: { mode: "automatic", activatedAt } })];
    const contentTimestamp = new Date("2026-08-05T12:00:01.000Z"); // 1 second after activation
    const result = resolveDistributionTargets({ contentType: "review", contentTimestamp }, targets);
    expect(result).toEqual(targets);
  });

  it("includes a target at the exact activatedAt instant (boundary is inclusive)", () => {
    const targets = [buildTarget({ config: { mode: "automatic", activatedAt } })];
    const contentTimestamp = new Date(activatedAt);
    const result = resolveDistributionTargets({ contentType: "review", contentTimestamp }, targets);
    expect(result).toEqual(targets);
  });

  it("never excludes a target with no activatedAt set — the guard is additive, not required", () => {
    const targets = [buildTarget({ config: { mode: "automatic" } })];
    const contentTimestamp = new Date("2000-01-01T00:00:00.000Z"); // arbitrarily old
    const result = resolveDistributionTargets({ contentType: "review", contentTimestamp }, targets);
    expect(result).toEqual(targets);
  });

  it("never excludes anything when the caller omits contentTimestamp entirely (opt-in check)", () => {
    const targets = [buildTarget({ config: { mode: "automatic", activatedAt } })];
    const result = resolveDistributionTargets({ contentType: "review" }, targets);
    expect(result).toEqual(targets);
  });

  it("proves the concrete no-backfill scenario: an old Review is excluded, a newly-approved one is included, for the same target", () => {
    const target = buildTarget({ config: { mode: "automatic", activatedAt } });
    const oldReviewTimestamp = new Date("2026-08-05T09:46:27.090Z"); // approved before activation
    const newReviewTimestamp = new Date("2026-08-05T13:00:00.000Z"); // approved after activation

    expect(resolveDistributionTargets({ contentType: "review", contentTimestamp: oldReviewTimestamp }, [target])).toEqual([]);
    expect(resolveDistributionTargets({ contentType: "review", contentTimestamp: newReviewTimestamp }, [target])).toEqual([target]);
  });

  it("combines correctly with the categoryFilter check — both must pass", () => {
    const target = buildTarget({ config: { mode: "automatic", activatedAt, categoryFilter: ["ai-news"] } });
    const afterActivation = new Date("2026-08-05T13:00:00.000Z");

    // Right time, wrong category -> excluded.
    expect(resolveDistributionTargets({ contentType: "review", category: "opinion", contentTimestamp: afterActivation }, [target])).toEqual([]);
    // Right time, right category -> included.
    expect(resolveDistributionTargets({ contentType: "review", category: "ai-news", contentTimestamp: afterActivation }, [target])).toEqual([target]);
    // Right category, wrong (too old) time -> excluded.
    const beforeActivation = new Date("2026-08-05T09:00:00.000Z");
    expect(resolveDistributionTargets({ contentType: "review", category: "ai-news", contentTimestamp: beforeActivation }, [target])).toEqual([]);
  });
});
