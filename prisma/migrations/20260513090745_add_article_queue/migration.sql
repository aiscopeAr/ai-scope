-- CreateTable
CREATE TABLE "public"."ArticleQueue" (
    "id" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "rawContent" TEXT NOT NULL,
    "translatedContent" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(3),

    CONSTRAINT "ArticleQueue_pkey" PRIMARY KEY ("id")
);
