import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { computeTelegramPerformanceSummary } from "@/lib/social/performance";
import { getGAClient, GA_PROPERTY_ID } from "@/lib/ga4";

export const dynamic = "force-dynamic";

/**
 * Best-effort GA4 lookup for Telegram-referred sessions, reusing the exact
 * same runReport/sessionSource pattern already used in
 * app/api/admin/analytics/route.ts. Returns null (never throws, never
 * fabricates a number) if GA4 isn't configured or the query fails — the
 * summary above already stands on its own from real SocialPost data.
 */
async function tryGetTelegramSessions(): Promise<{ sessions: number; range: string } | null> {
  if (!GA_PROPERTY_ID) return null;
  try {
    const ga = getGAClient();
    const range = "28daysAgo";
    const [res] = await ga.runReport({
      property: `properties/${GA_PROPERTY_ID}`,
      dateRanges: [{ startDate: range, endDate: "today" }],
      dimensions: [{ name: "sessionSource" }],
      metrics: [{ name: "sessions" }],
    });
    const telegramRow = res.rows?.find((row) => row.dimensionValues?.[0]?.value?.toLowerCase() === "telegram");
    const sessions = telegramRow ? parseInt(telegramRow.metricValues?.[0]?.value ?? "0", 10) : 0;
    return { sessions, range };
  } catch (err) {
    console.error("[telegram-performance] GA4 lookup failed (non-fatal):", err instanceof Error ? err.message : err);
    return null;
  }
}

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await prisma.socialPost.findMany({
    where: { platform: "telegram" },
    select: { status: true, createdAt: true, sentAt: true, errorMsg: true, nextAttemptAt: true, attemptCount: true },
  });

  const summary = computeTelegramPerformanceSummary(rows);
  const telegramSessions = await tryGetTelegramSessions();

  return NextResponse.json({ summary, telegramSessions });
}
