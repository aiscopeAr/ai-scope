/**
 * lib/ga4-property.ts
 *
 * Single, tested normalization + access-classification path for the GA4
 * Property ID used by audit/verification tooling. Prevents two recurring bugs:
 *
 *  1. Hardcoding the property id (e.g. "properties/538064799") in scripts.
 *  2. Treating an empty `accountSummaries.list` response as proof that the
 *     service account has no GA4 access. A service account granted only
 *     PROPERTY-LEVEL Viewer legitimately returns zero account summaries yet
 *     can still read the property directly. The DIRECT property request is the
 *     source of truth — see classifyGa4Access().
 *
 * Environment convention:
 *   - GA_PROPERTY_ID   → CANONICAL (matches the production client lib/ga4.ts).
 *   - GA4_PROPERTY_ID  → accepted LEGACY alias.
 *   - Both set, same normalized id → OK (reports canonical source).
 *   - Both set, different ids      → fail closed (CONFLICTING_PROPERTY_IDS).
 *
 * Never logs or embeds credentials/tokens in errors.
 */

/** Canonical first, legacy alias second. */
export const GA4_PROPERTY_CANONICAL_KEY = "GA_PROPERTY_ID" as const;
export const GA4_PROPERTY_LEGACY_KEY = "GA4_PROPERTY_ID" as const;

export type Ga4ConfigCode =
  | "MISSING_PROPERTY_ID"
  | "MALFORMED_PROPERTY_ID"
  | "CONFLICTING_PROPERTY_IDS";

/** Configuration error carrying a stable, sanitized code (no secrets). */
export class Ga4ConfigError extends Error {
  code: Ga4ConfigCode;
  constructor(code: Ga4ConfigCode, message: string) {
    super(message);
    this.name = "Ga4ConfigError";
    this.code = code;
  }
}

export interface Ga4PropertyId {
  /** Bare numeric id, e.g. "538064799" — for APIs that want the number. */
  numericId: string;
  /** Resource name, e.g. "properties/538064799" — for Data/Admin API calls. */
  resourceName: string;
}

/**
 * Accepts "538064799" or "properties/538064799" (with surrounding whitespace)
 * and returns both canonical forms. Throws Ga4ConfigError on empty/malformed
 * input — never silently substitutes another property.
 */
export function normalizeGa4PropertyId(raw: string | null | undefined): Ga4PropertyId {
  const trimmed = (raw ?? "").trim();
  if (!trimmed) {
    throw new Ga4ConfigError("MISSING_PROPERTY_ID", "GA4 property id is empty.");
  }
  const numericId = trimmed.startsWith("properties/") ? trimmed.slice("properties/".length) : trimmed;
  if (!/^\d+$/.test(numericId)) {
    throw new Ga4ConfigError(
      "MALFORMED_PROPERTY_ID",
      `GA4 property id must be numeric or "properties/<number>"; got "${trimmed}".`,
    );
  }
  return { numericId, resourceName: `properties/${numericId}` };
}

export interface ResolvedGa4PropertyId extends Ga4PropertyId {
  /** Which env var supplied the value. */
  sourceKey: typeof GA4_PROPERTY_CANONICAL_KEY | typeof GA4_PROPERTY_LEGACY_KEY;
  /** True when both env vars were set to the same normalized id. */
  bothPresent: boolean;
}

/**
 * Resolves the GA4 property id from the environment.
 *  - GA_PROPERTY_ID is canonical; GA4_PROPERTY_ID is a legacy alias.
 *  - If both are set and normalize to DIFFERENT ids → CONFLICTING_PROPERTY_IDS.
 *  - If both are set to the same id → OK, sourceKey = canonical.
 * Throws Ga4ConfigError (secret-free) when unset, malformed, or conflicting.
 */
export function resolveGa4PropertyId(
  env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env,
): ResolvedGa4PropertyId {
  const rawCanonical = trimmedOrUndef(env[GA4_PROPERTY_CANONICAL_KEY]);
  const rawLegacy = trimmedOrUndef(env[GA4_PROPERTY_LEGACY_KEY]);

  if (rawCanonical == null && rawLegacy == null) {
    throw new Ga4ConfigError(
      "MISSING_PROPERTY_ID",
      `No GA4 property id configured. Set ${GA4_PROPERTY_CANONICAL_KEY} (canonical).`,
    );
  }

  if (rawCanonical != null && rawLegacy != null) {
    const c = normalizeGa4PropertyId(rawCanonical);
    const l = normalizeGa4PropertyId(rawLegacy);
    if (c.numericId !== l.numericId) {
      // Fail closed — never silently prefer one conflicting value.
      throw new Ga4ConfigError(
        "CONFLICTING_PROPERTY_IDS",
        `${GA4_PROPERTY_CANONICAL_KEY} (${c.numericId}) and ${GA4_PROPERTY_LEGACY_KEY} (${l.numericId}) disagree; unset one.`,
      );
    }
    return { ...c, sourceKey: GA4_PROPERTY_CANONICAL_KEY, bothPresent: true };
  }

  if (rawCanonical != null) {
    return { ...normalizeGa4PropertyId(rawCanonical), sourceKey: GA4_PROPERTY_CANONICAL_KEY, bothPresent: false };
  }
  return { ...normalizeGa4PropertyId(rawLegacy!), sourceKey: GA4_PROPERTY_LEGACY_KEY, bothPresent: false };
}

function trimmedOrUndef(v: string | undefined): string | undefined {
  if (v == null) return undefined;
  const t = String(v).trim();
  return t === "" ? undefined : t;
}

export type Ga4AccessCode =
  | "PROPERTY_LEVEL_ACCESS_OK"
  | "PERMISSION_DENIED"
  | "INVALID_PROPERTY_ID"
  | "MISSING_PROPERTY_ID"
  | "CONFLICTING_PROPERTY_IDS"
  | "API_DISABLED"
  | "UNKNOWN_ERROR";

/** Outcome of a single direct, read-only property request (getMetadata/runReport). */
export interface Ga4DirectRequestOutcome {
  ok: boolean;
  /** HTTP status when the request failed. */
  status?: number;
  /** True when the error indicates analyticsdata.googleapis.com is disabled. */
  apiDisabled?: boolean;
}

export interface Ga4AccessInput {
  /** True once a valid property id has been resolved. */
  propertyIdConfigured: boolean;
  /** A resolution-stage failure code, when config could not be resolved. */
  configError?: Ga4ConfigCode;
  /** Result of the direct property request; omit when it was never attempted. */
  direct?: Ga4DirectRequestOutcome;
}

/**
 * Classifies GA4 access. Config-resolution failures take precedence; otherwise
 * the verdict is derived from the DIRECT property request ONLY. An empty
 * accountSummaries response is deliberately not an input and can never downgrade
 * a successful direct request. Pure and side-effect free.
 */
export function classifyGa4Access(input: Ga4AccessInput): { code: Ga4AccessCode; message: string } {
  if (input.configError) {
    switch (input.configError) {
      case "CONFLICTING_PROPERTY_IDS":
        return { code: "CONFLICTING_PROPERTY_IDS", message: "Conflicting GA4 property ids configured; resolve before auditing." };
      case "MALFORMED_PROPERTY_ID":
        return { code: "INVALID_PROPERTY_ID", message: "Configured GA4 property id is malformed." };
      case "MISSING_PROPERTY_ID":
      default:
        return { code: "MISSING_PROPERTY_ID", message: "GA4 property id is not configured." };
    }
  }
  if (!input.propertyIdConfigured) {
    return { code: "MISSING_PROPERTY_ID", message: "GA4 property id is not configured." };
  }
  const d = input.direct;
  if (!d) {
    return { code: "UNKNOWN_ERROR", message: "No direct property request was attempted." };
  }
  if (d.ok) {
    return {
      code: "PROPERTY_LEVEL_ACCESS_OK",
      message: "Direct property request succeeded (account summaries may legitimately be empty).",
    };
  }
  if (d.apiDisabled) {
    return { code: "API_DISABLED", message: "analyticsdata.googleapis.com appears disabled for the project." };
  }
  if (d.status === 403) {
    return { code: "PERMISSION_DENIED", message: "Service account lacks permission on the property (403)." };
  }
  if (d.status === 404) {
    return { code: "INVALID_PROPERTY_ID", message: "Property id is invalid or inaccessible (404)." };
  }
  return { code: "UNKNOWN_ERROR", message: `Direct property request failed (status ${d.status ?? "unknown"}).` };
}
