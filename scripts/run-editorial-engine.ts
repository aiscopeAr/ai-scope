/**
 * scripts/run-editorial-engine.ts
 *
 * CLI runner for the Editorial Validation Engine. Pulls every published
 * (and draft) piece of content across all 4 supported content types,
 * builds the shared EditorialContext (linkable-slug sets, sibling
 * slugs/titles, inbound-link sets), runs the full DEFAULT_RULES set
 * against each, and prints a full quality report plus an aggregate score.
 *
 * Run with: npx tsx scripts/run-editorial-engine.ts
 */
import { PrismaClient } from "@prisma/client";
import {
  DEFAULT_RULES,
  evaluateAll,
  scoreReport,
  canPublish,
  reviewToSubject,
  comparisonToSubject,
  aiToolToSubject,
  promptToSubject,
  type EditorialContext,
  type EditorialSubject,
  type EvaluationReport,
} from "../lib/editorial-engine";
const prisma = new PrismaClient();

async function main() {
  const [reviews, comparisons, aiTools, prompts, categories] = await Promise.all([
    prisma.review.findMany({
      select: {
        id: true, slug: true, titleAr: true, summary: true, content: true,
        seoTitle: true, seoDescription: true, faq: true, published: true,
        createdAt: true, updatedAt: true,
      },
    }),
    prisma.comparison.findMany({
      include: { sides: { include: { tool: { select: { published: true } } } } },
    }),
    prisma.aITool.findMany({
      select: {
        id: true, slug: true, name: true, tagline: true, descriptionAr: true, contentAr: true,
        website: true, pricing: true, arabicSupport: true, hasApi: true,
        seoTitle: true, seoDescription: true, faq: true, published: true,
        createdAt: true, updatedAt: true, lastUpdated: true,
        comparisons: { select: { id: true } },
        prompts: { select: { id: true } },
      },
    }),
    prisma.prompt.findMany({
      select: {
        id: true, slug: true, titleAr: true, description: true, body: true,
        toolId: true, tool: { select: { published: true } }, published: true,
        createdAt: true, updatedAt: true,
      },
    }),
    prisma.category.findMany({ select: { slug: true } }),
  ]);

  // ---- Build subjects ----
  const reviewSubjects = reviews.map(reviewToSubject);
  const comparisonSubjects = comparisons.map(comparisonToSubject);
  const promptSubjects = prompts.map(promptToSubject);
  // aiToolToSubject only knows about AITool's own columns (adapters stay
  // pure/shape-only) — the ComparisonSide/Prompt relation counts are a
  // separate DB join, so patch those two facts on right after building
  // each subject rather than smuggling extra params through the adapter.
  const aiToolSubjects = aiTools.map((t) => {
    const subject = aiToolToSubject(t);
    subject.facts.hasComparisonRelation = t.comparisons.length > 0;
    subject.facts.hasPromptRelation = t.prompts.length > 0;
    return subject;
  });

  const allSubjects: EditorialSubject[] = [...reviewSubjects, ...comparisonSubjects, ...aiToolSubjects, ...promptSubjects];

  // ---- Build shared linkable-slug sets (reusing the exact site convention) ----
  const linkableSlugs = {
    review: new Set(reviews.filter((r) => r.published).map((r) => r.slug)),
    tool: new Set(aiTools.filter((t) => t.published).map((t) => t.slug)),
    compare: new Set(comparisons.filter((c) => c.published).map((c) => c.slug)),
    prompt: new Set(prompts.filter((p) => p.published).map((p) => p.slug)),
    category: new Set(categories.map((c) => c.slug)),
    tag: new Set<string>(),
  };

  // ---- Build inbound-linked-slug set (for orphan-page detection) ----
  // Combines [[...]] token targets with DB-relation-driven links
  // (ComparisonSide, Prompt.toolId) — a tool is not an orphan if a
  // comparison or prompt points at it via FK, even with zero [[...]] tokens.
  const inboundLinkedSlugs = new Set<string>();
  for (const subject of allSubjects) {
    for (const link of subject.outboundLinks) {
      inboundLinkedSlugs.add(link.slug);
    }
  }
  for (const t of aiTools) {
    if (t.comparisons.length > 0 || t.prompts.length > 0) inboundLinkedSlugs.add(t.slug);
  }

  // ---- Build sibling slug/title maps per content kind ----
  function siblingMapsFor(kind: EditorialSubject["kind"]) {
    const subjects = allSubjects.filter((s) => s.kind === kind);
    return {
      siblingSlugs: new Set(subjects.map((s) => s.slug)),
      siblingTitles: new Map(subjects.map((s) => [s.slug, s.title] as const)),
    };
  }
  const siblingMapsByKind = {
    review: siblingMapsFor("review"),
    comparison: siblingMapsFor("comparison"),
    aiTool: siblingMapsFor("aiTool"),
    prompt: siblingMapsFor("prompt"),
  };

  const now = new Date();
  const contextFor = (subject: EditorialSubject): EditorialContext => ({
    siblingSlugs: siblingMapsByKind[subject.kind].siblingSlugs,
    siblingTitles: siblingMapsByKind[subject.kind].siblingTitles,
    linkableSlugs,
    inboundLinkedSlugs,
    now,
  });

  const reports = evaluateAll(allSubjects, contextFor, DEFAULT_RULES);

  // ---- Print per-subject findings (errors/warnings only, to keep output readable) ----
  console.log("=== Editorial Engine — Findings (errors & warnings only) ===\n");
  let totalErrors = 0;
  let totalWarnings = 0;
  const blockedSubjects: EvaluationReport[] = [];

  for (const report of reports) {
    const issues = report.results.filter((r) => r.status !== "PASS");
    totalErrors += report.errorCount;
    totalWarnings += report.warningCount;
    const decision = canPublish(report, "block-on-error");
    if (!decision.allowed) blockedSubjects.push(report);

    if (issues.length > 0) {
      console.log(`${report.subject.kind}:${report.subject.slug} — ${report.errorCount} error(s), ${report.warningCount} warning(s)`);
      for (const issue of issues) {
        console.log(`  [${issue.status}] ${issue.ruleId}: ${issue.explanation}`);
      }
    }
  }

  // ---- Aggregate quality score ----
  console.log("\n=== Quality Scores by Content Type ===\n");
  const byKind: Record<string, EvaluationReport[]> = { review: [], comparison: [], aiTool: [], prompt: [] };
  for (const r of reports) byKind[r.subject.kind].push(r);

  const kindAverages: Record<string, number> = {};
  for (const [kind, kindReports] of Object.entries(byKind)) {
    if (kindReports.length === 0) continue;
    const scores = kindReports.map(scoreReport);
    const avgOverall = Math.round(scores.reduce((s, x) => s + x.overall, 0) / scores.length);
    kindAverages[kind] = avgOverall;
    console.log(`${kind} (${kindReports.length} items): average overall quality = ${avgOverall}/100`);

    const categoryKeys = Object.keys(scores[0].categories) as (keyof typeof scores[0]["categories"])[];
    for (const cat of categoryKeys) {
      const avg = Math.round(scores.reduce((s, x) => s + x.categories[cat], 0) / scores.length);
      console.log(`    ${cat}: ${avg}/100`);
    }
  }

  const siteWideOverall = Math.round(Object.values(kindAverages).reduce((a, b) => a + b, 0) / Object.values(kindAverages).length);

  console.log(`\n=== Overall Lumiq Quality Score: ${siteWideOverall}/100 ===`);
  console.log(`\nTotal items evaluated: ${allSubjects.length}`);
  console.log(`Total errors: ${totalErrors}`);
  console.log(`Total warnings: ${totalWarnings}`);
  console.log(`Items that would be BLOCKED under "block-on-error" policy: ${blockedSubjects.length}`);

  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
