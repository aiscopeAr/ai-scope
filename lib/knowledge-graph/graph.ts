/**
 * lib/knowledge-graph/graph.ts
 *
 * The graph container: holds a deduplicated edge set and exposes the
 * per-entity query API every content type needs (Related Content, Related
 * Topics, Related Tools, Related Comparisons, Related Prompts, Related
 * Reviews). Symmetric relations are stored once but queryable from either
 * side — this is what makes "Review ↔ Tool" a real bidirectional lookup
 * instead of two separate one-way lists that can drift apart.
 */
import { type Edge, type Entity, type EntityKind, entityKey, edgeDedupeKey } from "./types";

export class KnowledgeGraph {
  private edges: Edge[] = [];
  private seenKeys = new Set<string>();
  private duplicatesRejected = 0;
  private selfEdgesRejected = 0;

  /** Adds an edge, silently rejecting exact duplicates and self-edges on
   *  symmetric relations (A related to itself is never a meaningful fact
   *  for comparison-comparison/category-category/tag-tag). Asymmetric
   *  self-references (e.g. a review "mentioning itself") are also rejected
   *  since they can never be a genuine distinct relationship. */
  addEdge(edge: Edge): boolean {
    if (entityKey(edge.from) === entityKey(edge.to)) {
      this.selfEdgesRejected++;
      return false;
    }
    const key = edgeDedupeKey(edge);
    if (this.seenKeys.has(key)) {
      this.duplicatesRejected++;
      return false;
    }
    this.seenKeys.add(key);
    this.edges.push(edge);
    return true;
  }

  addEdges(edges: Edge[]): void {
    for (const e of edges) this.addEdge(e);
  }

  get allEdges(): readonly Edge[] {
    return this.edges;
  }

  get stats() {
    return {
      totalEdges: this.edges.length,
      duplicatesRejected: this.duplicatesRejected,
      selfEdgesRejected: this.selfEdgesRejected,
    };
  }

  /** All edges touching this entity, regardless of which side (`from` or
   *  `to`) it's stored on. An edge is a fact that both endpoints
   *  participate in — "querying from the target side" is just as valid
   *  for an asymmetric relation (e.g. a comparison asking "which tools am
   *  I compared in?" via a tool→comparison edge) as it is for a symmetric
   *  one. Direction still matters for *interpreting* the edge (relatedTools
   *  vs relatedComparisons filters by the other side's kind, unaffected by
   *  this), just not for "does this edge touch me at all." */
  edgesFor(entity: Entity): Edge[] {
    const key = entityKey(entity);
    return this.edges.filter((e) => entityKey(e.from) === key || entityKey(e.to) === key);
  }

  /** The "other side" entity for every edge touching this one. */
  relatedEntities(entity: Entity, kind?: EntityKind): Entity[] {
    const key = entityKey(entity);
    const results: Entity[] = [];
    for (const e of this.edgesFor(entity)) {
      const other = entityKey(e.from) === key ? e.to : e.from;
      if (!kind || other.kind === kind) results.push(other);
    }
    return results;
  }

  relatedTools(entity: Entity) { return this.relatedEntities(entity, "tool"); }
  relatedReviews(entity: Entity) { return this.relatedEntities(entity, "review"); }
  relatedComparisons(entity: Entity) { return this.relatedEntities(entity, "comparison"); }
  relatedPrompts(entity: Entity) { return this.relatedEntities(entity, "prompt"); }
  relatedTags(entity: Entity) { return this.relatedEntities(entity, "tag"); }
  relatedCategories(entity: Entity) { return this.relatedEntities(entity, "category"); }
  relatedAuthors(entity: Entity) { return this.relatedEntities(entity, "author"); }

  /** "Related Content" — everything, regardless of kind, in one list. */
  relatedContent(entity: Entity): Entity[] {
    return this.relatedEntities(entity);
  }

  /** "Related Topics" — tags and categories specifically, the two entity
   *  kinds that represent a topic rather than a concrete content item. */
  relatedTopics(entity: Entity): Entity[] {
    return [...this.relatedTags(entity), ...this.relatedCategories(entity)];
  }

  isIsolated(entity: Entity): boolean {
    return this.edgesFor(entity).length === 0;
  }

  isWeaklyConnected(entity: Entity, threshold = 2): boolean {
    const count = this.edgesFor(entity).length;
    return count > 0 && count < threshold;
  }
}
