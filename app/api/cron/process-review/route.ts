/**
 * Pick pending ReviewQueue clusters and write deep reviews with OpenAI.
 * Runs once daily (Vercel Hobby). Processes up to MAX_PER_RUN items per invocation
 * so the backlog doesn't pile up.
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { writeReview } from "@/lib/review-openai";
import {
  markReviewProcessing,
  markReviewProcessed,
  markReviewFailed,
} from "@/lib/review-queue";
import { generateReviewImage } from "@/lib/images";
import type { AuthorSlug } from "@/lib/authors";
import { getSetting, SETTING_KEYS, getEditorialV2Mode } from "@/lib/settings";
import { planEditorial, buildShadowDiagnostics } from "@/lib/editorial/planner";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const MAX_RETRIES = 3;

function verifyCronSecret(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Reset stale processing items
  const staleThreshold = new Date(Date.now() - 10 * 60 * 1000);
  await prisma.reviewQueue.updateMany({
    where: { status: "processing", updatedAt: { lt: staleThreshold } },
    data: { status: "pending", failureReason: "Reset from stale processing" },
  });

  const maxPerRun = await getSetting(SETTING_KEYS.MAX_PER_RUN);

  // Editorial V2-A rollout flag — read ONCE per run (config read, not a
  // per-item query). "off" (default) = exact V1 behavior, planner never runs.
  const editorialV2Mode = await getEditorialV2Mode();

  const items = await prisma.reviewQueue.findMany({
    where: {
      OR: [
        { status: "pending" },
        { status: "failed", retryCount: { lt: MAX_RETRIES } },
      ],
    },
    orderBy: { createdAt: "asc" },
    take: maxPerRun,
    include: {
      newsItems: {
        select: { title: true, content: true, sourceUrl: true, sourceName: true },
      },
    },
  });

  if (items.length === 0) {
    return NextResponse.json({ ok: true, message: "No pending review clusters" });
  }

  const results: Array<{ id: string; status: "processed" | "rejected" | "failed"; title?: string; error?: string }> = [];

  for (const item of items) {
    if (item.newsItems.length === 0) {
      await markReviewFailed(item.id, "Cluster has no news items");
      results.push({ id: item.id, status: "failed", error: "No news items" });
      continue;
    }

    try {
      await markReviewProcessing(item.id);

      const sources = item.newsItems.map((n) => ({
        title: n.title,
        content: n.content,
        url: n.sourceUrl,
        name: n.sourceName,
      }));

      const draft = await writeReview(item.topic, sources, item.authorSlug as AuthorSlug);

      if (!draft.isAiRelated) {
        await prisma.reviewQueue.update({
          where: { id: item.id },
          data: { status: "rejected", failureReason: "Not AI-related per AI classifier" },
        });
        results.push({ id: item.id, status: "rejected" });
        continue;
      }

      await markReviewProcessed(item.id, draft);

      // ── Editorial V2-A SHADOW MODE ──────────────────────────────────────
      // When enabled, run the lightweight planner on the SAME in-memory
      // sources and log a structured diagnostics event comparing the proposed
      // V2 plan to the V1 draft. This NEVER changes the V1 draft/output above,
      // runs NO second writer, persists NOTHING, and must never break V1 —
      // hence the fully-guarded try/catch. "on" is not implemented yet (A3),
      // so it behaves as shadow with a warning.
      if (editorialV2Mode !== "off") {
        try {
          const outcome = await planEditorial(item.topic, sources, item.authorSlug as AuthorSlug);
          const diagnostics = buildShadowDiagnostics(item.id, item.topic, outcome, draft.contentAr);
          console.log(`[editorial-v2:shadow] ${JSON.stringify(diagnostics)}`);
          if (editorialV2Mode === "on") {
            console.warn("[editorial-v2] mode=on is not implemented (A3 writer consumption pending) — behaving as shadow; V1 output unchanged.");
          }
        } catch (shadowErr) {
          // Shadow planning is strictly best-effort — it must never affect the
          // V1 article that was already generated and stored above.
          console.error(
            `[editorial-v2:shadow] non-blocking planner/diagnostics failure for queue item ${item.id}:`,
            shadowErr instanceof Error ? shadowErr.message : shadowErr,
          );
        }
      }

      // Generate image immediately while we have time (300s budget)
      // This avoids the 60s timeout pressure in publish-review
      if (draft.featuredImagePrompt) {
        try {
          const imageUrl = await generateReviewImage(draft.featuredImagePrompt);
          if (imageUrl) {
            await prisma.reviewQueue.update({
              where: { id: item.id },
              data: { imageUrl },
            });
          }
        } catch {
          // non-blocking — publish-review will retry if missing
        }
      }

      results.push({ id: item.id, status: "processed", title: draft.titleAr });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      await markReviewFailed(item.id, message);
      results.push({ id: item.id, status: "failed", error: message });
    }
  }

  return NextResponse.json({
    ok: true,
    total: items.length,
    processed: results.filter((r) => r.status === "processed").length,
    rejected: results.filter((r) => r.status === "rejected").length,
    failed: results.filter((r) => r.status === "failed").length,
    results,
  });
}
