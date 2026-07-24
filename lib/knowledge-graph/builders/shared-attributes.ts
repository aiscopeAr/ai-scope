/**
 * lib/knowledge-graph/builders/shared-attributes.ts
 *
 * Edges derived from two entities sharing a real, already-stored
 * attribute — a canonical tag, a category, a tool category, or an author
 * slug. These are the "topical" edges: nothing is inferred beyond "these
 * two rows have the same value in the same field."
 */
import { buildTagSummaries, normalizeTag, reviewHasTag } from "@/lib/tags";
import type { Edge, Entity } from "../types";

export interface ReviewRef {
  id: string;
  slug: string;
  titleAr: string;
  tags: string[];
  authorSlug: string;
  category: { id: string; slug: string; nameAr: string };
}

export interface CategoryRef { id: string; slug: string; nameAr: string; }
export interface AuthorRef { slug: string; nameAr: string; }

function reviewEntity(r: ReviewRef): Entity { return { kind: "review", id: r.id, slug: r.slug, title: r.titleAr }; }
function categoryEntity(c: CategoryRef): Entity { return { kind: "category", id: c.id, slug: c.slug, title: c.nameAr }; }
function tagEntity(canonical: string, label: string): Entity { return { kind: "tag", id: canonical, slug: canonical, title: label }; }
function authorEntity(a: AuthorRef): Entity { return { kind: "author", id: a.slug, slug: a.slug, title: a.nameAr }; }

/** Review ↔ Tag, for every canonical tag that has its own live /tag page
 *  (matches lib/tags.ts's MIN_REVIEWS_FOR_TAG_PAGE threshold — a tag with
 *  only 1-2 occurrences has no page to link to and isn't a graph node). */
export function buildReviewTagEdges(reviews: ReviewRef[]): Edge[] {
  const summaries = buildTagSummaries(reviews.map((r) => r.tags));
  const edges: Edge[] = [];
  for (const summary of summaries) {
    const tag = tagEntity(summary.canonical, summary.label);
    for (const review of reviews) {
      if (reviewHasTag(review.tags, summary.canonical)) {
        edges.push({
          relation: "review-tag",
          from: reviewEntity(review),
          to: tag,
          source: "shared-canonical-tag",
          explanation: `"${review.titleAr}" is tagged #${summary.label}.`,
        });
      }
    }
  }
  return edges;
}

/** Tag ↔ Tag — two tags are related when they co-occur on the same
 *  review often enough to be a real pattern, not a coincidence. Threshold
 *  matches the same MIN_REVIEWS_FOR_TAG_PAGE-style conservatism used
 *  elsewhere: co-occur on >=2 reviews. */
export function buildTagTagEdges(reviews: ReviewRef[], minCooccurrence = 2): Edge[] {
  const summaries = buildTagSummaries(reviews.map((r) => r.tags));
  const canonicalToLabel = new Map(summaries.map((s) => [s.canonical, s.label]));
  const validCanonicals = new Set(summaries.map((s) => s.canonical));

  const cooccurrence = new Map<string, number>(); // "tagA|tagB" (sorted) -> count
  for (const review of reviews) {
    const canonicalTags = [...new Set(review.tags.map(normalizeTag))].filter((t) => validCanonicals.has(t));
    for (let i = 0; i < canonicalTags.length; i++) {
      for (let j = i + 1; j < canonicalTags.length; j++) {
        const [a, b] = [canonicalTags[i], canonicalTags[j]].sort();
        const key = `${a}|${b}`;
        cooccurrence.set(key, (cooccurrence.get(key) ?? 0) + 1);
      }
    }
  }

  const edges: Edge[] = [];
  for (const [key, count] of cooccurrence) {
    if (count < minCooccurrence) continue;
    const [a, b] = key.split("|");
    edges.push({
      relation: "tag-tag",
      from: tagEntity(a, canonicalToLabel.get(a)!),
      to: tagEntity(b, canonicalToLabel.get(b)!),
      source: "shared-canonical-tag",
      explanation: `#${canonicalToLabel.get(a)} and #${canonicalToLabel.get(b)} co-occur on ${count} review(s).`,
    });
  }
  return edges;
}

/** Category ↔ Category — related when they share a meaningful number of
 *  reviews carrying the same canonical tag (a real cross-category topical
 *  bridge, e.g. "NVIDIA" tagged reviews split across ai-models/companies). */
export function buildCategoryCategoryEdges(reviews: ReviewRef[], minSharedTaggedReviews = 2): Edge[] {
  const summaries = buildTagSummaries(reviews.map((r) => r.tags));
  const validCanonicals = new Set(summaries.map((s) => s.canonical));

  // For each tag, which categories does it appear in, and how many times?
  const tagCategoryCounts = new Map<string, Map<string, { count: number; category: CategoryRef }>>();
  for (const review of reviews) {
    const canonicalTags = [...new Set(review.tags.map(normalizeTag))].filter((t) => validCanonicals.has(t));
    for (const tag of canonicalTags) {
      if (!tagCategoryCounts.has(tag)) tagCategoryCounts.set(tag, new Map());
      const byCategory = tagCategoryCounts.get(tag)!;
      const existing = byCategory.get(review.category.id);
      byCategory.set(review.category.id, { count: (existing?.count ?? 0) + 1, category: review.category });
    }
  }

  const pairSharedTags = new Map<string, { pairCategories: [CategoryRef, CategoryRef]; tags: string[] }>();
  for (const [tag, byCategory] of tagCategoryCounts) {
    const categories = [...byCategory.values()].filter((c) => c.count > 0).map((c) => c.category);
    for (let i = 0; i < categories.length; i++) {
      for (let j = i + 1; j < categories.length; j++) {
        const [a, b] = [categories[i], categories[j]].sort((x, y) => x.id.localeCompare(y.id));
        const key = `${a.id}|${b.id}`;
        if (!pairSharedTags.has(key)) pairSharedTags.set(key, { pairCategories: [a, b], tags: [] });
        pairSharedTags.get(key)!.tags.push(tag);
      }
    }
  }

  const edges: Edge[] = [];
  for (const { pairCategories: [a, b], tags } of pairSharedTags.values()) {
    if (tags.length < minSharedTaggedReviews) continue;
    edges.push({
      relation: "category-category",
      from: categoryEntity(a),
      to: categoryEntity(b),
      source: "shared-category",
      explanation: `${a.nameAr} and ${b.nameAr} share ${tags.length} tag(s) in common (e.g. ${tags.slice(0, 3).join(", ")}).`,
    });
  }
  return edges;
}

/** Author ↔ Review — direct, from Review.authorSlug. This is the
 *  "published expertise" signal: which topics/categories an author has
 *  actually written in, derived from their real byline, not assigned. */
export function buildAuthorReviewEdges(reviews: ReviewRef[], authors: AuthorRef[]): Edge[] {
  const authorBySlug = new Map(authors.map((a) => [a.slug, a]));
  const edges: Edge[] = [];
  for (const review of reviews) {
    const author = authorBySlug.get(review.authorSlug);
    if (!author) continue; // an authorSlug not in the known AUTHORS config — data issue, not a graph fact to invent
    edges.push({
      relation: "author-review",
      from: authorEntity(author),
      to: reviewEntity(review),
      source: "Review.authorSlug",
      explanation: `${author.nameAr} is the byline author of "${review.titleAr}".`,
    });
  }
  return edges;
}
