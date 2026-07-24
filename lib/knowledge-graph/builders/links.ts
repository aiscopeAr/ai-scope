/**
 * lib/knowledge-graph/builders/links.ts
 *
 * Edges derived from editorial [[type:slug|label]] tokens already embedded
 * in body content (Sprint 3's internal-linking system) — reuses the exact
 * same parser the live site uses to render these links, so the graph can
 * never disagree with production about what a link token means.
 */
import { INLINE_LINK_TOKEN, parseInternalLinkToken } from "@/lib/internal-links";
import type { Edge, Entity, EntityKind } from "../types";

export interface LinkSourceContent {
  entity: Entity;
  bodyText: string;
}

const TOKEN_TYPE_TO_ENTITY_KIND: Record<string, EntityKind | undefined> = {
  review: "review",
  tool: "tool",
  compare: "comparison",
  prompt: "prompt",
  // "category" and "tag" tokens exist in the token grammar but resolve to
  // slugs whose canonical Entity requires a lookup table the caller must
  // supply — see buildLinkTokenEdges's targetResolver parameter.
};

/**
 * @param targetResolver given a token's (type, slug), returns the real
 *   Entity it points to, or null if it doesn't resolve to anything
 *   published — the caller (CLI runner) already has all published slugs
 *   loaded, so resolution/validity is decided once, not guessed here.
 */
export function buildLinkTokenEdges(
  sources: LinkSourceContent[],
  targetResolver: (tokenType: string, slug: string) => Entity | null,
): Edge[] {
  const edges: Edge[] = [];

  for (const { entity, bodyText } of sources) {
    for (const m of bodyText.matchAll(INLINE_LINK_TOKEN)) {
      const parsed = parseInternalLinkToken(m);
      const target = targetResolver(parsed.type, parsed.slug);
      if (!target) continue; // broken/unpublished link — not a graph edge; the Editorial Engine already flags these separately

      const relation = relationFor(entity.kind, target.kind);
      if (!relation) continue;

      edges.push({
        relation,
        from: entity,
        to: target,
        source: "internal-link-token",
        explanation: `${entity.title} links to ${target.title} via an editorial [[${parsed.type}:${parsed.slug}]] reference.`,
      });
    }
  }

  return edges;
}

function relationFor(fromKind: EntityKind, toKind: EntityKind): Edge["relation"] | null {
  if (fromKind === "review" && toKind === "tool") return "review-tool";
  if (fromKind === "review" && toKind === "comparison") return "review-comparison";
  if (fromKind === "tool" && toKind === "comparison") return "tool-comparison";
  if (fromKind === "tool" && toKind === "tool") return null; // tool-tool isn't in the required relation list
  return null;
}

export { TOKEN_TYPE_TO_ENTITY_KIND };
