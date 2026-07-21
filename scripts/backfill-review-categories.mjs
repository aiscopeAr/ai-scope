/**
 * One-time backfill: reassign categoryId for reviews that were auto-published
 * before the publish-review cron picked a category based on the author's topic.
 * Previously every auto-published review fell back to the first Category row
 * ("companies"), flattening 210/227 reviews into one bucket.
 *
 * Usage: node scripts/backfill-review-categories.mjs [--dry-run]
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const AUTHOR_CATEGORY_CANDIDATES = {
  zayd: ["ai-models", "research"],
  lina: ["companies", "ai-policy"],
  tariq: ["ai-tools"],
  team: ["tutorials"],
};

async function main() {
  const dryRun = process.argv.includes("--dry-run");

  const categories = await prisma.category.findMany({ select: { id: true, slug: true } });
  const categoryBySlug = new Map(categories.map((c) => [c.slug, c.id]));

  const reviews = await prisma.review.findMany({
    where: { published: true },
    select: { id: true, slug: true, authorSlug: true, categoryId: true, category: { select: { slug: true } } },
  });

  let changed = 0;
  const perCategory = {};

  for (const review of reviews) {
    const candidates = AUTHOR_CATEGORY_CANDIDATES[review.authorSlug] ?? [];
    const targetSlug = candidates.find((slug) => categoryBySlug.has(slug));
    if (!targetSlug) continue;

    const targetCategoryId = categoryBySlug.get(targetSlug);
    if (targetCategoryId === review.categoryId) continue; // already correct

    perCategory[targetSlug] = (perCategory[targetSlug] ?? 0) + 1;
    changed++;

    if (!dryRun) {
      await prisma.review.update({ where: { id: review.id }, data: { categoryId: targetCategoryId } });
    }
  }

  console.log(`${dryRun ? "[DRY RUN] " : ""}Reassigned ${changed} of ${reviews.length} reviews`);
  console.log("By target category:", perCategory);

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
