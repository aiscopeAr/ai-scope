/**
 * scripts/export-training-data.ts
 *
 * מייצא כתבות איכותיות כ-training data לfine-tuning
 *
 * הרצה:
 *   npx tsx scripts/export-training-data.ts
 *   npx tsx scripts/export-training-data.ts --author=zayd --min-score=0.6
 *   npx tsx scripts/export-training-data.ts --dry-run
 *
 * פלט:
 *   training-data/zayd_v1.jsonl
 *   training-data/lina_v1.jsonl
 *   training-data/summary.json
 */

import { PrismaClient } from "@prisma/client";
import { writeFileSync, mkdirSync, existsSync } from "fs";
import { AUTHORS, type AuthorSlug } from "../lib/authors";

const prisma = new PrismaClient();

const args = process.argv.slice(2);
const isDryRun = args.includes("--dry-run");
const authorFilter = args.find((a) => a.startsWith("--author="))?.split("=")[1];
const minScore = parseFloat(args.find((a) => a.startsWith("--min-score="))?.split("=")[1] ?? "0.5");

async function main() {
  console.log("🔍 מחפש כתבות איכותיות...");
  console.log(`  min qualityScore: ${minScore}`);
  if (authorFilter) console.log(`  author filter: ${authorFilter}`);
  if (isDryRun) console.log("  [DRY RUN — לא כותב קבצים]");

  const authors = authorFilter ? [authorFilter as AuthorSlug] : (Object.keys(AUTHORS) as AuthorSlug[]);
  const summary: Record<string, { total: number; exported: number; avgScore: number }> = {};

  for (const authorSlug of authors) {
    const author = AUTHORS[authorSlug];
    if (!author) continue;

    // שלוף כתבות עם qualityScore מספיק גבוה
    const reviews = await prisma.review.findMany({
      where: {
        authorSlug,
        published: true,
        OR: [
          { metrics: { qualityScore: { gte: minScore } } },
          // אם אין metrics עדיין, קח לפי viewCount
          { metrics: null, viewCount: { gte: 50 } },
        ],
      },
      include: {
        metrics: true,
        category: { select: { nameAr: true, slug: true } },
      },
      orderBy: { viewCount: "desc" },
    });

    console.log(`\n📝 ${author.nameAr} (${authorSlug}): ${reviews.length} כתבות`);

    if (reviews.length < 10) {
      console.log(`  ⚠️  פחות מ-10 כתבות — דלג (צריך לפחות 10 לfine-tuning)`);
      summary[authorSlug] = { total: reviews.length, exported: 0, avgScore: 0 };
      continue;
    }

    const trainingExamples: object[] = [];
    let totalScore = 0;

    for (const review of reviews) {
      const score = review.metrics?.qualityScore ?? (review.viewCount / 200);
      totalScore += score;

      // פורמט OpenAI fine-tuning
      const example = {
        messages: [
          {
            role: "system",
            content: author.systemPrompt,
          },
          {
            role: "user",
            content: buildUserMessage(review),
          },
          {
            role: "assistant",
            content: JSON.stringify({
              titleAr: review.titleAr,
              summaryAr: review.summary,
              contentAr: review.content,
              tags: review.tags,
              keywords: review.keywords,
              seoTitle: review.seoTitle ?? review.titleAr,
              seoDescription: review.seoDescription ?? review.summary.slice(0, 160),
              isAiRelated: true,
              suggestedCategory: review.category.slug,
              faq: Array.isArray(review.faq) ? review.faq : [],
            }),
          },
        ],
        // metadata — לא חלק מ-JSONL הרשמי אבל שימושי לניתוח
        _metadata: {
          reviewId: review.id,
          qualityScore: score,
          viewCount: review.viewCount,
          publishedAt: review.publishedAt,
        },
      };

      trainingExamples.push(example);

      // סמן שהכתבה שימשה לאימון
      if (!isDryRun) {
        await prisma.reviewMetrics.upsert({
          where: { reviewId: review.id },
          create: { reviewId: review.id, trainingUsed: true, qualityScore: score },
          update: { trainingUsed: true },
        });
      }
    }

    const avgScore = totalScore / reviews.length;
    summary[authorSlug] = { total: reviews.length, exported: trainingExamples.length, avgScore };

    console.log(`  ✅ ${trainingExamples.length} דוגמאות, avgScore: ${avgScore.toFixed(2)}`);

    if (!isDryRun) {
      if (!existsSync("training-data")) mkdirSync("training-data");

      // JSONL — שורה אחת לכל דוגמה (בלי ה-_metadata)
      const jsonl = trainingExamples
        .map((ex) => {
          const { _metadata: _, ...clean } = ex as { _metadata: unknown; messages: unknown[] };
          return JSON.stringify(clean);
        })
        .join("\n");

      const version = `v${new Date().toISOString().slice(0, 7).replace("-", "")}`;
      const filename = `training-data/${authorSlug}_${version}.jsonl`;
      writeFileSync(filename, jsonl, "utf-8");
      console.log(`  💾 נשמר: ${filename}`);
    }
  }

  // סיכום
  console.log("\n📊 סיכום:");
  for (const [slug, s] of Object.entries(summary)) {
    console.log(`  ${slug}: ${s.exported}/${s.total} כתבות (avgScore: ${s.avgScore.toFixed(2)})`);
  }

  if (!isDryRun) {
    writeFileSync(
      "training-data/summary.json",
      JSON.stringify({ exportedAt: new Date(), minScore, summary }, null, 2),
    );
    console.log("\n✅ training-data/summary.json נשמר");
  }

  const totalExported = Object.values(summary).reduce((a, b) => a + b.exported, 0);
  if (totalExported >= 10) {
    console.log("\n🚀 מוכן לfine-tuning! הרץ:");
    console.log("   openai api fine_tuning.jobs.create \\");
    console.log("     -t training-data/zayd_*.jsonl \\");
    console.log("     -m gpt-4o-mini-2024-07-18");
  } else {
    console.log(`\n⏳ צריך עוד כתבות (יש ${totalExported}, צריך 10+)`);
  }
}

function buildUserMessage(review: {
  titleAr: string;
  tags: string[];
  keywords: string[];
  category: { nameAr: string };
}): string {
  return `כתוב תקרבה עמוקה בנושא: "${review.titleAr}"
קטגוריה: ${review.category.nameAr}
תגים: ${review.tags.slice(0, 5).join("، ")}
[זהו דוגמת fine-tuning — המשתמש ייצור prompt עם מקורות אמיתיים]`;
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
