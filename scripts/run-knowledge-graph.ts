/**
 * scripts/run-knowledge-graph.ts
 *
 * CLI runner for the Knowledge Graph engine. Pulls all published content
 * across every supported entity kind, builds every required edge type
 * from real production data, assembles the deduplicated graph, and prints
 * relationship statistics, isolated/weakly-connected entity detection, and
 * a sample of the per-entity Related Content API in action.
 *
 * Run with: npx tsx scripts/run-knowledge-graph.ts
 */
import { PrismaClient } from "@prisma/client";
import { AUTHORS } from "../lib/authors";
import {
  KnowledgeGraph,
  buildToolComparisonEdges,
  buildToolPromptEdges,
  buildLinkTokenEdges,
  buildReviewTagEdges,
  buildTagTagEdges,
  buildCategoryCategoryEdges,
  buildAuthorReviewEdges,
  buildComparisonComparisonEdges,
  type Entity,
  type EntityKind,
} from "../lib/knowledge-graph";

const prisma = new PrismaClient();

async function main() {
  const [reviews, aiTools, comparisons, prompts, categories] = await Promise.all([
    prisma.review.findMany({
      where: { published: true },
      select: {
        id: true, slug: true, titleAr: true, content: true, tags: true, authorSlug: true,
        category: { select: { id: true, slug: true, nameAr: true } },
      },
    }),
    prisma.aITool.findMany({
      where: { published: true },
      select: { id: true, slug: true, name: true, toolCategory: true, contentAr: true },
    }),
    prisma.comparison.findMany({
      where: { published: true },
      select: {
        id: true, slug: true, title: true,
        sides: { select: { tool: { select: { id: true, slug: true, name: true, toolCategory: true } } } },
      },
    }),
    prisma.prompt.findMany({
      where: { published: true },
      select: {
        id: true, slug: true, titleAr: true, toolId: true,
        tool: { select: { id: true, slug: true, name: true, toolCategory: true } },
      },
    }),
    prisma.category.findMany({ select: { id: true, slug: true, nameAr: true } }),
  ]);

  console.log(`Loaded: ${reviews.length} reviews, ${aiTools.length} tools, ${comparisons.length} comparisons, ${prompts.length} prompts, ${categories.length} categories\n`);

  const graph = new KnowledgeGraph();

  // ---- Tool <-> Comparison (ComparisonSide.toolId) ----
  graph.addEdges(buildToolComparisonEdges(comparisons.map((c) => ({ comparison: c, sides: c.sides }))));

  // ---- Tool <-> Prompt (Prompt.toolId) ----
  graph.addEdges(buildToolPromptEdges(prompts.map((p) => ({ prompt: p, tool: p.tool }))));

  // ---- Comparison <-> Comparison (shared tool category) ----
  graph.addEdges(buildComparisonComparisonEdges(comparisons));

  // ---- Review <-> Tag, Tag <-> Tag ----
  graph.addEdges(buildReviewTagEdges(reviews));
  graph.addEdges(buildTagTagEdges(reviews));

  // ---- Category <-> Category (shared tags across categories) ----
  graph.addEdges(buildCategoryCategoryEdges(reviews));

  // ---- Author <-> Review (Review.authorSlug) ----
  const authorRefs = Object.values(AUTHORS).map((a) => ({ slug: a.slug, nameAr: a.nameAr }));
  graph.addEdges(buildAuthorReviewEdges(reviews, authorRefs));

  // ---- Internal-link-token edges (Review<->Tool, Review<->Comparison, Tool<->Comparison) ----
  const entityBySlug: Record<Extract<EntityKind, "review" | "tool" | "comparison" | "prompt">, Map<string, Entity>> = {
    review: new Map(reviews.map((r) => [r.slug, { kind: "review", id: r.id, slug: r.slug, title: r.titleAr }])),
    tool: new Map(aiTools.map((t) => [t.slug, { kind: "tool", id: t.id, slug: t.slug, title: t.name }])),
    comparison: new Map(comparisons.map((c) => [c.slug, { kind: "comparison", id: c.id, slug: c.slug, title: c.title }])),
    prompt: new Map(prompts.map((p) => [p.slug, { kind: "prompt", id: p.id, slug: p.slug, title: p.titleAr }])),
  };

  function resolveToken(tokenType: string, slug: string): Entity | null {
    const kind = { review: "review", tool: "tool", compare: "comparison", prompt: "prompt" }[tokenType] as keyof typeof entityBySlug | undefined;
    if (!kind) return null;
    return entityBySlug[kind].get(slug) ?? null;
  }

  const linkSources = [
    ...reviews.map((r) => ({ entity: entityBySlug.review.get(r.slug)!, bodyText: r.content })),
    ...aiTools.map((t) => ({ entity: entityBySlug.tool.get(t.slug)!, bodyText: t.contentAr ?? "" })),
  ];
  graph.addEdges(buildLinkTokenEdges(linkSources, resolveToken));

  // ---- Print relationship statistics ----
  console.log("=== Relationship Statistics ===\n");
  const byRelation = new Map<string, number>();
  for (const e of graph.allEdges) byRelation.set(e.relation, (byRelation.get(e.relation) ?? 0) + 1);
  for (const [relation, count] of [...byRelation.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`${relation}: ${count}`);
  }
  console.log(`\nTotal edges: ${graph.stats.totalEdges}`);
  console.log(`Duplicates rejected during build: ${graph.stats.duplicatesRejected}`);
  console.log(`Self-edges rejected during build: ${graph.stats.selfEdgesRejected}`);

  // ---- Isolated / weakly-connected entity detection ----
  console.log("\n=== Isolated & Weakly-Connected Entities ===\n");
  const allEntities: Entity[] = [
    ...reviews.map((r) => entityBySlug.review.get(r.slug)!),
    ...aiTools.map((t) => entityBySlug.tool.get(t.slug)!),
    ...comparisons.map((c) => entityBySlug.comparison.get(c.slug)!),
    ...prompts.map((p) => entityBySlug.prompt.get(p.slug)!),
    ...categories.map((c) => ({ kind: "category" as const, id: c.id, slug: c.slug, title: c.nameAr })),
  ];

  const isolated = allEntities.filter((e) => graph.isIsolated(e));
  const weak = allEntities.filter((e) => graph.isWeaklyConnected(e, 2));

  const isolatedByKind = new Map<string, number>();
  for (const e of isolated) isolatedByKind.set(e.kind, (isolatedByKind.get(e.kind) ?? 0) + 1);
  console.log("Isolated entities (0 edges) by kind:");
  for (const [kind, count] of isolatedByKind) console.log(`  ${kind}: ${count} / ${allEntities.filter((e) => e.kind === kind).length}`);

  const weakByKind = new Map<string, number>();
  for (const e of weak) weakByKind.set(e.kind, (weakByKind.get(e.kind) ?? 0) + 1);
  console.log("\nWeakly-connected entities (1 edge) by kind:");
  for (const [kind, count] of weakByKind) console.log(`  ${kind}: ${count}`);

  console.log(`\nSample isolated entities (first 15):`);
  for (const e of isolated.slice(0, 15)) console.log(`  ${e.kind}:${e.slug}`);

  // ---- Sanity-check the Related Content API on a few real entities ----
  console.log("\n=== Sample Related-Content Queries ===\n");
  const sampleTool = entityBySlug.tool.get("chatgpt");
  if (sampleTool) {
    console.log(`chatgpt — related tools: ${graph.relatedTools(sampleTool).map((e) => e.slug).join(", ") || "(none)"}`);
    console.log(`chatgpt — related comparisons: ${graph.relatedComparisons(sampleTool).map((e) => e.slug).join(", ") || "(none)"}`);
    console.log(`chatgpt — related prompts: ${graph.relatedPrompts(sampleTool).map((e) => e.slug).join(", ") || "(none)"}`);
    console.log(`chatgpt — related reviews: ${graph.relatedReviews(sampleTool).map((e) => e.slug).join(", ") || "(none)"}`);
  }

  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
