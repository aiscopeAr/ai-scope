import { describe, it, expect } from "vitest";
import { buildSonaraUpsertInput, requireEnv, SONARA_TARGET_NAME, SONARA_PARTNER_ID } from "./setup-sonara-target";

function baseEnv(overrides: Record<string, string | undefined> = {}): NodeJS.ProcessEnv {
  return {
    SONARA_WORDPRESS_BASE_URL: "https://sonara.net",
    SONARA_WORDPRESS_USERNAME: "editor",
    SONARA_WORDPRESS_APPLICATION_PASSWORD: "abcd 1234 efgh 5678",
    SONARA_WORDPRESS_CATEGORY_ID: "44945",
    ...overrides,
  } as NodeJS.ProcessEnv;
}

describe("requireEnv", () => {
  it("returns the value when set", () => {
    expect(requireEnv({ FOO: "bar" } as NodeJS.ProcessEnv, "FOO")).toBe("bar");
  });

  it("throws when unset", () => {
    expect(() => requireEnv({} as NodeJS.ProcessEnv, "FOO")).toThrow(/FOO is not set/);
  });

  it("throws when set to an empty/whitespace string", () => {
    expect(() => requireEnv({ FOO: "   " } as NodeJS.ProcessEnv, "FOO")).toThrow(/FOO is not set/);
  });
});

describe("buildSonaraUpsertInput", () => {
  it("throws when a required env var is missing (e.g. no credentials configured at all)", () => {
    expect(() => buildSonaraUpsertInput({} as NodeJS.ProcessEnv)).toThrow(/SONARA_WORDPRESS_BASE_URL is not set/);
  });

  it("defaults enabled to false (dark launch) when SONARA_WORDPRESS_ENABLED is unset", () => {
    const input = buildSonaraUpsertInput(baseEnv());
    expect(input.enabled).toBe(false);
  });

  it("enables only when SONARA_WORDPRESS_ENABLED is exactly 'true'", () => {
    expect(buildSonaraUpsertInput(baseEnv({ SONARA_WORDPRESS_ENABLED: "true" })).enabled).toBe(true);
    expect(buildSonaraUpsertInput(baseEnv({ SONARA_WORDPRESS_ENABLED: "yes" })).enabled).toBe(false);
    expect(buildSonaraUpsertInput(baseEnv({ SONARA_WORDPRESS_ENABLED: "1" })).enabled).toBe(false);
  });

  it("uses the fixed target name 'Sonara' and targetType 'wordpress'", () => {
    const input = buildSonaraUpsertInput(baseEnv());
    expect(input.name).toBe(SONARA_TARGET_NAME);
    expect(input.targetType).toBe("wordpress");
  });

  it("sets config.partnerId to the deterministic, lowercase normalization of the target name ('sonara')", () => {
    const input = buildSonaraUpsertInput(baseEnv());
    expect(input.config.partnerId).toBe("sonara");
    expect(SONARA_PARTNER_ID).toBe("sonara");
  });

  it("defaults defaultStatus to 'draft' when SONARA_WORDPRESS_DEFAULT_STATUS is unset — a target must opt into publish explicitly, never by omission", () => {
    const input = buildSonaraUpsertInput(baseEnv());
    const extra = input.config.extra as Record<string, unknown>;
    expect(extra.defaultStatus).toBe("draft");
  });

  it("respects an explicit SONARA_WORDPRESS_DEFAULT_STATUS=publish", () => {
    const input = buildSonaraUpsertInput(baseEnv({ SONARA_WORDPRESS_DEFAULT_STATUS: "publish" }));
    expect((input.config.extra as Record<string, unknown>).defaultStatus).toBe("publish");
  });

  it("respects an explicit SONARA_WORDPRESS_DEFAULT_STATUS=draft", () => {
    const input = buildSonaraUpsertInput(baseEnv({ SONARA_WORDPRESS_DEFAULT_STATUS: "draft" }));
    expect((input.config.extra as Record<string, unknown>).defaultStatus).toBe("draft");
  });

  it("throws for an invalid SONARA_WORDPRESS_DEFAULT_STATUS value", () => {
    expect(() => buildSonaraUpsertInput(baseEnv({ SONARA_WORDPRESS_DEFAULT_STATUS: "scheduled" }))).toThrow(/must be "draft" or "publish"/);
  });

  it("defaults uploadFeaturedImage to true when SONARA_WORDPRESS_UPLOAD_FEATURED_IMAGE is unset", () => {
    const input = buildSonaraUpsertInput(baseEnv());
    expect((input.config.extra as Record<string, unknown>).uploadFeaturedImage).toBe(true);
  });

  it("disables uploadFeaturedImage only when SONARA_WORDPRESS_UPLOAD_FEATURED_IMAGE is exactly 'false'", () => {
    expect((buildSonaraUpsertInput(baseEnv({ SONARA_WORDPRESS_UPLOAD_FEATURED_IMAGE: "false" })).config.extra as Record<string, unknown>).uploadFeaturedImage).toBe(false);
    expect((buildSonaraUpsertInput(baseEnv({ SONARA_WORDPRESS_UPLOAD_FEATURED_IMAGE: "true" })).config.extra as Record<string, unknown>).uploadFeaturedImage).toBe(true);
  });

  it("maps SONARA_WORDPRESS_CATEGORY_ID into a single-element categoryIds array", () => {
    const input = buildSonaraUpsertInput(baseEnv({ SONARA_WORDPRESS_CATEGORY_ID: "44945" }));
    expect((input.config.extra as Record<string, unknown>).categoryIds).toEqual([44945]);
  });

  it("throws for a non-numeric category ID", () => {
    expect(() => buildSonaraUpsertInput(baseEnv({ SONARA_WORDPRESS_CATEGORY_ID: "not-a-number" }))).toThrow(/positive integer/);
  });

  it("throws for a zero or negative category ID", () => {
    expect(() => buildSonaraUpsertInput(baseEnv({ SONARA_WORDPRESS_CATEGORY_ID: "0" }))).toThrow(/positive integer/);
  });

  it("throws when the resulting config fails WordPress validation (e.g. non-https base URL)", () => {
    expect(() => buildSonaraUpsertInput(baseEnv({ SONARA_WORDPRESS_BASE_URL: "http://sonara.net" }))).toThrow(/Refusing to create\/update/);
  });

  it("never includes the raw credential values in a thrown validation error message", () => {
    try {
      buildSonaraUpsertInput(baseEnv({ SONARA_WORDPRESS_CATEGORY_ID: "-1" }));
      expect.fail("expected buildSonaraUpsertInput to throw");
    } catch (err) {
      expect(String(err)).not.toContain("abcd 1234 efgh 5678");
    }
  });

  it("includes optional authorId and timeoutMs only when explicitly set", () => {
    const withoutOptional = buildSonaraUpsertInput(baseEnv());
    expect(withoutOptional.config.extra).not.toHaveProperty("authorId");
    expect(withoutOptional.config.extra).not.toHaveProperty("timeoutMs");

    const withOptional = buildSonaraUpsertInput(baseEnv({ SONARA_WORDPRESS_AUTHOR_ID: "7", SONARA_WORDPRESS_TIMEOUT_MS: "20000" }));
    expect((withOptional.config.extra as Record<string, unknown>).authorId).toBe(7);
    expect((withOptional.config.extra as Record<string, unknown>).timeoutMs).toBe(20000);
  });

  it("passes the real credential values through to the returned input (not redacted here — redaction happens at read/log boundaries only)", () => {
    const input = buildSonaraUpsertInput(baseEnv());
    expect(input.credentials).toEqual({ username: "editor", applicationPassword: "abcd 1234 efgh 5678" });
  });
});
