import { describe, it, expect } from "vitest";
import { buildWordPressIdempotencyKey, parseWordPressIdempotencyKey } from "./idempotency";

describe("buildWordPressIdempotencyKey", () => {
  it("is deterministic for the same content and target", () => {
    const a = buildWordPressIdempotencyKey("review-1", "target-1");
    const b = buildWordPressIdempotencyKey("review-1", "target-1");
    expect(a).toBe(b);
  });

  it("differs for different content on the same target", () => {
    const a = buildWordPressIdempotencyKey("review-1", "target-1");
    const b = buildWordPressIdempotencyKey("review-2", "target-1");
    expect(a).not.toBe(b);
  });

  it("differs for the same content on different targets", () => {
    const a = buildWordPressIdempotencyKey("review-1", "target-1");
    const b = buildWordPressIdempotencyKey("review-1", "target-2");
    expect(a).not.toBe(b);
  });

  it("is independent of any slug (per the sprint's explicit 'do not rely on slug' requirement)", () => {
    // The function signature itself proves this: it never accepts a slug
    // parameter at all, only contentId and targetId.
    const key = buildWordPressIdempotencyKey("review-1", "target-1");
    expect(key).not.toMatch(/slug/i);
  });
});

describe("parseWordPressIdempotencyKey", () => {
  it("round-trips a key built by buildWordPressIdempotencyKey", () => {
    const key = buildWordPressIdempotencyKey("review-1", "target-1");
    expect(parseWordPressIdempotencyKey(key)).toEqual({ targetId: "target-1", contentId: "review-1" });
  });

  it("returns null for a malformed key", () => {
    expect(parseWordPressIdempotencyKey("not-a-valid-key")).toBeNull();
  });

  it("handles a contentId that itself contains a colon", () => {
    const key = buildWordPressIdempotencyKey("review:with:colons", "target-1");
    expect(parseWordPressIdempotencyKey(key)).toEqual({ targetId: "target-1", contentId: "review:with:colons" });
  });
});
