/**
 * lib/gsc-opportunities.ts
 *
 * Growth Engine V1 — G2: a PURE, deterministic opportunity miner. It turns one
 * GSC page×query snapshot (produced by G1A) into a ranked, read-only SEO
 * worklist. No LLM, no DB, no live API, no I/O (the CLI does file I/O).
 *
 * Hard guardrails baked in:
 *  - The page×query slice is NOT total property traffic (GSC anonymizes/omits
 *    low-volume queries) → every aggregate is labelled VISIBLE_QUERY_SLICE.
 *  - Overlap is only ever POSSIBLE_OVERLAP — never "cannibalization", and the
 *    recommended actions never include merge/redirect/canonical/noindex/create.
 *  - Low-volume safety: confidence + a log-scaled, multiplicative score prevent
 *    a 1-impression row at position 6 from outranking 25 impressions at 12.
 *
 * Types are declared locally (not imported from lib/gsc.ts) to keep this module
 * and its tests free of the heavy `googleapis` import.
 */

// ─── Input shapes (structural; match the G1A snapshot) ───────────────────────

export interface PerfRow {
  page: string;
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;      // fractional 0..1
  position: number; // 1-based average position (float)
}
export interface Snapshot {
  capturedAt: string;
  rangeStart: string;
  rangeEnd: string;
  siteUrl: string;
  dimensions: string[];
  rowCount: number;
  rows: PerfRow[];
}

// ─── Enums ───────────────────────────────────────────────────────────────────

export type Classification = "EARLY_WINNER" | "HIGH_IMPRESSION_LOW_CTR" | "STRIKING_DISTANCE" | "WATCH";
export type Confidence = "HIGH" | "MEDIUM" | "LOW";
export type Intent =
  | "WHAT_IS" | "EXPLAIN" | "ARABIC" | "COMPARISON" | "HOW_TO"
  | "PRICING" | "FREE" | "ALTERNATIVE" | "BRAND" | "OTHER";
export type ActionLabel =
  | "TITLE_SNIPPET_REVIEW" | "CONTENT_INTENT_REVIEW" | "INTERNAL_LINK_REVIEW"
  | "PROTECT_WINNER" | "WATCH" | "OVERLAP_REVIEW";

// ─── Thresholds (documented; the miner reports these in `methodology`) ───────

export const THRESHOLDS = {
  EARLY_WINNER_MAX_POS: 10,
  HIGH_IMP_MAX_POS: 10,
  HIGH_IMP_MIN_IMPRESSIONS: 10,
  STRIKING_MIN_IMPRESSIONS: 5,
  STRIKING_MIN_POS_EXCL: 5,   // position strictly > 5
  STRIKING_MAX_POS: 20,
  ZERO_CLICK_MEANINGFUL_IMPRESSIONS: 10,
  CONFIDENCE_HIGH_IMPRESSIONS: 20,
  CONFIDENCE_MEDIUM_IMPRESSIONS: 8,
  OVERLAP_MIN_PAGES: 2,
  OVERLAP_MIN_IMPRESSIONS_PER_PAGE: 2,
} as const;

// ─── Classification (deterministic precedence) ───────────────────────────────

export function classifyRow(r: Pick<PerfRow, "clicks" | "impressions" | "position">): Classification {
  const { clicks, impressions, position } = r;
  if (position <= THRESHOLDS.EARLY_WINNER_MAX_POS && clicks >= 1) return "EARLY_WINNER";
  if (position <= THRESHOLDS.HIGH_IMP_MAX_POS && impressions >= THRESHOLDS.HIGH_IMP_MIN_IMPRESSIONS && clicks === 0) {
    return "HIGH_IMPRESSION_LOW_CTR";
  }
  if (
    impressions >= THRESHOLDS.STRIKING_MIN_IMPRESSIONS &&
    position > THRESHOLDS.STRIKING_MIN_POS_EXCL &&
    position <= THRESHOLDS.STRIKING_MAX_POS
  ) {
    return "STRIKING_DISTANCE";
  }
  return "WATCH";
}

export function confidenceOf(impressions: number): Confidence {
  if (impressions >= THRESHOLDS.CONFIDENCE_HIGH_IMPRESSIONS) return "HIGH";
  if (impressions >= THRESHOLDS.CONFIDENCE_MEDIUM_IMPRESSIONS) return "MEDIUM";
  return "LOW";
}

// ─── Priority score (0–100, transparent & multiplicative) ────────────────────
// score = 100 · positionFactor · impressionFactor · classWeight
//  - positionFactor rewards the "climbable, clickable" zone (~3–15) and heavily
//    discounts deep positions, so 30 impressions at pos 45 cannot dominate.
//  - impressionFactor is log-scaled and capped, so volume never dominates alone.
//  - classWeight prioritizes fixable snippet issues over already-won queries.

export function positionFactor(position: number): number {
  if (position <= 3) return 0.3;   // already top — little room to gain clicks
  if (position <= 10) return 1.0;  // prime: a small climb yields big CTR gains
  if (position <= 20) return 0.7;  // climbable into top-10
  if (position <= 30) return 0.3;
  return 0.1;                       // too deep to action now
}
export function impressionFactor(impressions: number): number {
  if (impressions <= 0) return 0;
  return Math.min(1, Math.log10(impressions + 1) / Math.log10(50)); // 50 impr ⇒ ~1.0
}
const CLASS_WEIGHT: Record<Classification, number> = {
  HIGH_IMPRESSION_LOW_CTR: 1.0,
  STRIKING_DISTANCE: 0.85,
  EARLY_WINNER: 0.6,
  WATCH: 0.2,
};
export function priorityScore(r: Pick<PerfRow, "clicks" | "impressions" | "position">, cls: Classification): number {
  const s = 100 * positionFactor(r.position) * impressionFactor(r.impressions) * CLASS_WEIGHT[cls];
  return Math.max(0, Math.min(100, Math.round(s)));
}

// ─── Intent detection (deterministic; Arabic + inline English) ───────────────

const INTENT_PATTERNS: Array<{ intent: Intent; re: RegExp }> = [
  { intent: "COMPARISON", re: /مقارنة|\bمقابل\b|\bضد\b|\bvs\b|\bversus\b/i },
  { intent: "HOW_TO", re: /كيفية|كيف\b|طريقة|\bhow\s*to\b/i },
  { intent: "PRICING", re: /أسعار|سعر|تكلفة|مدفوع|\bpric(e|ing)\b|\bcost\b/i },
  { intent: "FREE", re: /مجان|\bfree\b/i },
  { intent: "ALTERNATIVE", re: /بديل|بدائل|\balternative/i },
  { intent: "WHAT_IS", re: /ما\s*هو|ماهو|ما\s*معنى|معنى|\bwhat\s*is\b|\bmeaning\b/i },
  { intent: "EXPLAIN", re: /شرح|اشرح|\bexplain/i },
  { intent: "ARABIC", re: /بالعرب|بالعربية|عربي|عربى|\barabic\b|\barabe\b/i },
  { intent: "BRAND", re: /لوميك|\blumiq\b/i },
];

/** Returns a primary intent (highest-priority match) plus all matched labels. */
export function detectIntent(query: string): { primary: Intent; all: Intent[] } {
  const all: Intent[] = [];
  for (const { intent, re } of INTENT_PATTERNS) if (re.test(query)) all.push(intent);
  return { primary: all[0] ?? "OTHER", all: all.length ? all : ["OTHER"] };
}

// ─── Conservative normalization (grouping only; Arabic preserved) ────────────

export function normalizeQuery(query: string): string {
  return query
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\s*\bvs\b\s*/gi, " vs ")
    .replace(/([A-Za-z]+)/g, (m) => m.toLowerCase()) // lowercase Latin runs only
    .trim();
}

// ─── Per-row actions ─────────────────────────────────────────────────────────

function actionsFor(cls: Classification): ActionLabel[] {
  switch (cls) {
    case "EARLY_WINNER": return ["PROTECT_WINNER"];
    case "HIGH_IMPRESSION_LOW_CTR": return ["TITLE_SNIPPET_REVIEW"];
    case "STRIKING_DISTANCE": return ["CONTENT_INTENT_REVIEW"];
    default: return ["WATCH"];
  }
}

// ─── Output shapes ───────────────────────────────────────────────────────────

export interface OpportunityRow {
  page: string;
  query: string;
  normalizedQuery: string;
  clicks: number;
  impressions: number;
  ctrPct: number;      // rounded % for display
  position: number;
  classification: Classification;
  confidence: Confidence;
  score: number;
  intentPrimary: Intent;
  intents: Intent[];
  actions: ActionLabel[];
}

export interface PageSummary {
  page: string;
  note: "VISIBLE_QUERY_SLICE";
  visibleClicks: number;
  visibleImpressions: number;
  representativePosition: number; // impression-weighted
  queryCount: number;
  strikingDistanceCount: number;
  top10Count: number;
  zeroClickMeaningfulCount: number;
  intents: Intent[];
  topScore: number;
}

export interface OverlapRecord {
  normalizedQuery: string;
  displayQuery: string;
  classification: "POSSIBLE_OVERLAP";
  action: "OVERLAP_REVIEW";
  pages: Array<{ page: string; impressions: number; position: number; clicks: number }>;
  dominantPage: string; // most impressions (tiebreak: better position)
}

export interface OpportunityReport {
  generatedAt: string;
  snapshot: { capturedAt: string; rangeStart: string; rangeEnd: string; siteUrl: string; dimensions: string[]; rowCount: number };
  coverageDisclaimer: string;
  visibleTotals: { clicks: number; impressions: number; rows: number; note: "VISIBLE_QUERY_SLICE — not total property traffic" };
  summaryCounts: Record<Classification, number>;
  confidenceCounts: Record<Confidence, number>;
  intentBreakdown: Record<string, number>;
  topOpportunities: OpportunityRow[];
  pageSummaries: PageSummary[];
  overlaps: OverlapRecord[];
  methodology: { thresholds: typeof THRESHOLDS; scoreFormula: string; classWeights: Record<Classification, number> };
}

const COVERAGE_DISCLAIMER =
  "This report covers only the page×query rows Search Console exposed for this window. " +
  "GSC anonymizes/omits low-volume queries, so these numbers are a VISIBLE_QUERY_SLICE, " +
  "NOT total property traffic. Overlap is POSSIBLE_OVERLAP only — never treated as cannibalization.";

// ─── Main analyzer (pure) ────────────────────────────────────────────────────

function round2(n: number): number { return Math.round(n * 100) / 100; }

export function analyzeSnapshot(snapshot: Snapshot, opts?: { topN?: number; now?: string }): OpportunityReport {
  if (!snapshot || !Array.isArray(snapshot.rows)) {
    throw new Error("Invalid snapshot: missing rows[].");
  }
  const topN = opts?.topN ?? 25;
  const rows = snapshot.rows;

  const enriched: OpportunityRow[] = rows.map((r) => {
    const cls = classifyRow(r);
    const { primary, all } = detectIntent(r.query);
    return {
      page: r.page,
      query: r.query,
      normalizedQuery: normalizeQuery(r.query),
      clicks: r.clicks,
      impressions: r.impressions,
      ctrPct: round2((r.ctr ?? 0) * 100),
      position: round2(r.position),
      classification: cls,
      confidence: confidenceOf(r.impressions),
      score: priorityScore(r, cls),
      intentPrimary: primary,
      intents: all,
      actions: actionsFor(cls),
    };
  });

  // Deterministic ordering: score desc, then impressions desc, then position asc,
  // then query asc (stable tie-break).
  const ordered = [...enriched].sort(
    (a, b) =>
      b.score - a.score ||
      b.impressions - a.impressions ||
      a.position - b.position ||
      a.query.localeCompare(b.query),
  );

  const summaryCounts: Record<Classification, number> = { EARLY_WINNER: 0, HIGH_IMPRESSION_LOW_CTR: 0, STRIKING_DISTANCE: 0, WATCH: 0 };
  const confidenceCounts: Record<Confidence, number> = { HIGH: 0, MEDIUM: 0, LOW: 0 };
  const intentBreakdown: Record<string, number> = {};
  for (const e of enriched) {
    summaryCounts[e.classification]++;
    confidenceCounts[e.confidence]++;
    intentBreakdown[e.intentPrimary] = (intentBreakdown[e.intentPrimary] ?? 0) + 1;
  }

  // ── Page aggregation (VISIBLE_QUERY_SLICE) ──
  const byPage = new Map<string, OpportunityRow[]>();
  for (const e of enriched) {
    if (!byPage.has(e.page)) byPage.set(e.page, []);
    byPage.get(e.page)!.push(e);
  }
  const pageSummaries: PageSummary[] = [...byPage.entries()].map(([page, rs]) => {
    const visibleImpressions = rs.reduce((a, r) => a + r.impressions, 0);
    const visibleClicks = rs.reduce((a, r) => a + r.clicks, 0);
    const wPos = visibleImpressions > 0
      ? rs.reduce((a, r) => a + r.position * r.impressions, 0) / visibleImpressions
      : rs.reduce((a, r) => a + r.position, 0) / (rs.length || 1);
    const intents = [...new Set(rs.map((r) => r.intentPrimary))];
    return {
      page,
      note: "VISIBLE_QUERY_SLICE" as const,
      visibleClicks,
      visibleImpressions,
      representativePosition: round2(wPos),
      queryCount: rs.length,
      strikingDistanceCount: rs.filter((r) => r.classification === "STRIKING_DISTANCE").length,
      top10Count: rs.filter((r) => r.position <= 10).length,
      zeroClickMeaningfulCount: rs.filter((r) => r.clicks === 0 && r.impressions >= THRESHOLDS.ZERO_CLICK_MEANINGFUL_IMPRESSIONS).length,
      intents,
      topScore: rs.reduce((m, r) => Math.max(m, r.score), 0),
    };
  }).sort((a, b) => b.topScore - a.topScore || b.visibleImpressions - a.visibleImpressions || a.page.localeCompare(b.page));

  // ── Overlap (POSSIBLE_OVERLAP only) ──
  const byNorm = new Map<string, OpportunityRow[]>();
  for (const e of enriched) {
    if (!byNorm.has(e.normalizedQuery)) byNorm.set(e.normalizedQuery, []);
    byNorm.get(e.normalizedQuery)!.push(e);
  }
  const overlaps: OverlapRecord[] = [];
  for (const [norm, rs] of byNorm) {
    const pages = [...new Map(rs.map((r) => [r.page, r])).keys()];
    const meaningful = rs.filter((r) => r.impressions >= THRESHOLDS.OVERLAP_MIN_IMPRESSIONS_PER_PAGE);
    const meaningfulPages = new Set(meaningful.map((r) => r.page));
    if (pages.length >= THRESHOLDS.OVERLAP_MIN_PAGES && meaningfulPages.size >= THRESHOLDS.OVERLAP_MIN_PAGES) {
      const perPage = pages.map((p) => {
        const pr = rs.filter((r) => r.page === p);
        return {
          page: p,
          impressions: pr.reduce((a, r) => a + r.impressions, 0),
          position: round2(pr.reduce((a, r) => a + r.position, 0) / pr.length),
          clicks: pr.reduce((a, r) => a + r.clicks, 0),
        };
      }).sort((a, b) => b.impressions - a.impressions || a.position - b.position);
      overlaps.push({
        normalizedQuery: norm,
        displayQuery: rs[0].query,
        classification: "POSSIBLE_OVERLAP",
        action: "OVERLAP_REVIEW",
        pages: perPage,
        dominantPage: perPage[0].page,
      });
    }
  }
  overlaps.sort((a, b) => (b.pages[0]?.impressions ?? 0) - (a.pages[0]?.impressions ?? 0));

  return {
    generatedAt: opts?.now ?? new Date().toISOString(),
    snapshot: {
      capturedAt: snapshot.capturedAt, rangeStart: snapshot.rangeStart, rangeEnd: snapshot.rangeEnd,
      siteUrl: snapshot.siteUrl, dimensions: snapshot.dimensions, rowCount: snapshot.rowCount,
    },
    coverageDisclaimer: COVERAGE_DISCLAIMER,
    visibleTotals: {
      clicks: enriched.reduce((a, r) => a + r.clicks, 0),
      impressions: enriched.reduce((a, r) => a + r.impressions, 0),
      rows: enriched.length,
      note: "VISIBLE_QUERY_SLICE — not total property traffic",
    },
    summaryCounts,
    confidenceCounts,
    intentBreakdown,
    topOpportunities: ordered.slice(0, topN),
    pageSummaries,
    overlaps,
    methodology: {
      thresholds: THRESHOLDS,
      scoreFormula: "score = 100 · positionFactor(pos) · impressionFactor(impr) · classWeight(class); impressionFactor = min(1, log10(impr+1)/log10(50))",
      classWeights: CLASS_WEIGHT,
    },
  };
}

// ─── Markdown rendering ──────────────────────────────────────────────────────

function shortPage(p: string): string { return p.replace(/^https?:\/\/[^/]+/, "") || "/"; }

export function buildMarkdown(rep: OpportunityReport, topN = 10): string {
  const L: string[] = [];
  L.push(`# LUMIQ — Growth Opportunities (${rep.snapshot.capturedAt})`);
  L.push(`Range ${rep.snapshot.rangeStart} → ${rep.snapshot.rangeEnd} · ${rep.snapshot.siteUrl} · ${rep.snapshot.rowCount} page×query rows`);
  L.push(`\n> ${rep.coverageDisclaimer}`);
  L.push(`\n**Visible slice:** ${rep.visibleTotals.clicks} clicks · ${rep.visibleTotals.impressions} impressions · ${rep.visibleTotals.rows} rows (NOT total property traffic).`);
  L.push(`\n**Class counts:** ` + Object.entries(rep.summaryCounts).map(([k, v]) => `${k} ${v}`).join(" · "));
  L.push(`**Confidence:** ` + Object.entries(rep.confidenceCounts).map(([k, v]) => `${k} ${v}`).join(" · "));
  L.push(`\n## Top ${topN} opportunities`);
  L.push(`| # | score | conf | class | query | page | impr | pos | CTR% | intent | action |`);
  L.push(`|---|---|---|---|---|---|---|---|---|---|---|`);
  rep.topOpportunities.slice(0, topN).forEach((r, i) => {
    L.push(`| ${i + 1} | ${r.score} | ${r.confidence} | ${r.classification} | ${r.query} | ${shortPage(r.page)} | ${r.impressions} | ${r.position} | ${r.ctrPct} | ${r.intentPrimary} | ${r.actions.join("+")} |`);
  });
  L.push(`\n## Top pages (VISIBLE_QUERY_SLICE)`);
  L.push(`| page | vis.impr | vis.clk | repr.pos | queries | strike | top10 | 0-click(≥10) |`);
  L.push(`|---|---|---|---|---|---|---|---|`);
  rep.pageSummaries.slice(0, 12).forEach((p) => {
    L.push(`| ${shortPage(p.page)} | ${p.visibleImpressions} | ${p.visibleClicks} | ${p.representativePosition} | ${p.queryCount} | ${p.strikingDistanceCount} | ${p.top10Count} | ${p.zeroClickMeaningfulCount} |`);
  });
  L.push(`\n## Possible overlaps (POSSIBLE_OVERLAP — review only, never auto-merge)`);
  if (rep.overlaps.length === 0) L.push(`_none_`);
  rep.overlaps.forEach((o) => {
    L.push(`- **${o.displayQuery}** → ${o.pages.map((p) => `${shortPage(p.page)} (imp ${p.impressions}, pos ${p.position})`).join(" · ")} — dominant: ${shortPage(o.dominantPage)}`);
  });
  L.push(`\n## Methodology`);
  L.push("```\n" + rep.methodology.scoreFormula + "\n```");
  return L.join("\n");
}
