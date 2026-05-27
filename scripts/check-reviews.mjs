import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const [total, published, draft, queueStats, newsStats, sources, lastReview] = await Promise.all([
    prisma.review.count(),
    prisma.review.count({ where: { published: true } }),
    prisma.review.count({ where: { published: false } }),
    prisma.reviewQueue.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.newsItem.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.source.count({ where: { enabled: true } }),
    prisma.review.findFirst({
      where: { published: true },
      orderBy: { publishedAt: "desc" },
      select: { titleAr: true, publishedAt: true, authorSlug: true },
    }),
  ]);

  console.log("\n=== 📰 כתבות ===");
  console.log(`  סה"כ:        ${total}`);
  console.log(`  מפורסמות:    ${published}`);
  console.log(`  טיוטות:      ${draft}`);

  console.log("\n=== 📋 תור כתיבה ===");
  for (const s of queueStats) console.log(`  ${s.status}: ${s._count._all}`);

  console.log("\n=== 📡 חדשות RSS ===");
  for (const s of newsStats) console.log(`  ${s.status}: ${s._count._all}`);

  console.log(`\n=== 🔗 מקורות פעילים: ${sources} ===`);

  if (lastReview) {
    console.log(`\n=== ✅ כתבה אחרונה ===`);
    console.log(`  כותרת: ${lastReview.titleAr}`);
    console.log(`  מחבר:  ${lastReview.authorSlug}`);
    console.log(`  תאריך: ${lastReview.publishedAt?.toLocaleDateString("he-IL")}`);
  }
  console.log("");
}

main().catch(console.error).finally(() => prisma.$disconnect());
