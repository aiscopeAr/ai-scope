import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  normalizeGa4PropertyId,
  resolveGa4PropertyId,
  classifyGa4Access,
  Ga4ConfigError,
} from "./ga4-property";

describe("normalizeGa4PropertyId", () => {
  it("1. numeric id", () => {
    expect(normalizeGa4PropertyId("538064799")).toEqual({ numericId: "538064799", resourceName: "properties/538064799" });
  });
  it("2. properties/<number> id", () => {
    expect(normalizeGa4PropertyId("properties/538064799")).toEqual({ numericId: "538064799", resourceName: "properties/538064799" });
  });
  it("tolerates whitespace", () => {
    expect(normalizeGa4PropertyId("  properties/538064799 ").numericId).toBe("538064799");
  });
  it("3. missing → MISSING_PROPERTY_ID", () => {
    for (const v of ["", "   ", undefined, null]) {
      try { normalizeGa4PropertyId(v as string); throw new Error("no throw"); }
      catch (e) { expect((e as Ga4ConfigError).code).toBe("MISSING_PROPERTY_ID"); }
    }
  });
  it("4. malformed → MALFORMED_PROPERTY_ID", () => {
    for (const v of ["abc", "properties/abc", "prop/123", "538064799x", "properties/"]) {
      try { normalizeGa4PropertyId(v); throw new Error(`no throw for ${v}`); }
      catch (e) { expect(e).toBeInstanceOf(Ga4ConfigError); expect((e as Ga4ConfigError).code).toBe("MALFORMED_PROPERTY_ID"); }
    }
  });
});

describe("resolveGa4PropertyId (canonical GA_PROPERTY_ID, legacy GA4_PROPERTY_ID)", () => {
  it("5. canonical GA_PROPERTY_ID only", () => {
    const r = resolveGa4PropertyId({ GA_PROPERTY_ID: "538064799" });
    expect(r.numericId).toBe("538064799");
    expect(r.resourceName).toBe("properties/538064799");
    expect(r.sourceKey).toBe("GA_PROPERTY_ID");
    expect(r.bothPresent).toBe(false);
  });
  it("6. legacy GA4_PROPERTY_ID only (alias)", () => {
    const r = resolveGa4PropertyId({ GA4_PROPERTY_ID: "properties/538064799" });
    expect(r.numericId).toBe("538064799");
    expect(r.sourceKey).toBe("GA4_PROPERTY_ID");
  });
  it("7. both set, same id → OK, canonical source", () => {
    const r = resolveGa4PropertyId({ GA_PROPERTY_ID: "538064799", GA4_PROPERTY_ID: "properties/538064799" });
    expect(r.numericId).toBe("538064799");
    expect(r.sourceKey).toBe("GA_PROPERTY_ID");
    expect(r.bothPresent).toBe(true);
  });
  it("8. both set, different ids → CONFLICTING_PROPERTY_IDS (fail closed)", () => {
    try {
      resolveGa4PropertyId({ GA_PROPERTY_ID: "538064799", GA4_PROPERTY_ID: "111111111" });
      throw new Error("expected conflict throw");
    } catch (e) {
      expect(e).toBeInstanceOf(Ga4ConfigError);
      expect((e as Ga4ConfigError).code).toBe("CONFLICTING_PROPERTY_IDS");
    }
  });
  it("missing both → MISSING_PROPERTY_ID", () => {
    try { resolveGa4PropertyId({}); throw new Error("no throw"); }
    catch (e) { expect((e as Ga4ConfigError).code).toBe("MISSING_PROPERTY_ID"); }
  });
});

describe("classifyGa4Access (direct request is source of truth)", () => {
  it("9. empty account summaries + direct OK → PROPERTY_LEVEL_ACCESS_OK", () => {
    // account-summary emptiness is intentionally not even an input.
    expect(classifyGa4Access({ propertyIdConfigured: true, direct: { ok: true } }).code).toBe("PROPERTY_LEVEL_ACCESS_OK");
  });
  it("10. direct 403 → PERMISSION_DENIED", () => {
    expect(classifyGa4Access({ propertyIdConfigured: true, direct: { ok: false, status: 403 } }).code).toBe("PERMISSION_DENIED");
  });
  it("11. direct 404 → INVALID_PROPERTY_ID", () => {
    expect(classifyGa4Access({ propertyIdConfigured: true, direct: { ok: false, status: 404 } }).code).toBe("INVALID_PROPERTY_ID");
  });
  it("12. API disabled → API_DISABLED", () => {
    expect(classifyGa4Access({ propertyIdConfigured: true, direct: { ok: false, status: 403, apiDisabled: true } }).code).toBe("API_DISABLED");
  });
  it("13. unknown failure → UNKNOWN_ERROR", () => {
    expect(classifyGa4Access({ propertyIdConfigured: true, direct: { ok: false, status: 500 } }).code).toBe("UNKNOWN_ERROR");
  });
  it("config errors map to verdicts (missing/conflict/malformed)", () => {
    expect(classifyGa4Access({ propertyIdConfigured: false, configError: "MISSING_PROPERTY_ID" }).code).toBe("MISSING_PROPERTY_ID");
    expect(classifyGa4Access({ propertyIdConfigured: false, configError: "CONFLICTING_PROPERTY_IDS" }).code).toBe("CONFLICTING_PROPERTY_IDS");
    expect(classifyGa4Access({ propertyIdConfigured: false, configError: "MALFORMED_PROPERTY_ID" }).code).toBe("INVALID_PROPERTY_ID");
  });
});

describe("14. no secret leakage", () => {
  const FAKE_KEY = "-----BEGIN PRIVATE KEY-----FAKESECRET-----END PRIVATE KEY-----";
  it("errors and messages never contain credential material", () => {
    let msg = "";
    try { resolveGa4PropertyId({}); } catch (e) { msg = (e as Error).message; }
    try { resolveGa4PropertyId({ GA_PROPERTY_ID: "1", GA4_PROPERTY_ID: "2" }); } catch (e) { msg += " " + (e as Error).message; }
    expect(msg).not.toContain(FAKE_KEY);
    expect(msg).not.toMatch(/PRIVATE KEY|BEGIN/);
    for (const input of [
      { propertyIdConfigured: false, configError: "CONFLICTING_PROPERTY_IDS" as const },
      { propertyIdConfigured: true, direct: { ok: false, status: 403 } },
      { propertyIdConfigured: true, direct: { ok: true } },
    ]) {
      const m = classifyGa4Access(input).message;
      expect(m).not.toContain(FAKE_KEY);
      expect(m).not.toMatch(/PRIVATE KEY|BEGIN/);
    }
  });
});

describe("15. real audit entrypoint wiring", () => {
  it("scripts/verify-ga4-access.ts consumes the shared resolver and classifier", () => {
    const src = readFileSync(resolve(__dirname, "../scripts/verify-ga4-access.ts"), "utf8");
    expect(src).toContain("resolveGa4PropertyId");
    expect(src).toContain("classifyGa4Access");
    expect(src).toMatch(/ga4-property/);
  });
});
