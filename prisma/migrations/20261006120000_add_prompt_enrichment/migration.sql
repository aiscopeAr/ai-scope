-- Prompts-library redesign: additive enrichment columns on "Prompt".
-- All nullable or defaulted, so existing rows are unaffected and this is a
-- safe, non-blocking migration.
ALTER TABLE "Prompt"
  ADD COLUMN "exampleImageUrl" TEXT,
  ADD COLUMN "imagePrompt" TEXT,
  ADD COLUMN "modelHint" TEXT,
  ADD COLUMN "variations" JSONB,
  ADD COLUMN "tips" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "useCases" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "quality" INTEGER NOT NULL DEFAULT 0;
