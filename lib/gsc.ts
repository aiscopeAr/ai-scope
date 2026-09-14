/**
 * lib/gsc.ts
 *
 * Growth Engine V1 — G1A: Google Search Console page×query data foundation.
 *
 * A thin, service-account-authenticated client over the official Search Console
 * Search Analytics API (via the already-installed `googleapis`), plus pure,
 * deterministic helpers (credential resolution, date range, normalization,
 * pagination, retry, snapshot shaping) that are unit-testable WITHOUT any live
 * API call. The manual CLI (scripts/fetch-gsc-performance.ts) wires these into a
 * one-shot JSON snapshot under docs/seo.
 *
 * Scope: read-only (webmasters.readonly). No DB, no cron, no runtime route.
 * Secrets never appear in thrown errors or logs — only variable NAMES do.
 */

import { google } from "googleapis";

export const GSC_READONLY_SCOPE = "https://www.googleapis.com/auth/webmasters.readonly";
export const GSC_ROW_LIMIT = 25000; // API maximum per request (default is 1000)
export const DEFAULT_MAX_PAGES = 40; // 40 × 25k = 1,000,000-row safety ceiling

// ─── Types ───────────────────────────────────────────────────────────────────

export interface SearchPerformanceRow {
  page: string;
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface GscSnapshot {
  capturedAt: string;   // YYYY-MM-DD (UTC) this snapshot was produced
  rangeStart: string;   // YYYY-MM-DD inclusive
  rangeEnd: string;     // YYYY-MM-DD inclusive
  siteUrl: string;      // sc-domain:… or https://…/
  dimensions: string[]; // e.g. ["page","query"]
  rowCount: number;
  rows: SearchPerformanceRow[];
}

/** One API "page" of the searchanalytics response, in the injectable seam shape. */
export interface QueryArgs {
  startDate: string;
  endDate: string;
  dimensions: string[];
  rowLimit: number;
  startRow: number;
}
export type QueryFn = (args: QueryArgs) => Promise<{ rows: unknown[] }>;

export interface Credentials {
  clientEmail: string;
  privateKey: string;
}

type Env = Record<string, string | undefined>;

// ─── Credentials (GSC_* preferred, else GA_*; never mix; never leak) ─────────

function unescapeKey(key: string): string {
  return key.replace(/\\n/g, "\n");
}

/**
 * Resolve a COMPLETE service-account credential pair. Precedence: dedicated
 * GSC_* if both present; otherwise GA_* fallback. A partial pair (one half of a
 * set) is rejected — this prevents accidentally mixing GSC_CLIENT_EMAIL with
 * GA_PRIVATE_KEY. Errors name only the variables, never their values.
 */
export function resolveCredentials(env: Env = process.env): Credentials {
  const gscEmail = env.GSC_CLIENT_EMAIL?.trim();
  const gscKey = env.GSC_PRIVATE_KEY;
  const hasGscEmail = !!gscEmail;
  const hasGscKey = !!gscKey;
  if (hasGscEmail !== hasGscKey) {
    throw new Error(
      "Incomplete GSC credential pair: set BOTH GSC_CLIENT_EMAIL and GSC_PRIVATE_KEY, or neither (to fall back to GA_*).",
    );
  }
  if (hasGscEmail && hasGscKey) {
    return { clientEmail: gscEmail!, privateKey: unescapeKey(gscKey!) };
  }

  const gaEmail = env.GA_CLIENT_EMAIL?.trim();
  const gaKey = env.GA_PRIVATE_KEY;
  const hasGaEmail = !!gaEmail;
  const hasGaKey = !!gaKey;
  if (hasGaEmail !== hasGaKey) {
    throw new Error("Incomplete GA credential pair: set BOTH GA_CLIENT_EMAIL and GA_PRIVATE_KEY.");
  }
  if (hasGaEmail && hasGaKey) {
    return { clientEmail: gaEmail!, privateKey: unescapeKey(gaKey!) };
  }

  throw new Error(
    "No Google service-account credentials configured. Set GSC_CLIENT_EMAIL + GSC_PRIVATE_KEY, or GA_CLIENT_EMAIL + GA_PRIVATE_KEY.",
  );
}

// ─── Site URL ────────────────────────────────────────────────────────────────

/** The exact Search Console property id; never rewritten (sc-domain:… or URL-prefix). */
export function resolveSiteUrl(env: Env = process.env): string {
  const s = env.GSC_SITE_URL?.trim();
  if (!s) {
    throw new Error("GSC_SITE_URL is required (e.g. 'sc-domain:lumiq.news' or 'https://www.lumiq.news/').");
  }
  return s;
}

// ─── Authenticated client (lazy JWT; readonly scope) ─────────────────────────

/** Build a Search Console v1 client from a service-account JWT. Not exercised by
 *  unit tests (they inject a QueryFn instead); constructing it makes no network call. */
export function getSearchConsoleClient(env: Env = process.env) {
  const { clientEmail, privateKey } = resolveCredentials(env);
  const auth = new google.auth.JWT({ email: clientEmail, key: privateKey, scopes: [GSC_READONLY_SCOPE] });
  return google.searchconsole({ version: "v1", auth });
}

/** Production QueryFn: one searchanalytics.query page for the given site. */
export function makeQueryFn(
  client: ReturnType<typeof getSearchConsoleClient>,
  siteUrl: string,
): QueryFn {
  return async (args) => {
    const res = await client.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate: args.startDate,
        endDate: args.endDate,
        dimensions: args.dimensions,
        type: "web",
        rowLimit: args.rowLimit,
        startRow: args.startRow,
      },
    });
    return { rows: res.data?.rows ?? [] };
  };
}

// ─── Date range (UTC, deterministic) ─────────────────────────────────────────

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
function toIso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * Compute the rolling window. Default: end = (UTC today − 2 days) to allow for
 * Search Console's reporting delay; start = end − 89 days → exactly 90 inclusive
 * UTC dates. Overrides must be supplied as a complete pair; start ≤ end.
 */
export function computeDateRange(
  nowUtcMs: number,
  opts?: { start?: string; end?: string },
): { rangeStart: string; rangeEnd: string } {
  const hasStart = opts?.start != null;
  const hasEnd = opts?.end != null;
  if (hasStart !== hasEnd) {
    throw new Error("Provide BOTH --start and --end, or neither.");
  }
  if (hasStart && hasEnd) {
    if (!ISO_DATE.test(opts!.start!) || !ISO_DATE.test(opts!.end!)) {
      throw new Error("--start and --end must be YYYY-MM-DD.");
    }
    if (opts!.start! > opts!.end!) {
      throw new Error("--start must be <= --end.");
    }
    return { rangeStart: opts!.start!, rangeEnd: opts!.end! };
  }
  const end = new Date(nowUtcMs);
  end.setUTCDate(end.getUTCDate() - 2);
  const start = new Date(end.getTime());
  start.setUTCDate(start.getUTCDate() - 89);
  return { rangeStart: toIso(start), rangeEnd: toIso(end) };
}

// ─── Normalization ───────────────────────────────────────────────────────────

function num(v: unknown): number {
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}

/** Map one raw API row → SearchPerformanceRow. keys[0]=page, keys[1]=query.
 *  Defensive on malformed/missing keys (empty strings, never throws). CTR and
 *  position are preserved exactly — no rounding. Arabic strings pass through. */
export function normalizeRow(raw: unknown): SearchPerformanceRow {
  const r = (raw ?? {}) as { keys?: unknown; clicks?: unknown; impressions?: unknown; ctr?: unknown; position?: unknown };
  const keys = Array.isArray(r.keys) ? r.keys : [];
  return {
    page: typeof keys[0] === "string" ? keys[0] : "",
    query: typeof keys[1] === "string" ? keys[1] : "",
    clicks: num(r.clicks),
    impressions: num(r.impressions),
    ctr: num(r.ctr),
    position: num(r.position),
  };
}

// ─── Pagination ──────────────────────────────────────────────────────────────

/**
 * Fetch ALL page×query rows across pages. rowLimit=25k; startRow advances by 25k;
 * completion = a page shorter than rowLimit (or zero rows). A max-page guard
 * prevents runaway loops and — critically — THROWS rather than silently returning
 * truncated data if the guard is hit.
 */
export async function fetchAllPageQueryRows(opts: {
  queryFn: QueryFn;
  rangeStart: string;
  rangeEnd: string;
  dimensions?: string[];
  maxPages?: number;
}): Promise<SearchPerformanceRow[]> {
  const dimensions = opts.dimensions ?? ["page", "query"];
  const maxPages = opts.maxPages ?? DEFAULT_MAX_PAGES;
  const out: SearchPerformanceRow[] = [];
  let startRow = 0;

  for (let page = 0; page < maxPages; page++) {
    const res = await opts.queryFn({
      startDate: opts.rangeStart,
      endDate: opts.rangeEnd,
      dimensions,
      rowLimit: GSC_ROW_LIMIT,
      startRow,
    });
    const rows = Array.isArray(res?.rows) ? res.rows : [];
    for (const raw of rows) out.push(normalizeRow(raw));
    if (rows.length < GSC_ROW_LIMIT) return out; // short/empty page ⇒ complete
    startRow += GSC_ROW_LIMIT;
  }
  throw new Error(
    `GSC pagination guard hit (${maxPages} full pages of ${GSC_ROW_LIMIT}); refusing to return possibly-truncated data.`,
  );
}

// ─── Retry (bounded, injectable sleep; retries 429/5xx only) ─────────────────

export function httpStatusOf(e: unknown): number {
  const a = e as { code?: unknown; status?: unknown; response?: { status?: unknown } } | null;
  const raw = a?.code ?? a?.status ?? a?.response?.status ?? 0;
  const n = Number(raw);
  return Number.isFinite(n) ? n : 0;
}

export function isRetryableError(e: unknown): boolean {
  const s = httpStatusOf(e);
  return s === 429 || (s >= 500 && s < 600);
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  opts?: { retries?: number; baseDelayMs?: number; sleep?: (ms: number) => Promise<void>; isRetryable?: (e: unknown) => boolean },
): Promise<T> {
  const retries = opts?.retries ?? 3;
  const base = opts?.baseDelayMs ?? 500;
  const sleep = opts?.sleep ?? ((ms: number) => new Promise((r) => setTimeout(r, ms)));
  const retryable = opts?.isRetryable ?? isRetryableError;
  let attempt = 0;
  for (;;) {
    try {
      return await fn();
    } catch (e) {
      attempt++;
      if (attempt > retries || !retryable(e)) throw e;
      await sleep(base * 2 ** (attempt - 1));
    }
  }
}

// ─── Snapshot + error hints ──────────────────────────────────────────────────

export function buildSnapshot(args: {
  siteUrl: string;
  rangeStart: string;
  rangeEnd: string;
  dimensions: string[];
  rows: SearchPerformanceRow[];
  capturedAt?: string;
}): GscSnapshot {
  return {
    capturedAt: args.capturedAt ?? toIso(new Date()),
    rangeStart: args.rangeStart,
    rangeEnd: args.rangeEnd,
    siteUrl: args.siteUrl,
    dimensions: args.dimensions,
    rowCount: args.rows.length,
    rows: args.rows,
  };
}

/** A non-secret, actionable hint for common API failures. Never includes creds. */
export function describeApiError(e: unknown): string {
  const s = httpStatusOf(e);
  if (s === 401) return "401 Unauthorized — the service-account credentials were rejected. Check GSC_/GA_ CLIENT_EMAIL and PRIVATE_KEY.";
  if (s === 403) return "403 Forbidden — verify the service-account email has Search Console access to the property, and that GSC_SITE_URL exactly matches the verified property.";
  if (s === 429) return "429 Too Many Requests — Search Console rate limit; retry later.";
  if (s >= 500 && s < 600) return `${s} Server error from Search Console — transient; retry later.`;
  return "Search Console API request failed.";
}

/** Deterministic snapshot filename for a capture date. */
export function snapshotFileName(capturedAt: string): string {
  if (!ISO_DATE.test(capturedAt)) throw new Error("capturedAt must be YYYY-MM-DD.");
  return `gsc-performance-${capturedAt}.json`;
}
