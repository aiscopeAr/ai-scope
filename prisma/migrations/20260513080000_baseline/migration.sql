-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateExtension
-- Present on the live database already (installed prior to migration
-- tracking); included here so a fresh database replaying this baseline
-- from empty also has it, matching schema.prisma's `extensions = [vector]`
-- declaration. IF NOT EXISTS makes this a no-op against the current live
-- database, where it is already installed.
CREATE EXTENSION IF NOT EXISTS "vector";

-- CreateTable
CREATE TABLE "public"."AITool" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "tagline" TEXT,
    "descriptionAr" TEXT NOT NULL,
    "website" TEXT,
    "logoUrl" TEXT,
    "category" TEXT NOT NULL DEFAULT 'other',
    "pricing" TEXT NOT NULL DEFAULT 'freemium',
    "pros" TEXT[],
    "cons" TEXT[],
    "useCases" TEXT[],
    "featuredAt" TIMESTAMP(3),
    "published" BOOLEAN NOT NULL DEFAULT true,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "arabicSupport" BOOLEAN NOT NULL DEFAULT false,
    "contentAr" TEXT,
    "editorPick" BOOLEAN NOT NULL DEFAULT false,
    "faq" JSONB,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "hasApi" BOOLEAN NOT NULL DEFAULT false,
    "imageAlt" TEXT,
    "lastUpdated" TIMESTAMP(3),
    "likes" INTEGER NOT NULL DEFAULT 0,
    "monthlyPrice" DOUBLE PRECISION,
    "pricingDetails" TEXT,
    "relatedTopics" TEXT[],
    "releaseDate" TIMESTAMP(3),
    "screenshots" TEXT[],
    "seoDescription" TEXT,
    "seoTitle" TEXT,
    "sourceUrl" TEXT,
    "tags" TEXT[],
    "toolCategory" TEXT NOT NULL DEFAULT 'other',

    CONSTRAINT "AITool_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AdSlot" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'script',
    "code" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdSlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AuthorMemory" (
    "id" TEXT NOT NULL,
    "authorSlug" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "sourceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuthorMemory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Comparison" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summaryAr" TEXT NOT NULL,
    "verdict" TEXT,
    "criteria" JSONB,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "methodology" TEXT,
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "Comparison_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ComparisonSide" (
    "id" TEXT NOT NULL,
    "comparisonId" TEXT NOT NULL,
    "toolId" TEXT NOT NULL,
    "score" INTEGER,
    "notes" TEXT,
    "bestFor" TEXT,
    "strengths" TEXT[],
    "weaknesses" TEXT[],
    "notRecommendedFor" TEXT,

    CONSTRAINT "ComparisonSide_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DailyStats" (
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
);

-- CreateTable
CREATE TABLE "public"."NewsItem" (
    "id" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "sourceName" TEXT NOT NULL,
    "sourceId" TEXT,
    "imageUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "clusterId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NewsItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."NewsletterSubscriber" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "source" TEXT NOT NULL DEFAULT 'website',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NewsletterSubscriber_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Prompt" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "titleAr" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "toolId" TEXT,
    "tags" TEXT[],
    "slug" TEXT NOT NULL,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "bodyAr" TEXT,

    CONSTRAINT "Prompt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Review" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "titleAr" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "authorSlug" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "tags" TEXT[],
    "keywords" TEXT[],
    "faq" JSONB,
    "imageUrl" TEXT,
    "imageAlt" TEXT,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "sources" JSONB NOT NULL DEFAULT '[]',
    "relatedIds" TEXT[],
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "embedding" vector,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ReviewMetrics" (
    "id" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "avgReadTime" INTEGER,
    "bounceRate" DOUBLE PRECISION,
    "scrollDepth" DOUBLE PRECISION,
    "shareCount" INTEGER NOT NULL DEFAULT 0,
    "qualityScore" DOUBLE PRECISION,
    "trainingUsed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReviewMetrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ReviewQueue" (
    "id" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "authorSlug" TEXT NOT NULL,
    "titleAr" TEXT,
    "contentAr" TEXT,
    "summaryAr" TEXT,
    "tags" TEXT[],
    "keywords" TEXT[],
    "faq" JSONB,
    "imageAlt" TEXT,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "slug" TEXT,
    "imageUrl" TEXT,
    "featuredImagePrompt" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "failureReason" TEXT,
    "processedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReviewQueue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SocialAccount" (
    "id" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "credentials" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SocialPost" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "caption" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "sentAt" TIMESTAMP(3),
    "errorMsg" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewId" TEXT NOT NULL,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "externalMessageId" TEXT,
    "lastAttemptAt" TIMESTAMP(3),
    "nextAttemptAt" TIMESTAMP(3),
    "sendingAt" TIMESTAMP(3),

    CONSTRAINT "SocialPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Source" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "rssUrl" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 5,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "lastSyncedAt" TIMESTAMP(3),
    "website" TEXT,

    CONSTRAINT "Source_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SourceRun" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "fetched" INTEGER NOT NULL DEFAULT 0,
    "added" INTEGER NOT NULL DEFAULT 0,
    "skipped" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SourceRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SyndicationPost" (
    "id" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "remotePostId" TEXT,
    "remoteUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "errorMsg" TEXT,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SyndicationPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SystemSetting" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemSetting_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "public"."ToolEvent" (
    "id" TEXT NOT NULL,
    "toolId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ToolEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TrendingKeyword" (
    "id" TEXT NOT NULL,
    "keyword" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "type" TEXT NOT NULL DEFAULT 'tag',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrendingKeyword_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WeeklyReport" (
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
);

-- CreateIndex
CREATE INDEX "AITool_featured_published_idx" ON "public"."AITool"("featured" ASC, "published" ASC);

-- CreateIndex
CREATE INDEX "AITool_published_viewCount_idx" ON "public"."AITool"("published" ASC, "viewCount" ASC);

-- CreateIndex
CREATE INDEX "AITool_slug_idx" ON "public"."AITool"("slug" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "AITool_slug_key" ON "public"."AITool"("slug" ASC);

-- CreateIndex
CREATE INDEX "AITool_toolCategory_published_idx" ON "public"."AITool"("toolCategory" ASC, "published" ASC);

-- CreateIndex
CREATE INDEX "AdSlot_position_enabled_idx" ON "public"."AdSlot"("position" ASC, "enabled" ASC);

-- CreateIndex
CREATE INDEX "AuthorMemory_authorSlug_type_idx" ON "public"."AuthorMemory"("authorSlug" ASC, "type" ASC);

-- CreateIndex
CREATE INDEX "AuthorMemory_authorSlug_weight_idx" ON "public"."AuthorMemory"("authorSlug" ASC, "weight" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "public"."Category"("slug" ASC);

-- CreateIndex
CREATE INDEX "Comparison_published_idx" ON "public"."Comparison"("published" ASC);

-- CreateIndex
CREATE INDEX "Comparison_slug_idx" ON "public"."Comparison"("slug" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Comparison_slug_key" ON "public"."Comparison"("slug" ASC);

-- CreateIndex
CREATE INDEX "ComparisonSide_comparisonId_idx" ON "public"."ComparisonSide"("comparisonId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "ComparisonSide_comparisonId_toolId_key" ON "public"."ComparisonSide"("comparisonId" ASC, "toolId" ASC);

-- CreateIndex
CREATE INDEX "ComparisonSide_toolId_idx" ON "public"."ComparisonSide"("toolId" ASC);

-- CreateIndex
CREATE INDEX "DailyStats_date_idx" ON "public"."DailyStats"("date" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "DailyStats_date_key" ON "public"."DailyStats"("date" ASC);

-- CreateIndex
CREATE INDEX "NewsItem_clusterId_idx" ON "public"."NewsItem"("clusterId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "NewsItem_sourceUrl_key" ON "public"."NewsItem"("sourceUrl" ASC);

-- CreateIndex
CREATE INDEX "NewsItem_status_idx" ON "public"."NewsItem"("status" ASC);

-- CreateIndex
CREATE INDEX "NewsletterSubscriber_createdAt_idx" ON "public"."NewsletterSubscriber"("createdAt" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "NewsletterSubscriber_email_key" ON "public"."NewsletterSubscriber"("email" ASC);

-- CreateIndex
CREATE INDEX "NewsletterSubscriber_status_idx" ON "public"."NewsletterSubscriber"("status" ASC);

-- CreateIndex
CREATE INDEX "Prompt_category_published_idx" ON "public"."Prompt"("category" ASC, "published" ASC);

-- CreateIndex
CREATE INDEX "Prompt_featured_published_idx" ON "public"."Prompt"("featured" ASC, "published" ASC);

-- CreateIndex
CREATE INDEX "Prompt_slug_idx" ON "public"."Prompt"("slug" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Prompt_slug_key" ON "public"."Prompt"("slug" ASC);

-- CreateIndex
CREATE INDEX "Prompt_toolId_idx" ON "public"."Prompt"("toolId" ASC);

-- CreateIndex
CREATE INDEX "Review_authorSlug_idx" ON "public"."Review"("authorSlug" ASC);

-- CreateIndex
CREATE INDEX "Review_categoryId_idx" ON "public"."Review"("categoryId" ASC);

-- CreateIndex
CREATE INDEX "Review_published_publishedAt_idx" ON "public"."Review"("published" ASC, "publishedAt" ASC);

-- CreateIndex
CREATE INDEX "Review_slug_idx" ON "public"."Review"("slug" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Review_slug_key" ON "public"."Review"("slug" ASC);

-- CreateIndex
CREATE INDEX "ReviewMetrics_qualityScore_idx" ON "public"."ReviewMetrics"("qualityScore" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "ReviewMetrics_reviewId_key" ON "public"."ReviewMetrics"("reviewId" ASC);

-- CreateIndex
CREATE INDEX "ReviewMetrics_trainingUsed_idx" ON "public"."ReviewMetrics"("trainingUsed" ASC);

-- CreateIndex
CREATE INDEX "ReviewQueue_authorSlug_idx" ON "public"."ReviewQueue"("authorSlug" ASC);

-- CreateIndex
CREATE INDEX "ReviewQueue_status_idx" ON "public"."ReviewQueue"("status" ASC);

-- CreateIndex
CREATE INDEX "SocialAccount_platform_enabled_idx" ON "public"."SocialAccount"("platform" ASC, "enabled" ASC);

-- CreateIndex
CREATE INDEX "SocialPost_accountId_idx" ON "public"."SocialPost"("accountId" ASC);

-- CreateIndex
CREATE INDEX "SocialPost_reviewId_idx" ON "public"."SocialPost"("reviewId" ASC);

-- CreateIndex
CREATE INDEX "SocialPost_status_idx" ON "public"."SocialPost"("status" ASC);

-- CreateIndex
CREATE INDEX "SocialPost_status_nextAttemptAt_idx" ON "public"."SocialPost"("status" ASC, "nextAttemptAt" ASC);

-- CreateIndex
CREATE INDEX "Source_enabled_idx" ON "public"."Source"("enabled" ASC);

-- CreateIndex
CREATE INDEX "SourceRun_sourceId_createdAt_idx" ON "public"."SourceRun"("sourceId" ASC, "createdAt" ASC);

-- CreateIndex
CREATE INDEX "SyndicationPost_reviewId_idx" ON "public"."SyndicationPost"("reviewId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "SyndicationPost_reviewId_target_key" ON "public"."SyndicationPost"("reviewId" ASC, "target" ASC);

-- CreateIndex
CREATE INDEX "SyndicationPost_status_idx" ON "public"."SyndicationPost"("status" ASC);

-- CreateIndex
CREATE INDEX "ToolEvent_createdAt_idx" ON "public"."ToolEvent"("createdAt" ASC);

-- CreateIndex
CREATE INDEX "ToolEvent_toolId_type_idx" ON "public"."ToolEvent"("toolId" ASC, "type" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "TrendingKeyword_keyword_type_key" ON "public"."TrendingKeyword"("keyword" ASC, "type" ASC);

-- CreateIndex
CREATE INDEX "TrendingKeyword_type_count_idx" ON "public"."TrendingKeyword"("type" ASC, "count" ASC);

-- CreateIndex
CREATE INDEX "WeeklyReport_weekStart_idx" ON "public"."WeeklyReport"("weekStart" ASC);

-- AddForeignKey
ALTER TABLE "public"."ComparisonSide" ADD CONSTRAINT "ComparisonSide_comparisonId_fkey" FOREIGN KEY ("comparisonId") REFERENCES "public"."Comparison"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ComparisonSide" ADD CONSTRAINT "ComparisonSide_toolId_fkey" FOREIGN KEY ("toolId") REFERENCES "public"."AITool"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."NewsItem" ADD CONSTRAINT "NewsItem_clusterId_fkey" FOREIGN KEY ("clusterId") REFERENCES "public"."ReviewQueue"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."NewsItem" ADD CONSTRAINT "NewsItem_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "public"."Source"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Prompt" ADD CONSTRAINT "Prompt_toolId_fkey" FOREIGN KEY ("toolId") REFERENCES "public"."AITool"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Review" ADD CONSTRAINT "Review_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ReviewMetrics" ADD CONSTRAINT "ReviewMetrics_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "public"."Review"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SocialPost" ADD CONSTRAINT "SocialPost_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "public"."SocialAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SocialPost" ADD CONSTRAINT "SocialPost_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "public"."Review"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SourceRun" ADD CONSTRAINT "SourceRun_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "public"."Source"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SyndicationPost" ADD CONSTRAINT "SyndicationPost_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "public"."Review"("id") ON DELETE CASCADE ON UPDATE CASCADE;

