/**
 * lib/comparison-helpers.ts
 *
 * Pure, reusable logic shared by the comparison detail page, the admin
 * forms, and comparison integrity validation. Extracted out of
 * app/(main)/compare/[slug]/page.tsx, where these were previously defined
 * inline and only usable by that one file.
 */

export const PRICING_LABELS: Record<string, string> = {
  free: "مجاني",
  freemium: "مجاني جزئياً",
  paid: "مدفوع",
  enterprise: "للمؤسسات",
};

export function pricingLabel(pricing: string, monthly: number | null): string {
  const label = PRICING_LABELS[pricing] ?? pricing;
  return monthly ? `${label} · $${monthly}/شهر` : label;
}

/** criteria is stored as Json — historically always a flat string array, but
 *  tolerate a plain object shape too rather than crash on malformed data. */
export function normalizeCriteria(criteria: unknown): string[] {
  if (Array.isArray(criteria)) return criteria.filter((item): item is string => typeof item === "string");
  if (criteria && typeof criteria === "object") return Object.entries(criteria).map(([k, v]) => `${k}: ${String(v)}`);
  return [];
}

export interface ComparisonSideForScoring {
  score: number | null;
}

/** The winning side is whichever has the highest score — but only if at
 *  least one side actually has a score above 0; an all-null/all-zero score
 *  set has no winner, not a winner with an undefined "highest" of 0. */
export function getMaxScore(sides: ComparisonSideForScoring[]): number {
  const scores = sides.map((s) => s.score ?? 0);
  return scores.length > 0 ? Math.max(...scores) : 0;
}

export function isWinningSide(side: ComparisonSideForScoring, maxScore: number): boolean {
  return maxScore > 0 && side.score === maxScore;
}

const VALID_PRICING_TIERS = new Set(["free", "freemium", "paid", "enterprise"]);

export interface ComparisonSideValidationInput {
  toolId: string;
  toolPublished: boolean;
  score: number | null;
}

export interface ComparisonValidationInput {
  slug: string;
  sides: ComparisonSideValidationInput[];
}

export interface ComparisonValidationIssue {
  field: string;
  message: string;
}

/**
 * The single source of truth for "is this comparison structurally valid" —
 * used by the admin create/edit routes AND the standalone integrity
 * validator, so the two can never silently drift apart again.
 */
export function validateComparisonSides(input: ComparisonValidationInput): ComparisonValidationIssue[] {
  const issues: ComparisonValidationIssue[] = [];

  if (input.sides.length < 2) {
    issues.push({ field: "sides", message: "يجب أن تحتوي كل مقارنة على أداتين على الأقل" });
  }

  const toolIds = input.sides.map((s) => s.toolId);
  if (new Set(toolIds).size !== toolIds.length) {
    issues.push({ field: "sides", message: "لا يمكن اختيار نفس الأداة أكثر من مرة في نفس المقارنة" });
  }

  for (const side of input.sides) {
    if (!side.toolPublished) {
      issues.push({ field: "sides", message: `الأداة ${side.toolId} غير منشورة` });
    }
    if (side.score !== null && (side.score < 0 || side.score > 100)) {
      issues.push({ field: "sides", message: `الدرجة يجب أن تكون بين 0 و100 (القيمة الحالية: ${side.score})` });
    }
  }

  if (!/^[a-z0-9-]+$/.test(input.slug)) {
    issues.push({ field: "slug", message: `الـ slug "${input.slug}" يجب أن يحتوي فقط على أحرف لاتينية صغيرة، أرقام، وشرطات` });
  }

  return issues;
}

export function isValidPricingTier(pricing: string): boolean {
  return VALID_PRICING_TIERS.has(pricing);
}

export interface ToolFactsForDiff {
  name: string;
  pricing: string;
  monthlyPrice: number | null;
  arabicSupport: boolean;
  hasApi: boolean;
}

export interface KeyDifference {
  label: string;
  values: string[]; // one value per side, same order as the input tools
}

/**
 * "Key Differences" is built entirely from existing structured AITool
 * fields (pricing, arabicSupport, hasApi) — never from free text — so it
 * can never invent a claim. A fact only appears here when the tools
 * actually differ on it; if every side has the same pricing tier, no
 * pricing row is produced.
 */
export function getKeyDifferences(tools: ToolFactsForDiff[]): KeyDifference[] {
  if (tools.length < 2) return [];

  const differences: KeyDifference[] = [];

  const pricingValues = tools.map((t) => pricingLabel(t.pricing, t.monthlyPrice));
  if (new Set(pricingValues).size > 1) {
    differences.push({ label: "السعر", values: pricingValues });
  }

  const arabicValues = tools.map((t) => (t.arabicSupport ? "يدعم العربية" : "لا يدعم العربية"));
  if (new Set(arabicValues).size > 1) {
    differences.push({ label: "دعم العربية", values: arabicValues });
  }

  const apiValues = tools.map((t) => (t.hasApi ? "يوفر API" : "بدون API"));
  if (new Set(apiValues).size > 1) {
    differences.push({ label: "واجهة برمجية (API)", values: apiValues });
  }

  return differences;
}
