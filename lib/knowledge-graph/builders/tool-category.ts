/**
 * lib/knowledge-graph/builders/tool-category.ts
 *
 * AI Tools use a fixed `toolCategory` enum (lib/tool-categories.ts), not
 * free-text tags — so "related tools" and "related comparisons" for tools
 * are derived from shared toolCategory, the same signal the AI Tool detail
 * page's own "related tools" query already uses
 * (app/(main)/ai-tools/[slug]/page.tsx), reused here rather than invented.
 */
import type { Edge, Entity } from "../types";

export interface ToolWithCategoryRef {
  id: string;
  slug: string;
  name: string;
  toolCategory: string;
}

export interface ComparisonWithSidesRef {
  id: string;
  slug: string;
  title: string;
  sides: { tool: ToolWithCategoryRef }[];
}

function comparisonEntity(c: { id: string; slug: string; title: string }): Entity {
  return { kind: "comparison", id: c.id, slug: c.slug, title: c.title };
}

/**
 * Comparison ↔ Comparison, related when they compare tools in the same
 * toolCategory (e.g. two "coding" comparisons) — a real, checkable fact
 * about the tools each comparison actually contains, not a guess about
 * topical similarity.
 */
export function buildComparisonComparisonEdges(comparisons: ComparisonWithSidesRef[]): Edge[] {
  const edges: Edge[] = [];
  for (let i = 0; i < comparisons.length; i++) {
    for (let j = i + 1; j < comparisons.length; j++) {
      const a = comparisons[i];
      const b = comparisons[j];
      const aCats = new Set(a.sides.map((s) => s.tool.toolCategory));
      const bCats = new Set(b.sides.map((s) => s.tool.toolCategory));
      const shared = [...aCats].filter((c) => bCats.has(c));
      if (shared.length === 0) continue;
      edges.push({
        relation: "comparison-comparison",
        from: comparisonEntity(a),
        to: comparisonEntity(b),
        source: "shared-tool-category",
        explanation: `"${a.title}" and "${b.title}" both compare tools in the ${shared.join(", ")} category.`,
      });
    }
  }
  return edges;
}
