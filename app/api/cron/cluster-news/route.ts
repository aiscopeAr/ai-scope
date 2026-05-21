/**
 * Cluster pending NewsItems into ReviewQueue topics.
 * Uses OpenAI to group semantically related items and pick an author.
 * Runs after fetch-news (e.g. every 6 hours).
 */
import { NextResponse } from "next/server";
import OpenAI from "openai";
import { prisma } from "@/lib/db";
import { createReviewCluster } from "@/lib/review-queue";
import { pickAuthor } from "@/lib/authors";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MIN_CLUSTER_SIZE = 2; // need at least 2 items to form a deep review

function verifyCronSecret(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

let _client: OpenAI | null = null;
function getClient() {
  if (!_client) _client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
  return _client;
}

export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch up to 40 pending items
  const items = await prisma.newsItem.findMany({
    where: { status: "pending" },
    orderBy: { createdAt: "asc" },
    take: 40,
    select: { id: true, title: true, sourceName: true, createdAt: true },
  });

  if (items.length === 0) {
    return NextResponse.json({ ok: true, message: "No pending news items" });
  }

  // Ask GPT to cluster the items by topic
  const client = getClient();
  const listText = items
    .map((it, i) => `${i}: [${it.sourceName}] ${it.title}`)
    .join("\n");

  const res = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "You are a news editor. Group the following news headlines into thematic clusters about the SAME specific topic or event. Each cluster should have a clear topic phrase in English. Ignore items that don't fit any cluster. Return JSON only.",
      },
      {
        role: "user",
        content: `Headlines (index: title):\n${listText}\n\nReturn JSON:\n{\n  "clusters": [\n    {\n      "topic": "short topic phrase",\n      "category": "ai-models|research|companies|tools|policy",\n      "indices": [0, 3, 7]\n    }\n  ]\n}`,
      },
    ],
    temperature: 0.3,
    max_tokens: 1000,
    response_format: { type: "json_object" },
  });

  const raw = res.choices[0]?.message?.content ?? "{}";
  let parsed: { clusters?: Array<{ topic: string; category: string; indices: number[] }> };
  try {
    parsed = JSON.parse(raw);
  } catch {
    return NextResponse.json({ ok: false, error: "Failed to parse clustering response" });
  }

  const clusters = parsed.clusters ?? [];
  const clustersCreated: string[] = [];
  const skippedItems: string[] = [];

  for (const cluster of clusters) {
    if (!Array.isArray(cluster.indices) || cluster.indices.length < MIN_CLUSTER_SIZE) {
      // Single item — mark as skipped (will be retried or discarded)
      for (const idx of cluster.indices ?? []) {
        if (items[idx]) skippedItems.push(items[idx].id);
      }
      continue;
    }

    const clusterItems = cluster.indices
      .filter((i) => items[i] !== undefined)
      .map((i) => items[i]);

    const authorSlug = pickAuthor(cluster.category);

    const clusterId = await createReviewCluster(
      cluster.topic,
      authorSlug,
      clusterItems.map((it) => it.id),
    );
    clustersCreated.push(clusterId);
  }

  // Mark unclustered items as skipped so they don't pile up
  const clusteredIds = new Set(
    clusters.flatMap((c) => c.indices.filter((i) => items[i]).map((i) => items[i].id)),
  );
  const unclusteredIds = items.map((it) => it.id).filter((id) => !clusteredIds.has(id));
  if (unclusteredIds.length > 0) {
    await prisma.newsItem.updateMany({
      where: { id: { in: unclusteredIds } },
      data: { status: "skipped" },
    });
  }

  return NextResponse.json({
    ok: true,
    itemsProcessed: items.length,
    clustersCreated: clustersCreated.length,
    skipped: unclusteredIds.length,
  });
}
