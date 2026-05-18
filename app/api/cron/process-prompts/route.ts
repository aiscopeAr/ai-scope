import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { processPromptWithAI, autoPublishPrompt } from "@/lib/prompts/process";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const BATCH_SIZE = 3;
const AUTO_PUBLISH_MIN_SCORE = 7;

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
  await prisma.promptQueue.updateMany({
    where: {
      status: "processing",
      createdAt: { lt: new Date(Date.now() - 5 * 60 * 1000) },
    },
    data: { status: "pending" },
  });

  const items = await prisma.promptQueue.findMany({
    where: { status: "pending" },
    orderBy: { createdAt: "asc" },
    take: BATCH_SIZE,
  });

  const results: Array<{ id: string; status: string; score?: number; published?: boolean }> = [];

  for (const item of items) {
    await prisma.promptQueue.update({ where: { id: item.id }, data: { status: "processing" } });

    try {
      const result = await processPromptWithAI(item);

      await prisma.promptQueue.update({
        where: { id: item.id },
        data: {
          titleAr: result.titleAr,
          descriptionAr: result.descriptionAr,
          promptTextAr: result.promptTextAr,
          examples: result.examples,
          useCases: result.useCases,
          culturalNotes: result.culturalNotes,
          difficulty: result.difficulty,
          tags: result.tags,
          score: result.score,
          status: "processed",
          processedAt: new Date(),
        },
      });

      let published = false;
      if (result.score >= AUTO_PUBLISH_MIN_SCORE) {
        await autoPublishPrompt(item.id);
        published = true;
      }

      results.push({ id: item.id, status: "processed", score: result.score, published });
    } catch (err) {
      console.error(`[process-prompts] Failed ${item.id}:`, err instanceof Error ? err.message : err);
      await prisma.promptQueue.update({ where: { id: item.id }, data: { status: "pending" } });
      results.push({ id: item.id, status: "failed" });
    }
  }

  return NextResponse.json({
    ok: true,
    processed: results.filter((r) => r.status === "processed").length,
    published: results.filter((r) => r.published).length,
    results,
  });
}
