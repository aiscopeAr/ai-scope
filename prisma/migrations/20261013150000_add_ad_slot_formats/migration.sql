-- Phase 1: ad formats, networks, targeting. Additive — existing rows get the
-- defaults (format=inline, network=direct), preserving today's behaviour.
ALTER TABLE "AdSlot" ADD COLUMN "format" TEXT NOT NULL DEFAULT 'inline';
ALTER TABLE "AdSlot" ADD COLUMN "network" TEXT NOT NULL DEFAULT 'direct';
ALTER TABLE "AdSlot" ADD COLUMN "dismissible" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "AdSlot" ADD COLUMN "frequencyHours" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "AdSlot" ADD COLUMN "priority" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "AdSlot" ADD COLUMN "startAt" TIMESTAMP(3);
ALTER TABLE "AdSlot" ADD COLUMN "endAt" TIMESTAMP(3);
ALTER TABLE "AdSlot" ADD COLUMN "pages" TEXT[] DEFAULT ARRAY[]::TEXT[];

CREATE INDEX "AdSlot_format_enabled_idx" ON "AdSlot"("format", "enabled");
