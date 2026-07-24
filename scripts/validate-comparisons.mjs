/**
 * scripts/validate-comparisons.mjs
 *
 * Comparison integrity validator. Run with: node scripts/validate-comparisons.mjs
 *
 * Checks every published (and draft) Comparison against the same rules
 * enforced at creation/edit time (lib/comparison-helpers.ts), plus checks
 * that can only be done by looking at the whole dataset at once:
 *   - every comparison has >= 2 sides
 *   - no duplicate tool within a comparison
 *   - every side's tool exists and is published
 *   - every score is in the valid 0-100 range
 *   - every slug is URL-safe and unique
 *   - every [[compare:slug|...]] internal-link token across all published
 *     Review/AITool content resolves to a comparison that actually exists
 *
 * Exits with a non-zero status if any FAIL is found, so this can be wired
 * into a CI/pre-deploy check later without further changes.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const SLUG_PATTERN = /^[a-z0-9-]+$/;
const INLINE_COMPARE_LINK = /\[\[compare:([^\]|]+)\|[^\]]+\]\]/g;

let failCount = 0;
let warnCount = 0;

function fail(msg) { console.error(`FAIL  ${msg}`); failCount++; }
function warn(msg) { console.warn(`WARN  ${msg}`); warnCount++; }
function ok(msg) { console.log(`OK    ${msg}`); }

async function main() {
  const comparisons = await prisma.comparison.findMany({
    include: { sides: { include: { tool: { select: { id: true, slug: true, published: true } } } } },
  });

  console.log(`\n=== Checking ${comparisons.length} comparison(s) ===\n`);

  const seenSlugs = new Map();

  for (const c of comparisons) {
    const label = `${c.slug} (${c.published ? "published" : "draft"})`;

    // 1. slug format
    if (!SLUG_PATTERN.test(c.slug)) {
      fail(`${label}: slug contains characters other than [a-z0-9-]`);
    }

    // 2. slug uniqueness (defense in depth — DB already enforces @unique)
    if (seenSlugs.has(c.slug)) {
      fail(`${label}: duplicate slug also used by comparison ${seenSlugs.get(c.slug)}`);
    } else {
      seenSlugs.set(c.slug, c.id);
    }

    // 3. side count
    if (c.sides.length < 2) {
      fail(`${label}: has ${c.sides.length} side(s), needs >= 2`);
    } else {
      ok(`${label}: ${c.sides.length} sides`);
    }

    // 4. unique tools within the comparison
    const toolIds = c.sides.map((s) => s.tool.id);
    if (new Set(toolIds).size !== toolIds.length) {
      fail(`${label}: contains the same tool more than once`);
    }

    // 5. every side's tool exists and is published
    for (const s of c.sides) {
      if (!s.tool) {
        fail(`${label}: a side references a tool that no longer exists`);
        continue;
      }
      if (!s.tool.published) {
        warn(`${label}: side references unpublished tool "${s.tool.slug}"`);
      }
    }

    // 6. score range
    for (const s of c.sides) {
      if (s.score !== null && (s.score < 0 || s.score > 100)) {
        fail(`${label}: side "${s.tool.slug}" has an out-of-range score (${s.score})`);
      }
    }

    // 7. rendering safety — the fields the detail page dereferences without
    // a null-guard must be present (title, summaryAr); everything else on
    // the page already renders conditionally and is not required here.
    if (!c.title) fail(`${label}: missing required title`);
    if (!c.summaryAr) fail(`${label}: missing required summaryAr`);
  }

  console.log(`\n=== Checking internal [[compare:...]] links across published content ===\n`);

  const validSlugs = new Set(comparisons.filter((c) => c.published).map((c) => c.slug));
  const [reviews, tools] = await Promise.all([
    prisma.review.findMany({ where: { published: true }, select: { slug: true, content: true } }),
    prisma.aITool.findMany({ where: { published: true }, select: { slug: true, contentAr: true } }),
  ]);

  let linkCount = 0;
  for (const r of reviews) {
    for (const m of (r.content ?? "").matchAll(INLINE_COMPARE_LINK)) {
      linkCount++;
      if (!validSlugs.has(m[1])) fail(`review "${r.slug}" links to non-existent/unpublished comparison "${m[1]}"`);
    }
  }
  for (const t of tools) {
    for (const m of (t.contentAr ?? "").matchAll(INLINE_COMPARE_LINK)) {
      linkCount++;
      if (!validSlugs.has(m[1])) fail(`tool "${t.slug}" links to non-existent/unpublished comparison "${m[1]}"`);
    }
  }
  ok(`${linkCount} internal comparison link(s) checked`);

  console.log(`\n=== Summary ===`);
  console.log(`${failCount} failure(s), ${warnCount} warning(s)`);

  await prisma.$disconnect();
  process.exit(failCount > 0 ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
