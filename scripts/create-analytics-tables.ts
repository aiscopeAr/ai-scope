import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "DailyStats" (
      "id" TEXT NOT NULL,
      "date" TIMESTAMP(3) NOT NULL,
      "pageViews" INTEGER NOT NULL DEFAULT 0,
      "uniqueArticles" INTEGER NOT NULL DEFAULT 0,
      "promptsCopied" INTEGER NOT NULL DEFAULT 0,
      "toolClicks" INTEGER NOT NULL DEFAULT 0,
      "articlesPublished" INTEGER NOT NULL DEFAULT 0,
      "promptsGenerated" INTEGER NOT NULL DEFAULT 0,
      "topArticleSlug" TEXT,
      "topArticleViews" INTEGER NOT NULL DEFAULT 0,
      "topPromptSlug" TEXT,
      "topPromptViews" INTEGER NOT NULL DEFAULT 0,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "DailyStats_pkey" PRIMARY KEY ("id")
    )
  `);
  await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "DailyStats_date_key" ON "DailyStats"("date")`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "DailyStats_date_idx" ON "DailyStats"("date")`);
  console.log("✅ DailyStats table created");

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "WeeklyReport" (
      "id" TEXT NOT NULL,
      "weekStart" TIMESTAMP(3) NOT NULL,
      "weekEnd" TIMESTAMP(3) NOT NULL,
      "summary" TEXT NOT NULL,
      "insights" JSONB NOT NULL,
      "topContent" JSONB NOT NULL,
      "stats" JSONB NOT NULL,
      "sentAt" TIMESTAMP(3),
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "WeeklyReport_pkey" PRIMARY KEY ("id")
    )
  `);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "WeeklyReport_weekStart_idx" ON "WeeklyReport"("weekStart")`);
  console.log("✅ WeeklyReport table created");
}

main().catch(console.error).finally(() => prisma.$disconnect());
