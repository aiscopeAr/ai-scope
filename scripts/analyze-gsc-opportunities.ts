/**
 * scripts/analyze-gsc-opportunities.ts
 *
 * Growth Engine V1 — G2 manual CLI. Reads ONE G1A snapshot and writes a
 * deterministic, read-only opportunity report (JSON + optional Markdown).
 * No Search Console call, no DB, no LLM, no content mutation.
 *
 *   npx tsx scripts/analyze-gsc-opportunities.ts docs/seo/gsc-performance-2026-09-14.json
 *   npx tsx scripts/analyze-gsc-opportunities.ts <snapshot> --top 20 --md --overwrite
 *   npx tsx scripts/analyze-gsc-opportunities.ts <snapshot> --output docs/seo/growth.json
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { analyzeSnapshot, buildMarkdown, type Snapshot } from "../lib/gsc-opportunities";

function parseArgs(argv: string[]) {
  const out: { input?: string; top: number; output?: string; md: boolean; overwrite: boolean } = { top: 25, md: false, overwrite: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--top") out.top = Math.max(1, parseInt(argv[++i], 10) || 25);
    else if (a === "--output") out.output = argv[++i];
    else if (a === "--md") out.md = true;
    else if (a === "--overwrite") out.overwrite = true;
    else if (!a.startsWith("--") && !out.input) out.input = a;
  }
  return out;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.input) throw new Error("Usage: analyze-gsc-opportunities.ts <snapshot.json> [--top N] [--output path] [--md] [--overwrite]");
  if (!existsSync(args.input)) throw new Error(`Snapshot not found: ${args.input}`);

  const snapshot = JSON.parse(readFileSync(args.input, "utf8")) as Snapshot;
  const report = analyzeSnapshot(snapshot, { topN: args.top });

  const outJson = args.output ?? args.input.replace(/gsc-performance-/, "growth-opportunities-").replace(/[^/\\]*$/, (m) => m.includes("growth-opportunities-") ? m : `growth-opportunities-${snapshot.capturedAt}.json`);
  const jsonPath = outJson.endsWith(".json") ? outJson : `${outJson}.json`;
  if (existsSync(jsonPath) && !args.overwrite) throw new Error(`Report already exists: ${jsonPath} — pass --overwrite.`);
  writeFileSync(jsonPath, JSON.stringify(report, null, 2), { encoding: "utf8" });

  let mdPath: string | undefined;
  if (args.md) {
    mdPath = jsonPath.replace(/\.json$/, ".md");
    if (existsSync(mdPath) && !args.overwrite) throw new Error(`Report already exists: ${mdPath} — pass --overwrite.`);
    writeFileSync(mdPath, buildMarkdown(report, Math.min(args.top, 15)), { encoding: "utf8" });
  }

  console.log(`[g2] ${JSON.stringify({
    input: args.input,
    out: jsonPath,
    md: mdPath ?? null,
    rows: report.visibleTotals.rows,
    classes: report.summaryCounts,
    overlaps: report.overlaps.length,
    top1: report.topOpportunities[0] ? { q: report.topOpportunities[0].query, page: report.topOpportunities[0].page, score: report.topOpportunities[0].score } : null,
  })}`);
}

main();
