import { describe, it, expect, vi } from "vitest";
import {
  resolveCredentials,
  resolveSiteUrl,
  computeDateRange,
  normalizeRow,
  fetchAllPageQueryRows,
  withRetry,
  isRetryableError,
  httpStatusOf,
  buildSnapshot,
  describeApiError,
  snapshotFileName,
  getSearchConsoleClient,
  GSC_ROW_LIMIT,
  type QueryFn,
} from "./gsc";

const SECRET = "-----BEGIN PRIVATE KEY-----\\nSUPERSECRETVALUE\\n-----END-----";

// ─── AUTH ────────────────────────────────────────────────────────────────────
describe("resolveCredentials", () => {
  it("prefers a complete dedicated GSC pair", () => {
    const c = resolveCredentials({ GSC_CLIENT_EMAIL: "svc@gsc", GSC_PRIVATE_KEY: "k\\nk", GA_CLIENT_EMAIL: "ga@x", GA_PRIVATE_KEY: "g" });
    expect(c.clientEmail).toBe("svc@gsc");
    expect(c.privateKey).toBe("k\nk"); // \n unescaped
  });
  it("falls back to a complete GA pair when GSC absent", () => {
    const c = resolveCredentials({ GA_CLIENT_EMAIL: "ga@x", GA_PRIVATE_KEY: "g\\ng" });
    expect(c.clientEmail).toBe("ga@x");
    expect(c.privateKey).toBe("g\ng");
  });
  it("rejects a partial dedicated GSC pair (email without key) and does NOT mix with GA", () => {
    expect(() => resolveCredentials({ GSC_CLIENT_EMAIL: "svc@gsc", GA_CLIENT_EMAIL: "ga@x", GA_PRIVATE_KEY: "g" })).toThrow(/Incomplete GSC/);
  });
  it("rejects a partial dedicated GSC pair (key without email)", () => {
    expect(() => resolveCredentials({ GSC_PRIVATE_KEY: "k" })).toThrow(/Incomplete GSC/);
  });
  it("rejects a partial GA pair", () => {
    expect(() => resolveCredentials({ GA_CLIENT_EMAIL: "ga@x" })).toThrow(/Incomplete GA/);
  });
  it("rejects when no credentials at all", () => {
    expect(() => resolveCredentials({})).toThrow(/No Google service-account/);
  });
  it("never leaks a secret value in a thrown error", () => {
    try {
      resolveCredentials({ GSC_PRIVATE_KEY: SECRET }); // partial → throws
      throw new Error("should have thrown");
    } catch (e) {
      expect((e as Error).message).not.toContain("SUPERSECRETVALUE");
    }
  });
});

describe("getSearchConsoleClient", () => {
  it("throws (via resolveCredentials) when creds are missing", () => {
    expect(() => getSearchConsoleClient({})).toThrow(/No Google service-account/);
  });
  it("constructs a client (no network) with a complete pair", () => {
    const client = getSearchConsoleClient({ GA_CLIENT_EMAIL: "svc@x", GA_PRIVATE_KEY: "-----BEGIN PRIVATE KEY-----\\nabc\\n-----END-----" });
    expect(client).toBeTruthy();
    expect(client.searchanalytics).toBeTruthy();
  });
});

// ─── PROPERTY ────────────────────────────────────────────────────────────────
describe("resolveSiteUrl", () => {
  it("requires GSC_SITE_URL", () => {
    expect(() => resolveSiteUrl({})).toThrow(/GSC_SITE_URL is required/);
  });
  it("preserves a domain property exactly", () => {
    expect(resolveSiteUrl({ GSC_SITE_URL: "sc-domain:lumiq.news" })).toBe("sc-domain:lumiq.news");
  });
  it("preserves a URL-prefix property exactly, trimming only whitespace", () => {
    expect(resolveSiteUrl({ GSC_SITE_URL: "  https://www.lumiq.news/  " })).toBe("https://www.lumiq.news/");
  });
});

// ─── NORMALIZATION ───────────────────────────────────────────────────────────
describe("normalizeRow", () => {
  it("maps keys[0]→page, keys[1]→query and preserves metrics exactly", () => {
    const r = normalizeRow({ keys: ["/reviews/x", "some query"], clicks: 5, impressions: 100, ctr: 0.0512345, position: 12.87 });
    expect(r).toEqual({ page: "/reviews/x", query: "some query", clicks: 5, impressions: 100, ctr: 0.0512345, position: 12.87 });
  });
  it("preserves an Arabic query byte-for-byte", () => {
    const q = "ما هو zapier";
    const r = normalizeRow({ keys: ["/ai-tools/zapier-automation-tool", q], clicks: 0, impressions: 12, ctr: 0, position: 8.92 });
    expect(r.query).toBe(q);
    expect(JSON.parse(JSON.stringify(r)).query).toBe(q); // survives JSON round-trip
  });
  it("handles malformed/missing keys safely (empty strings, no throw)", () => {
    expect(normalizeRow({}).page).toBe("");
    expect(normalizeRow({ keys: ["only-page"] }).query).toBe("");
    expect(normalizeRow(null).query).toBe("");
    expect(normalizeRow({ keys: ["p", "q"] }).clicks).toBe(0); // missing metrics → 0
  });
});

// ─── PAGINATION ──────────────────────────────────────────────────────────────
function rowsOf(n: number): unknown[] {
  return Array.from({ length: n }, (_, i) => ({ keys: [`/p${i}`, `q${i}`], clicks: 0, impressions: 1, ctr: 0, position: 1 }));
}
describe("fetchAllPageQueryRows", () => {
  it("returns [] on zero rows and calls the API once", async () => {
    const qf = vi.fn().mockResolvedValue({ rows: [] });
    const out = await fetchAllPageQueryRows({ queryFn: qf, rangeStart: "2026-06-01", rangeEnd: "2026-08-29" });
    expect(out).toEqual([]);
    expect(qf).toHaveBeenCalledTimes(1);
  });
  it("returns a single short page and stops", async () => {
    const qf = vi.fn().mockResolvedValue({ rows: rowsOf(3) });
    const out = await fetchAllPageQueryRows({ queryFn: qf, rangeStart: "2026-06-01", rangeEnd: "2026-08-29" });
    expect(out).toHaveLength(3);
    expect(qf).toHaveBeenCalledTimes(1);
  });
  it("paginates: exactly 25,000 then a short page; startRow increments", async () => {
    const qf: QueryFn = vi.fn()
      .mockResolvedValueOnce({ rows: rowsOf(GSC_ROW_LIMIT) })
      .mockResolvedValueOnce({ rows: rowsOf(10) });
    const out = await fetchAllPageQueryRows({ queryFn: qf, rangeStart: "2026-06-01", rangeEnd: "2026-08-29" });
    expect(out).toHaveLength(GSC_ROW_LIMIT + 10);
    expect((qf as unknown as ReturnType<typeof vi.fn>)).toHaveBeenCalledTimes(2);
    expect((qf as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0].startRow).toBe(0);
    expect((qf as unknown as ReturnType<typeof vi.fn>).mock.calls[1][0].startRow).toBe(GSC_ROW_LIMIT);
  });
  it("throws when the max-page guard is exhausted (never returns truncated data)", async () => {
    const qf = vi.fn().mockResolvedValue({ rows: rowsOf(GSC_ROW_LIMIT) }); // always a full page
    await expect(fetchAllPageQueryRows({ queryFn: qf, rangeStart: "2026-06-01", rangeEnd: "2026-08-29", maxPages: 2 })).rejects.toThrow(/pagination guard/);
  });
});

// ─── DATES ───────────────────────────────────────────────────────────────────
describe("computeDateRange", () => {
  const daysBetween = (a: string, b: string) => (Date.parse(b) - Date.parse(a)) / 86_400_000;
  it("defaults to exactly 90 inclusive UTC dates ending (today−2)", () => {
    const now = Date.UTC(2026, 8, 14, 10, 30, 0); // 2026-09-14
    const { rangeStart, rangeEnd } = computeDateRange(now);
    expect(rangeEnd).toBe("2026-09-12"); // today − 2
    expect(daysBetween(rangeStart, rangeEnd)).toBe(89); // 90 inclusive dates
  });
  it("accepts a valid override pair verbatim", () => {
    const r = computeDateRange(Date.now(), { start: "2026-06-01", end: "2026-08-29" });
    expect(r).toEqual({ rangeStart: "2026-06-01", rangeEnd: "2026-08-29" });
  });
  it("rejects a partial override", () => {
    expect(() => computeDateRange(Date.now(), { start: "2026-06-01" })).toThrow(/BOTH/);
    expect(() => computeDateRange(Date.now(), { end: "2026-06-01" })).toThrow(/BOTH/);
  });
  it("rejects reversed ordering and bad format", () => {
    expect(() => computeDateRange(Date.now(), { start: "2026-08-29", end: "2026-06-01" })).toThrow(/<=/);
    expect(() => computeDateRange(Date.now(), { start: "08/29/2026", end: "2026-06-01" })).toThrow(/YYYY-MM-DD/);
  });
});

// ─── RETRY ───────────────────────────────────────────────────────────────────
describe("withRetry / isRetryableError", () => {
  const noSleep = () => Promise.resolve();
  it("retries 429 then succeeds (no real delay)", async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce({ code: 429 })
      .mockRejectedValueOnce({ code: 429 })
      .mockResolvedValue("ok");
    const r = await withRetry(fn, { retries: 3, sleep: noSleep });
    expect(r).toBe("ok");
    expect(fn).toHaveBeenCalledTimes(3);
  });
  it("does NOT retry 401/403 — throws immediately", async () => {
    const fn = vi.fn().mockRejectedValue({ code: 403 });
    await expect(withRetry(fn, { retries: 3, sleep: noSleep })).rejects.toEqual({ code: 403 });
    expect(fn).toHaveBeenCalledTimes(1);
  });
  it("retries transient 5xx", async () => {
    const fn = vi.fn().mockRejectedValueOnce({ code: 503 }).mockResolvedValue("ok");
    expect(await withRetry(fn, { retries: 2, sleep: noSleep })).toBe("ok");
    expect(fn).toHaveBeenCalledTimes(2);
  });
  it("gives up after the retry budget and rethrows", async () => {
    const fn = vi.fn().mockRejectedValue({ code: 429 });
    await expect(withRetry(fn, { retries: 2, sleep: noSleep })).rejects.toEqual({ code: 429 });
    expect(fn).toHaveBeenCalledTimes(3); // initial + 2 retries
  });
  it("uses exponential backoff via the injected sleep", async () => {
    const sleep = vi.fn().mockResolvedValue(undefined);
    const fn = vi.fn().mockRejectedValueOnce({ code: 429 }).mockRejectedValueOnce({ code: 429 }).mockResolvedValue("ok");
    await withRetry(fn, { retries: 3, baseDelayMs: 100, sleep });
    expect(sleep.mock.calls.map((c) => c[0])).toEqual([100, 200]);
  });
  it("classifies statuses", () => {
    expect(isRetryableError({ code: 429 })).toBe(true);
    expect(isRetryableError({ response: { status: 502 } })).toBe(true);
    expect(isRetryableError({ status: 403 })).toBe(false);
    expect(httpStatusOf({ code: 401 })).toBe(401);
  });
});

// ─── SNAPSHOT / ERRORS / FILENAME ────────────────────────────────────────────
describe("buildSnapshot", () => {
  it("rowCount matches rows.length and metadata is carried", () => {
    const rows = [normalizeRow({ keys: ["/p", "q"], clicks: 1, impressions: 2, ctr: 0.5, position: 1 })];
    const s = buildSnapshot({ siteUrl: "sc-domain:lumiq.news", rangeStart: "2026-06-01", rangeEnd: "2026-08-29", dimensions: ["page", "query"], rows, capturedAt: "2026-09-14" });
    expect(s.rowCount).toBe(1);
    expect(s.rows).toBe(rows);
    expect(s).toMatchObject({ siteUrl: "sc-domain:lumiq.news", rangeStart: "2026-06-01", rangeEnd: "2026-08-29", dimensions: ["page", "query"], capturedAt: "2026-09-14" });
  });
});

describe("describeApiError", () => {
  it("gives a useful 403 property/permission hint without any credential", () => {
    const h = describeApiError({ code: 403 });
    expect(h).toMatch(/property access|Search Console access|GSC_SITE_URL/i);
    expect(h).not.toContain("PRIVATE");
  });
  it("hints 401 / 429 / 5xx", () => {
    expect(describeApiError({ code: 401 })).toMatch(/401/);
    expect(describeApiError({ code: 429 })).toMatch(/429/);
    expect(describeApiError({ code: 502 })).toMatch(/502/);
  });
});

describe("snapshotFileName", () => {
  it("produces a deterministic dated filename", () => {
    expect(snapshotFileName("2026-09-14")).toBe("gsc-performance-2026-09-14.json");
  });
  it("rejects a bad date", () => {
    expect(() => snapshotFileName("2026/09/14")).toThrow(/YYYY-MM-DD/);
  });
});
