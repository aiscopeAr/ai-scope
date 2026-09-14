/**
 * scripts/fetch-gsc-performance.ts
 *
 * Growth Engine V1 — G1A manual CLI. Pulls the rolling 90-day page×query
 * Search Console dataset and writes ONE UTF-8 JSON snapshot under docs/seo.
 *
 *   node --env-file=.env npx tsx scripts/fetch-gsc-performance.ts
 *   node --env-file=.env npx tsx scripts/fetch-gsc-performance.ts --start 2026-06-01 --end 2026-08-29
 *   node --env-file=.env npx tsx scripts/fetch-gsc-performance.ts --overwrite
 *
 * Manual only — no cron, no DB, read-only Search Console scope. Prints a SAFE
 * summary (siteUrl, range, rowCount, path); never logs queries, credentials, or
 * tokens. This script performs a LIVE API call when run; it is not invoked as
 * part of implementation/validation.
 */

import { writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import {
  resolveSiteUrl,
  getSearchConsoleClient,
  makeQueryFn,
  computeDateRange,
  fetchAllPageQueryRows,
  buildSnapshot,
  withRetry,
  describeApiError,
  snapshotFileName,
} from "../lib/gsc";

const OUT_DIR = join("docs", "seo");

function parseArgs(argv: string[]): { start?: string; end?: string; overwrite: boolean } {
  const out: { start?: string; end?: string; overwrite: boolean } = { overwrite: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--overwrite") out.overwrite = true;
    else if (a === "--start") out.start = argv[++i];
    else if (a === "--end") out.end = argv[++i];
  }
  return out;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  const siteUrl = resolveSiteUrl();
  const dimensions = ["page", "query"];
  const { rangeStart, rangeEnd } = computeDateRange(Date.now(), { start: args.start, end: args.end });

  const capturedAt = new Date().toISOString().slice(0, 10);
  const outPath = join(OUT_DIR, snapshotFileName(capturedAt));
  if (existsSync(outPath) && !args.overwrite) {
    throw new Error(`Snapshot already exists: ${outPath} — pass --overwrite to replace it.`);
  }

  const client = getSearchConsoleClient();
  const baseQueryFn = makeQueryFn(client, siteUrl);
  const queryFn = (a: Parameters<typeof baseQueryFn>[0]) => withRetry(() => baseQueryFn(a));

  const rows = await fetchAllPageQueryRows({ queryFn, rangeStart, rangeEnd, dimensions });
  const snapshot = buildSnapshot({ siteUrl, rangeStart, rangeEnd, dimensions, rows, capturedAt });

  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(outPath, JSON.stringify(snapshot, null, 2), { encoding: "utf8" });

  // SAFE summary only — no query text, no credentials, no tokens.
  console.log(
    `[gsc] ${JSON.stringify({ siteUrl, rangeStart, rangeEnd, rowCount: snapshot.rowCount, out: outPath })}`,
  );
}

main().catch((e) => {
  // Non-secret hint + short message. Never print the raw auth error object.
  console.error(`[gsc] failed: ${describeApiError(e)}`);
  console.error(`[gsc] ${e instanceof Error ? e.message : "unknown error"}`);
  process.exit(1);
});
