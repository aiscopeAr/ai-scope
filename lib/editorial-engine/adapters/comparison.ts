/**
 * lib/editorial-engine/adapters/comparison.ts
 *
 * Normalizes a Comparison (+ its ComparisonSides) into an EditorialSubject.
 * Reuses lib/comparison-helpers.ts rather than re-deriving side/score
 * validity logic — this adapter's only job is shape translation.
 */
import { INLINE_LINK_TOKEN, parseInternalLinkToken } from "@/lib/internal-links";
import type { EditorialLink, EditorialSubject } from "../types";

export interface ComparisonForAdapter {
  id: string;
  slug: string;
  title: string;
  summaryAr: string;
  verdict: string | null;
  methodology: string | null;
  reviewedAt: Date | null;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
  sides: {
    toolId: string;
    score: number | null;
    bestFor: string | null;
    notRecommendedFor: string | null;
    tool: { published: boolean };
  }[];
}

function extractLinks(text: string): EditorialLink[] {
  const links: EditorialLink[] = [];
  for (const m of text.matchAll(INLINE_LINK_TOKEN)) {
    const parsed = parseInternalLinkToken(m);
    links.push({ type: parsed.type, slug: parsed.slug, label: parsed.label });
  }
  return links;
}

export function toEditorialSubject(c: ComparisonForAdapter): EditorialSubject {
  const bodyText = [c.summaryAr, c.verdict ?? "", c.methodology ?? "", ...c.sides.map((s) => `${s.bestFor ?? ""} ${s.notRecommendedFor ?? ""}`)].join("\n\n");

  return {
    kind: "comparison",
    id: c.id,
    slug: c.slug,
    title: c.title,
    bodyText,
    published: c.published,
    seoTitle: null, // Comparison has no dedicated seoTitle field today — page builds one from `title`
    seoDescription: null, // same — built from summaryAr at render time
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
    reviewedAt: c.reviewedAt,
    outboundLinks: extractLinks(bodyText),
    facts: {
      hasVerdict: !!c.verdict,
      hasMethodology: !!c.methodology,
      sideCount: c.sides.length,
      uniqueSideCount: new Set(c.sides.map((s) => s.toolId)).size,
      scoresInRange: c.sides.every((s) => s.score === null || (s.score >= 0 && s.score <= 100)),
      hasBestFor: c.sides.some((s) => !!s.bestFor),
      hasNotRecommendedFor: c.sides.some((s) => !!s.notRecommendedFor),
      linkedToolPublished: c.sides.every((s) => s.tool.published),
    },
  };
}
