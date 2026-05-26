/**
 * Cron: /api/cron/ingest-tools
 * Schedule: once daily at 08:00 UTC (vercel.json)
 *
 * Fetches new AI tools from ProductHunt posted in the last 24 hours,
 * generates Arabic content via GPT-4o-mini, and saves them to the DB
 * with published=false for admin review.
 *
 * Requires: PRODUCTHUNT_API_TOKEN, OPENAI_API_KEY
 */

import { NextResponse } from "next/server";
import { fetchPHToolsSince, normalizePricing } from "@/lib/producthunt";
import { ingestTool } from "@/lib/tools-ingestion";

export const dynamic = "force-dynamic";
export const maxDuration = 120; // tools take ~5s each; 20 tools ≈ 100s

function verifyCronSecret(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch tools posted in the last 26 hours (slight overlap to avoid gaps)
  const since = new Date(Date.now() - 26 * 60 * 60 * 1000);
  const posts = await fetchPHToolsSince(since);

  if (!posts.length) {
    return NextResponse.json({ ok: true, message: "No new tools from ProductHunt", created: 0, duplicates: 0, failed: 0 });
  }

  const results = { created: 0, duplicates: 0, failed: 0, slugs: [] as string[] };

  for (const post of posts) {
    // Skip posts without a real website URL
    const website = post.website || `https://www.producthunt.com/posts/${post.slug}`;

    const result = await ingestTool({
      name: post.name,
      website,
      logoUrl: post.thumbnail?.url ?? undefined,
      tagline: post.tagline,
      rawDescription: [post.tagline, post.description].filter(Boolean).join("\n\n"),
      pricing: normalizePricing(post.pricing),
      sourceUrl: post.url,
      sourceName: "ProductHunt",
      tags: (post.topics?.edges ?? []).map((e) => e.node.slug),
    });

    if (result.status === "created") {
      results.created++;
      if (result.slug) results.slugs.push(result.slug);
    } else if (result.status === "duplicate") {
      results.duplicates++;
    } else {
      results.failed++;
    }
  }

  console.log(
    `[ingest-tools] done — ${results.created} created, ${results.duplicates} duplicate, ${results.failed} failed`
  );

  return NextResponse.json({
    ok: true,
    total: posts.length,
    ...results,
  });
}
