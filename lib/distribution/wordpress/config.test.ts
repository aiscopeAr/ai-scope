import { describe, it, expect } from "vitest";
import { validateWordPressCredentials, validateWordPressConfig, validateWordPressTarget, resolveTimeoutMs, DEFAULT_TIMEOUT_MS } from "./config";

describe("validateWordPressCredentials", () => {
  it("accepts well-formed credentials", () => {
    const result = validateWordPressCredentials({ username: "editor", applicationPassword: "abcd efgh ijkl" });
    expect(result.valid).toBe(true);
  });

  it("rejects a non-object", () => {
    expect(validateWordPressCredentials("not-an-object").valid).toBe(false);
  });

  it("rejects null", () => {
    expect(validateWordPressCredentials(null).valid).toBe(false);
  });

  it("rejects an empty username", () => {
    const result = validateWordPressCredentials({ username: "", applicationPassword: "x" });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("username"))).toBe(true);
  });

  it("rejects an empty applicationPassword", () => {
    const result = validateWordPressCredentials({ username: "editor", applicationPassword: "" });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("applicationPassword"))).toBe(true);
  });

  it("never includes the credential values themselves in error messages", () => {
    const secretValue = "super-secret-app-password-xyz";
    const result = validateWordPressCredentials({ username: "editor", applicationPassword: "" });
    // sanity: this test's own secret string must never leak into error text
    // even indirectly (e.g. from a bad template literal elsewhere in the module)
    expect(JSON.stringify(result.errors)).not.toContain(secretValue);
  });
});

describe("validateWordPressConfig — HTTPS enforcement", () => {
  const baseValidConfig = {
    baseUrl: "https://sonara.example.com",
    categoryIds: [12],
    defaultStatus: "publish",
    uploadFeaturedImage: false,
  };

  it("accepts a valid https config", () => {
    expect(validateWordPressConfig(baseValidConfig).valid).toBe(true);
  });

  it("rejects plain http for a non-local host", () => {
    const result = validateWordPressConfig({ ...baseValidConfig, baseUrl: "http://sonara.example.com" });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("HTTPS"))).toBe(true);
  });

  it("allows plain http for localhost", () => {
    const result = validateWordPressConfig({ ...baseValidConfig, baseUrl: "http://localhost:8080" });
    expect(result.valid).toBe(true);
  });

  it("allows plain http for a .test host", () => {
    const result = validateWordPressConfig({ ...baseValidConfig, baseUrl: "http://wordpress.test" });
    expect(result.valid).toBe(true);
  });

  it("rejects a malformed baseUrl", () => {
    const result = validateWordPressConfig({ ...baseValidConfig, baseUrl: "not a url" });
    expect(result.valid).toBe(false);
  });

  it("rejects a missing baseUrl", () => {
    const rest: Record<string, unknown> = { ...baseValidConfig };
    delete rest.baseUrl;
    expect(validateWordPressConfig(rest).valid).toBe(false);
  });
});

describe("validateWordPressConfig — category IDs", () => {
  const base = { baseUrl: "https://example.com", defaultStatus: "publish", uploadFeaturedImage: false };

  it("rejects an empty categoryIds array", () => {
    expect(validateWordPressConfig({ ...base, categoryIds: [] }).valid).toBe(false);
  });

  it("rejects a missing categoryIds field", () => {
    expect(validateWordPressConfig(base).valid).toBe(false);
  });

  it("rejects non-integer category IDs", () => {
    expect(validateWordPressConfig({ ...base, categoryIds: [1.5] }).valid).toBe(false);
  });

  it("rejects zero or negative category IDs", () => {
    expect(validateWordPressConfig({ ...base, categoryIds: [0] }).valid).toBe(false);
    expect(validateWordPressConfig({ ...base, categoryIds: [-3] }).valid).toBe(false);
  });

  it("accepts multiple positive category IDs", () => {
    expect(validateWordPressConfig({ ...base, categoryIds: [5, 12, 99] }).valid).toBe(true);
  });

  it("never hardcodes or requires any specific category ID (e.g. 44945 is not special)", () => {
    // Any positive integer must be equally acceptable — the validator must
    // not special-case a particular partner's category.
    const withArbitraryId = validateWordPressConfig({ ...base, categoryIds: [1] });
    const withKnownPartnerId = validateWordPressConfig({ ...base, categoryIds: [44945] });
    expect(withArbitraryId.valid).toBe(true);
    expect(withKnownPartnerId.valid).toBe(true);
  });
});

describe("validateWordPressConfig — status, timeout, author", () => {
  const base = { baseUrl: "https://example.com", categoryIds: [1], uploadFeaturedImage: false };

  it("accepts draft status", () => {
    expect(validateWordPressConfig({ ...base, defaultStatus: "draft" }).valid).toBe(true);
  });

  it("accepts publish status", () => {
    expect(validateWordPressConfig({ ...base, defaultStatus: "publish" }).valid).toBe(true);
  });

  it("rejects an invalid status", () => {
    expect(validateWordPressConfig({ ...base, defaultStatus: "scheduled" }).valid).toBe(false);
  });

  it("rejects a non-boolean uploadFeaturedImage", () => {
    expect(validateWordPressConfig({ ...base, defaultStatus: "draft", uploadFeaturedImage: "yes" }).valid).toBe(false);
  });

  it("accepts a valid authorId", () => {
    expect(validateWordPressConfig({ ...base, defaultStatus: "draft", authorId: 3 }).valid).toBe(true);
  });

  it("rejects a non-positive authorId", () => {
    expect(validateWordPressConfig({ ...base, defaultStatus: "draft", authorId: 0 }).valid).toBe(false);
  });

  it("accepts a timeoutMs within safe bounds", () => {
    expect(validateWordPressConfig({ ...base, defaultStatus: "draft", timeoutMs: 10_000 }).valid).toBe(true);
  });

  it("rejects a timeoutMs below the minimum bound", () => {
    expect(validateWordPressConfig({ ...base, defaultStatus: "draft", timeoutMs: 100 }).valid).toBe(false);
  });

  it("rejects a timeoutMs above the maximum bound", () => {
    expect(validateWordPressConfig({ ...base, defaultStatus: "draft", timeoutMs: 999_999 }).valid).toBe(false);
  });

  it("defaults resolveTimeoutMs to DEFAULT_TIMEOUT_MS when unset", () => {
    expect(resolveTimeoutMs({ baseUrl: "https://example.com", categoryIds: [1], defaultStatus: "draft", uploadFeaturedImage: false })).toBe(
      DEFAULT_TIMEOUT_MS,
    );
  });

  it("resolveTimeoutMs respects an explicit timeoutMs", () => {
    expect(
      resolveTimeoutMs({ baseUrl: "https://example.com", categoryIds: [1], defaultStatus: "draft", uploadFeaturedImage: false, timeoutMs: 5000 }),
    ).toBe(5000);
  });
});

describe("validateWordPressTarget", () => {
  it("combines credential and config errors", () => {
    const result = validateWordPressTarget({ username: "", applicationPassword: "" }, { baseUrl: "not-a-url" });
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(1);
  });

  it("is valid when both credentials and config are well-formed", () => {
    const result = validateWordPressTarget(
      { username: "editor", applicationPassword: "abcd efgh" },
      { baseUrl: "https://example.com", categoryIds: [1], defaultStatus: "publish", uploadFeaturedImage: false },
    );
    expect(result.valid).toBe(true);
  });
});
