/**
 * lib/knowledge-graph/types.ts
 *
 * Core types for the Knowledge Graph — a computed layer over existing
 * production data, not a new stored schema. An "entity" is a uniform
 * reference to any of Lumiq's 7 supported node types; an "edge" is a
 * directed relationship between two entities, always tagged with the
 * exact real-data fact that produced it (its `source`) and a
 * human-readable `explanation`, so every edge is verifiable and never
 * an unexplained inference.
 */

export type EntityKind = "tool" | "review" | "comparison" | "prompt" | "category" | "tag" | "author";

export interface Entity {
  kind: EntityKind;
  /** Stable identifier within its kind — DB id for DB-backed kinds, the
   *  canonical tag string for "tag", the authorSlug for "author". */
  id: string;
  slug: string;
  title: string;
}

export function entityKey(e: Entity): string {
  return `${e.kind}:${e.id}`;
}

/**
 * The exact real-world fact each edge is derived from. This is a closed
 * list on purpose — "every relationship must have a source" means the
 * source has to be one of these named, auditable facts, never a free-text
 * justification a human (or model) could fabricate after the fact.
 */
export type EdgeSource =
  | "ComparisonSide.toolId"
  | "Prompt.toolId"
  | "internal-link-token" // a [[type:slug|label]] token in body content
  | "shared-canonical-tag"
  | "shared-category"
  | "shared-tool-category"
  | "Review.authorSlug"
  | "Review.categoryId";

export type RelationType =
  | "review-tool"
  | "review-comparison"
  | "tool-comparison"
  | "tool-prompt"
  | "comparison-comparison"
  | "category-category"
  | "author-review"
  | "tag-tag"
  | "review-tag"
  | "tool-tag";

export interface Edge {
  relation: RelationType;
  from: Entity;
  to: Entity;
  source: EdgeSource;
  explanation: string;
}

/** Relation types where the edge is inherently non-directional (A relates
 *  to B exactly the same way B relates to A) — used to dedupe A→B/B→A as
 *  one fact and to forbid A→A self-edges. Asymmetric relations (e.g.
 *  review-tool: a review mentions a tool, not the reverse) are not listed
 *  here and keep their direction. */
export const SYMMETRIC_RELATIONS = new Set<RelationType>([
  "comparison-comparison",
  "category-category",
  "tag-tag",
]);

export function edgeDedupeKey(edge: Edge): string {
  const a = entityKey(edge.from);
  const b = entityKey(edge.to);
  if (SYMMETRIC_RELATIONS.has(edge.relation)) {
    // order-independent key so A→B and B→A collapse to the same edge
    const [x, y] = [a, b].sort();
    return `${edge.relation}::${x}::${y}`;
  }
  return `${edge.relation}::${a}::${b}`;
}
