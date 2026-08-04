/**
 * lib/distribution/wordpress/config.ts
 *
 * The minimal, generic WordPress configuration shape read from
 * DistributionTarget.config.extra, plus pure validation for it. Nothing
 * here is Sonara-specific — every field is partner-agnostic, matching the
 * approved architecture's "never hardcode Sonara" requirement. A given
 * partner's actual values (base URL, category IDs, credentials) live only
 * in the DistributionTarget row a future sprint creates for them.
 */

export interface WordPressCredentials {
  username: string;
  applicationPassword: string;
}

export interface WordPressTargetConfig {
  baseUrl: string;
  categoryIds: number[];
  defaultStatus: "draft" | "publish";
  uploadFeaturedImage: boolean;
  authorId?: number;
  timeoutMs?: number;
}

export const DEFAULT_TIMEOUT_MS = 15_000;
export const MIN_TIMEOUT_MS = 1_000;
export const MAX_TIMEOUT_MS = 60_000;

export interface ConfigValidationResult {
  valid: boolean;
  errors: string[];
}

function ok(): ConfigValidationResult {
  return { valid: true, errors: [] };
}

function fail(errors: string[]): ConfigValidationResult {
  return { valid: false, errors };
}

/** True when `host` should be exempt from the HTTPS requirement — local
 *  development and CI/test hosts only. Kept narrow on purpose: a typo'd
 *  production hostname must never accidentally match this and silently
 *  allow plaintext HTTP to a real partner site. */
function isLocalOrTestHost(host: string): boolean {
  return host === "localhost" || host === "127.0.0.1" || host === "::1" || host.endsWith(".test") || host.endsWith(".localhost");
}

/**
 * Validates WordPress credentials in isolation. Error messages never
 * include the credential values themselves — only which field is missing
 * or malformed — so these strings are always safe to log or surface in an
 * admin UI.
 */
export function validateWordPressCredentials(credentials: unknown): ConfigValidationResult {
  const errors: string[] = [];

  if (credentials === null || typeof credentials !== "object") {
    return fail(["credentials must be an object"]);
  }

  const c = credentials as Record<string, unknown>;

  if (typeof c.username !== "string" || c.username.trim() === "") {
    errors.push("credentials.username must be a non-empty string");
  }
  if (typeof c.applicationPassword !== "string" || c.applicationPassword.trim() === "") {
    errors.push("credentials.applicationPassword must be a non-empty string");
  }

  return errors.length === 0 ? ok() : fail(errors);
}

/**
 * Validates a WordPressTargetConfig. Enforces HTTPS outside localhost/test
 * hosts, requires at least one positive category ID, a valid status, and
 * a timeout within safe bounds. Never references any specific partner
 * (no Sonara, no hardcoded category ID) — every check is generic to the
 * WordPress REST API's own requirements.
 */
export function validateWordPressConfig(config: unknown): ConfigValidationResult {
  const errors: string[] = [];

  if (config === null || typeof config !== "object") {
    return fail(["config must be an object"]);
  }

  const c = config as Record<string, unknown>;

  if (typeof c.baseUrl !== "string" || c.baseUrl.trim() === "") {
    errors.push("config.baseUrl must be a non-empty string");
  } else {
    let parsed: URL | null = null;
    try {
      parsed = new URL(c.baseUrl);
    } catch {
      errors.push("config.baseUrl must be a valid absolute URL");
    }
    if (parsed) {
      if (parsed.protocol !== "https:" && !isLocalOrTestHost(parsed.hostname)) {
        errors.push("config.baseUrl must use HTTPS outside localhost/test hosts");
      }
      if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
        errors.push("config.baseUrl must use the http or https scheme");
      }
    }
  }

  if (!Array.isArray(c.categoryIds) || c.categoryIds.length === 0) {
    errors.push("config.categoryIds must be a non-empty array");
  } else if (!c.categoryIds.every((id) => typeof id === "number" && Number.isInteger(id) && id > 0)) {
    errors.push("config.categoryIds must contain only positive integers");
  }

  if (c.defaultStatus !== "draft" && c.defaultStatus !== "publish") {
    errors.push('config.defaultStatus must be "draft" or "publish"');
  }

  if (typeof c.uploadFeaturedImage !== "boolean") {
    errors.push("config.uploadFeaturedImage must be a boolean");
  }

  if (c.authorId !== undefined && (typeof c.authorId !== "number" || !Number.isInteger(c.authorId) || c.authorId <= 0)) {
    errors.push("config.authorId must be a positive integer when present");
  }

  if (c.timeoutMs !== undefined) {
    if (typeof c.timeoutMs !== "number" || !Number.isFinite(c.timeoutMs)) {
      errors.push("config.timeoutMs must be a number when present");
    } else if (c.timeoutMs < MIN_TIMEOUT_MS || c.timeoutMs > MAX_TIMEOUT_MS) {
      errors.push(`config.timeoutMs must be between ${MIN_TIMEOUT_MS} and ${MAX_TIMEOUT_MS}`);
    }
  }

  return errors.length === 0 ? ok() : fail(errors);
}

/** Combined validation of both credentials and config — the check a
 *  Transport performs before attempting any network call. */
export function validateWordPressTarget(credentials: unknown, config: unknown): ConfigValidationResult {
  const credResult = validateWordPressCredentials(credentials);
  const configResult = validateWordPressConfig(config);
  const errors = [...credResult.errors, ...configResult.errors];
  return errors.length === 0 ? ok() : fail(errors);
}

/** Resolves the effective timeout for a config, applying the default when
 *  unset. Assumes `config` has already passed validateWordPressConfig. */
export function resolveTimeoutMs(config: WordPressTargetConfig): number {
  return config.timeoutMs ?? DEFAULT_TIMEOUT_MS;
}
