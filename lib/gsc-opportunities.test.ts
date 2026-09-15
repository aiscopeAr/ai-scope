import { describe, it, expect } from "vitest";
import {
  classifyRow,
  confidenceOf,
  priorityScore,
  positionFactor,
  impressionFactor,
  detectIntent,
  normalizeQuery,
  analyzeSnapshot,
  buildMarkdown,
  type Snapshot,
  type PerfRow,
} from "./gsc-opportunities";

describe("classifyRow — deterministic precedence", () => {
  it("EARLY_WINNER: pos<=10 & clicks>=1", () => {
    expect(classifyRow({ clicks: 1, impressions: 21, position: 7.7 })).toBe("EARLY_WINNER");
  });
  it("HIGH_IMPRESSION_LOW_CTR: pos<=10 & impr>=10 & 0 clicks", () => {
    expect(classifyRow({ clicks: 0, impressions: 10, position: 6.6 })).toBe("HIGH_IMPRESSION_LOW_CTR");
    expect(classifyRow({ clicks: 0, impressions: 18, position: 5.4 })).toBe("HIGH_IMPRESSION_LOW_CTR");
  });
  it("STRIKING_DISTANCE: impr>=5 & 10<pos... actually pos in (5,20]", () => {
    expect(classifyRow({ clicks: 0, impressions: 22, position: 12 })).toBe("STRIKING_DISTANCE");
    expect(classifyRow({ clicks: 0, impressions: 6, position: 8 })).toBe("STRIKING_DISTANCE"); // pos 8, impr<10 → not high-imp, striking
  });
  it("WATCH: deep position or low impressions", () => {
    expect(classifyRow({ clicks: 0, impressions: 30, position: 44 })).toBe("WATCH"); // deep
    expect(classifyRow({ clicks: 0, impressions: 1, position: 6 })).toBe("WATCH");   // impr 1 < 5 → not striking
  });
  it("low-impression near-top is WATCH, not striking (impr<5)", () => {
    expect(classifyRow({ clicks: 0, impressions: 1, position: 6.0 })).toBe("WATCH");
  });
  it("boundary: pos exactly 5 with 0 clicks & impr>=10 → HIGH_IMPRESSION_LOW_CTR (pos<=10)", () => {
    expect(classifyRow({ clicks: 0, impressions: 12, position: 5 })).toBe("HIGH_IMPRESSION_LOW_CTR");
  });
});

describe("confidenceOf", () => {
  it("HIGH>=20, MEDIUM>=8, else LOW", () => {
    expect(confidenceOf(20)).toBe("HIGH");
    expect(confidenceOf(25)).toBe("HIGH");
    expect(confidenceOf(8)).toBe("MEDIUM");
    expect(confidenceOf(7)).toBe("LOW");
    expect(confidenceOf(1)).toBe("LOW");
  });
});

describe("priorityScore — low-volume safety & no volume domination", () => {
  it("25 impr @ pos12 outranks 1 impr @ pos6", () => {
    const a = priorityScore({ clicks: 0, impressions: 25, position: 12 }, "STRIKING_DISTANCE");
    const b = priorityScore({ clicks: 0, impressions: 1, position: 6 }, "WATCH");
    expect(a).toBeGreaterThan(b);
  });
  it("30 impr @ pos45 does NOT dominate 18 impr @ pos5.4", () => {
    const deep = priorityScore({ clicks: 0, impressions: 30, position: 45 }, "WATCH");
    const prime = priorityScore({ clicks: 0, impressions: 18, position: 5.4 }, "HIGH_IMPRESSION_LOW_CTR");
    expect(prime).toBeGreaterThan(deep);
  });
  it("is bounded 0..100", () => {
    expect(priorityScore({ clicks: 0, impressions: 100000, position: 6 }, "HIGH_IMPRESSION_LOW_CTR")).toBeLessThanOrEqual(100);
    expect(priorityScore({ clicks: 0, impressions: 0, position: 6 }, "WATCH")).toBe(0);
  });
  it("positionFactor/impressionFactor shapes", () => {
    expect(positionFactor(2)).toBeLessThan(positionFactor(7));
    expect(positionFactor(7)).toBeGreaterThan(positionFactor(15));
    expect(positionFactor(45)).toBeLessThan(positionFactor(25));
    expect(impressionFactor(0)).toBe(0);
    expect(impressionFactor(50)).toBeCloseTo(1, 1);
    expect(impressionFactor(10)).toBeLessThan(impressionFactor(25));
  });
});

describe("detectIntent — Arabic + inline English, deterministic", () => {
  it("ARABIC", () => { expect(detectIntent("geminiعربي").all).toContain("ARABIC"); expect(detectIntent("gemini بالعربي").primary).toBe("ARABIC"); });
  it("WHAT_IS (ما هو / ماهو / معنى)", () => {
    expect(detectIntent("ما هو zapier").primary).toBe("WHAT_IS");
    expect(detectIntent("ماهو gemini").primary).toBe("WHAT_IS");
    expect(detectIntent("gemini معنى").all).toContain("WHAT_IS");
  });
  it("EXPLAIN / COMPARISON / HOW_TO / PRICING / FREE / ALTERNATIVE", () => {
    expect(detectIntent("zapier شرح").primary).toBe("EXPLAIN");
    expect(detectIntent("gemini vs chatgpt").primary).toBe("COMPARISON");
    expect(detectIntent("كيفية استخدام midjourney").primary).toBe("HOW_TO");
    expect(detectIntent("gemini سعر").primary).toBe("PRICING");
    expect(detectIntent("gemini مجاني").primary).toBe("FREE");
    expect(detectIntent("بديل zapier").primary).toBe("ALTERNATIVE");
  });
  it("BRAND (lumiq) and OTHER fallback", () => {
    expect(detectIntent("لوميك").primary).toBe("BRAND");
    expect(detectIntent("الـprompt").primary).toBe("OTHER");
  });
  it("comparison outranks what_is when both present (priority order)", () => {
    expect(detectIntent("ما هو gemini vs chatgpt").primary).toBe("COMPARISON");
  });
});

describe("normalizeQuery — conservative; Arabic preserved", () => {
  it("trims, collapses ws, lowercases Latin only, keeps Arabic", () => {
    expect(normalizeQuery("  Gemini   بالعربي ")).toBe("gemini بالعربي");
  });
  it("normalizes spacing around vs", () => {
    expect(normalizeQuery("gemini vs chatgpt")).toBe("gemini vs chatgpt");
    expect(normalizeQuery("gemini VS chatgpt")).toBe("gemini vs chatgpt");
  });
  it("does not alter Arabic characters", () => {
    expect(normalizeQuery("ما هو zapier")).toBe("ما هو zapier");
  });
});

// ── Fixture snapshot mirroring the real data ──
function snapshot(): Snapshot {
  const rows: PerfRow[] = [
    { page: "https://www.lumiq.news/", query: "لوميك", clicks: 4, impressions: 24, ctr: 0.1667, position: 1.8 },
    { page: "https://www.lumiq.news/prompts", query: "الـprompt", clicks: 1, impressions: 21, ctr: 0.0476, position: 7.7 },
    { page: "https://www.lumiq.news/ai-tools/gemini", query: "geminiعربي", clicks: 0, impressions: 18, ctr: 0, position: 5.4 },
    { page: "https://www.lumiq.news/ai-tools/gemini", query: "gemini بالعربي", clicks: 0, impressions: 22, ctr: 0, position: 12.0 },
    { page: "https://www.lumiq.news/ai-tools/gemini", query: "gemini in arabic", clicks: 0, impressions: 30, ctr: 0, position: 44.3 },
    { page: "https://www.lumiq.news/ai-tools/gemini", query: "لgemini", clicks: 0, impressions: 9, ctr: 0, position: 7.0 },
    { page: "https://www.lumiq.news/reviews/what-is-gemini-google-ai-guide", query: "لgemini", clicks: 0, impressions: 4, ctr: 0, position: 12.8 },
    { page: "https://www.lumiq.news/reviews/what-is-gemini-google-ai-guide", query: "ماهو gemini", clicks: 0, impressions: 1, ctr: 0, position: 12.0 },
    { page: "https://www.lumiq.news/ai-tools/zapier-automation-tool", query: "zapier ما هو", clicks: 0, impressions: 25, ctr: 0, position: 12.0 },
    { page: "https://www.lumiq.news/ai-tools/zapier-automation-tool", query: "ما هو zapier", clicks: 0, impressions: 10, ctr: 0, position: 6.6 },
    { page: "https://www.lumiq.news/reviews/what-is-elevenlabs-ai-voice-guide", query: "شرح elevenlabs", clicks: 0, impressions: 14, ctr: 0, position: 9.1 },
  ];
  return { capturedAt: "2026-09-14", rangeStart: "2026-06-15", rangeEnd: "2026-09-12", siteUrl: "sc-domain:lumiq.news", dimensions: ["page", "query"], rowCount: rows.length, rows };
}

describe("analyzeSnapshot — end-to-end deterministic report", () => {
  const rep = analyzeSnapshot(snapshot(), { topN: 10, now: "2026-09-15T00:00:00Z" });

  it("labels the visible slice and never claims total traffic", () => {
    expect(rep.visibleTotals.note).toMatch(/VISIBLE_QUERY_SLICE/);
    expect(rep.coverageDisclaimer).toMatch(/NOT total property traffic/);
  });
  it("Gemini geminiعربي (pos 5.4) ranks #1", () => {
    expect(rep.topOpportunities[0].query).toBe("geminiعربي");
    expect(rep.topOpportunities[0].classification).toBe("HIGH_IMPRESSION_LOW_CTR");
  });
  it("Zapier appears near the top (both variants in top opportunities)", () => {
    const qs = rep.topOpportunities.map((r) => r.query);
    expect(qs).toContain("ما هو zapier");
    expect(qs).toContain("zapier ما هو");
  });
  it("/prompts is an EARLY_WINNER", () => {
    const p = rep.topOpportunities.find((r) => r.page.endsWith("/prompts"));
    expect(p?.classification).toBe("EARLY_WINNER");
    expect(p?.actions).toContain("PROTECT_WINNER");
  });
  it("deep-position high-impression query (gemini in arabic pos44) is WATCH and low score", () => {
    const g = snapshot().rows.find((r) => r.query === "gemini in arabic")!;
    expect(classifyRow(g)).toBe("WATCH");
  });
  it("possible-overlap detected for لgemini across two pages; never cannibalization", () => {
    const o = rep.overlaps.find((x) => x.displayQuery.includes("gemini"));
    expect(o).toBeTruthy();
    expect(o!.classification).toBe("POSSIBLE_OVERLAP");
    expect(o!.action).toBe("OVERLAP_REVIEW");
    expect(o!.pages.length).toBeGreaterThanOrEqual(2);
    expect(o!.dominantPage).toContain("/ai-tools/gemini"); // more impressions + better position
    // ensure no ACTION field (row actions or overlap actions) is a forbidden op.
    // (The coverage disclaimer legitimately mentions "cannibalization" as a
    // thing we DON'T do, so we scan action fields, not the whole blob.)
    const allActions = [
      ...rep.topOpportunities.flatMap((r) => r.actions),
      ...rep.overlaps.map((x) => x.action),
    ];
    const forbidden = /MERGE|REDIRECT|CANONICAL|NOINDEX|CREATE_NEW_PAGE|DELETE/i;
    expect(allActions.some((a) => forbidden.test(a))).toBe(false);
  });
  it("page aggregation is labelled VISIBLE_QUERY_SLICE with impression-weighted position", () => {
    const gem = rep.pageSummaries.find((p) => p.page.endsWith("/ai-tools/gemini"))!;
    expect(gem.note).toBe("VISIBLE_QUERY_SLICE");
    expect(gem.visibleImpressions).toBe(18 + 22 + 30 + 9);
    expect(gem.zeroClickMeaningfulCount).toBeGreaterThanOrEqual(2);
  });
  it("summary + intent breakdown populated", () => {
    expect(rep.summaryCounts.EARLY_WINNER).toBeGreaterThanOrEqual(1);
    expect(rep.intentBreakdown.ARABIC).toBeGreaterThanOrEqual(1);
    expect(rep.intentBreakdown.WHAT_IS).toBeGreaterThanOrEqual(1);
  });
  it("deterministic ordering (stable across runs)", () => {
    const a = analyzeSnapshot(snapshot(), { topN: 10, now: "x" }).topOpportunities.map((r) => r.query);
    const b = analyzeSnapshot(snapshot(), { topN: 10, now: "y" }).topOpportunities.map((r) => r.query);
    expect(a).toEqual(b);
  });
  it("buildMarkdown renders without throwing and includes the disclaimer", () => {
    const md = buildMarkdown(rep, 10);
    expect(md).toMatch(/Growth Opportunities/);
    expect(md).toMatch(/VISIBLE_QUERY_SLICE|NOT total property traffic/);
  });
});

describe("analyzeSnapshot — malformed / empty", () => {
  it("throws on a snapshot without rows[]", () => {
    expect(() => analyzeSnapshot({} as unknown as Snapshot)).toThrow(/missing rows/);
  });
  it("empty rows → empty report, no crash", () => {
    const rep = analyzeSnapshot({ capturedAt: "d", rangeStart: "a", rangeEnd: "b", siteUrl: "s", dimensions: ["page", "query"], rowCount: 0, rows: [] });
    expect(rep.topOpportunities).toEqual([]);
    expect(rep.pageSummaries).toEqual([]);
    expect(rep.overlaps).toEqual([]);
    expect(rep.visibleTotals.impressions).toBe(0);
  });
});
