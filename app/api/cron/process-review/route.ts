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
import { getSetting, SETTING_KEYS, getEditorialV2Mode, getEditorialV2ShadowMaxPerRun, getEditorialV2OnMaxPerRun } from "@/lib/settings";
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

  // Shadow-sampling cap: how many items THIS run may execute the planner in
  // SHADOW mode. Independent of maxPerRun (V1 throughput). Read once, and ONLY
  // when shadow is engaged, so off/on paths add no DB read. Never exceeds the
  // number of V1 items handled this run.
  const shadowMaxPerRun =
    editorialV2Mode === "shadow" ? Math.min(await getEditorialV2ShadowMaxPerRun(), maxPerRun) : 0;
  let shadowAttempts = 0;   // planner attempts (successes + fallbacks + failures) — counts toward the cap
  let shadowEligible = 0;   // items that reached the shadow decision point
  let shadowSuccesses = 0;
  let shadowFallbacks = 0;
  let shadowFailures = 0;
  let shadowSkipped = 0;    // eligible but over the per-run cap

  // A3 canary cap: how many items THIS run may be written via the plan-driven
  // (mode="on") path. Read once, and ONLY when on-mode is engaged. Never exceeds
  // maxPerRun. Independent of the shadow cap.
  const onMaxPerRun =
    editorialV2Mode === "on" ? Math.min(await getEditorialV2OnMaxPerRun(), maxPerRun) : 0;
  let onAttempts = 0;       // on-path attempts — counted BEFORE the planner call so a failure can't exceed the canary
  let onPlanWrites = 0;     // items actually written via the plan-driven writer
  let onV1Fallbacks = 0;    // on-attempts that degraded to the V1 writer

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

      // ── Writer selection ────────────────────────────────────────────────
      // OFF / SHADOW / on-beyond-cap → exact V1 writer (unchanged path).
      // ON (canary-eligible) → plan BEFORE writing; use the plan-driven writer
      // only when the planner returns a VALID, non-fallback plan; otherwise
      // degrade safely to the exact V1 writer. A3 failure never fails the item —
      // it falls back to V1.
      let draft;
      if (editorialV2Mode === "on" && onAttempts < onMaxPerRun) {
        // Count the attempt BEFORE the planner call so a planner/writer failure
        // can never let the canary exceed its cap.
        onAttempts++;
        const onStarted = Date.now();
        let plan: Awaited<ReturnType<typeof planEditorial>>["plan"] | null = null;
        let plannerFallback = false;
        let usedV1Fallback = false;
        let planWriteSucceeded = false;

        try {
          const outcome = await planEditorial(item.topic, sources, item.authorSlug as AuthorSlug);
          if ((outcome.status === "success" || outcome.status === "retry_success") && !outcome.fallbackUsed) {
            plan = outcome.plan;
          } else {
            plannerFallback = true; // conservative fallback / invalid / failed_nonblocking
          }
        } catch (plannerErr) {
          plannerFallback = true;
          console.error(
            `[editorial-v2:on] planner threw for queue item ${item.id}; will use V1 writer:`,
            plannerErr instanceof Error ? plannerErr.message : plannerErr,
          );
        }

        if (plan) {
          try {
            draft = await writeReview(item.topic, sources, item.authorSlug as AuthorSlug, plan);
            planWriteSucceeded = true;
          } catch (writeErr) {
            usedV1Fallback = true;
            console.error(
              `[editorial-v2:on] plan-driven writer threw for queue item ${item.id}; falling back to V1:`,
              writeErr instanceof Error ? writeErr.message : writeErr,
            );
          }
        } else {
          usedV1Fallback = true;
        }

        if (!draft) {
          // V1 fallback — identical to the default path.
          draft = await writeReview(item.topic, sources, item.authorSlug as AuthorSlug);
        }
        if (planWriteSucceeded) onPlanWrites++;
        if (usedV1Fallback) onV1Fallbacks++;

        // Bounded on-mode diagnostics — no prompts, no body, no source text.
        console.log(
          `[editorial-v2:on] ${JSON.stringify({
            reviewQueueId: item.id,
            topic: item.topic.slice(0, 120),
            storyType: plan?.storyType ?? null,
            depth: plan?.depth ?? null,
            sectionCount: plan?.sections.length ?? 0,
            includeFaq: plan?.includeFaq ?? null,
            includeComparison: plan?.includeComparison ?? null,
            includeMena: plan?.includeMena ?? null,
            plannerFallback,
            usedV1Fallback,
            latencyMs: Date.now() - onStarted,
          })}`,
        );
      } else {
        draft = await writeReview(item.topic, sources, item.authorSlug as AuthorSlug);
      }

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
      // SHADOW mode only: run the lightweight planner on the SAME in-memory
      // sources and log a structured diagnostics event comparing the proposed
      // V2 plan to the V1 draft. This NEVER changes the V1 draft/output above,
      // runs NO second writer, persists NOTHING, and must never break V1 —
      // hence the fully-guarded try/catch. (ON mode handles the planner above
      // and does not enter this block.)
      if (editorialV2Mode === "shadow") {
        shadowEligible++;
        if (shadowAttempts < shadowMaxPerRun) {
          // Count the ATTEMPT toward the cap BEFORE running — the cap exists to
          // bound latency/API calls, so a failed attempt still counts.
          shadowAttempts++;
          try {
            const outcome = await planEditorial(item.topic, sources, item.authorSlug as AuthorSlug);
            const diagnostics = buildShadowDiagnostics(item.id, item.topic, outcome, draft.contentAr);
            console.log(`[editorial-v2:shadow] ${JSON.stringify(diagnostics)}`);
            if (outcome.status === "success" || outcome.status === "retry_success") shadowSuccesses++;
            else if (outcome.status === "fallback") shadowFallbacks++;
            else shadowFailures++; // failed_nonblocking
          } catch (shadowErr) {
            // Shadow planning is strictly best-effort — it must never affect the
            // V1 article that was already generated and stored above.
            shadowFailures++;
            console.error(
              `[editorial-v2:shadow] non-blocking planner/diagnostics failure for queue item ${item.id}:`,
              shadowErr instanceof Error ? shadowErr.message : shadowErr,
            );
          }
        } else {
          // Over the per-run shadow cap — skip the planner for this item. V1
          // processing already completed above and is unaffected.
          shadowSkipped++;
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

  // One bounded per-run shadow summary (shadow mode only).
  if (editorialV2Mode === "shadow") {
    console.log(
      `[editorial-v2:shadow-summary] ${JSON.stringify({
        mode: editorialV2Mode,
        shadowMaxPerRun,
        eligibleItems: shadowEligible,
        plannerAttempts: shadowAttempts,
        plannerSuccesses: shadowSuccesses,
        plannerFallbacks: shadowFallbacks,
        plannerFailures: shadowFailures,
        skippedDueToLimit: shadowSkipped,
      })}`,
    );
  }

  // One bounded per-run A3 on-mode summary (on mode only).
  if (editorialV2Mode === "on") {
    console.log(
      `[editorial-v2:on-summary] ${JSON.stringify({
        mode: editorialV2Mode,
        onMaxPerRun,
        onAttempts,
        onPlanWrites,
        onV1Fallbacks,
      })}`,
    );
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
