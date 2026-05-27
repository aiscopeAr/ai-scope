import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getGAClient, GA_PROPERTY_ID } from "@/lib/ga4";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const range = searchParams.get("range") ?? "28daysAgo";

  if (!GA_PROPERTY_ID) {
    return NextResponse.json({ error: "GA_PROPERTY_ID not set" }, { status: 500 });
  }

  try {
    const ga = getGAClient();
    const property = `properties/${GA_PROPERTY_ID}`;

    const dateRange = { startDate: range, endDate: "today" };

    // Run multiple GA4 reports in parallel
    const [overviewRes, topPagesRes, topSourcesRes, dailyRes] = await Promise.all([
      // 1. Overview: sessions, users, pageviews, bounce rate, avg session duration
      ga.runReport({
        property,
        dateRanges: [dateRange],
        metrics: [
          { name: "sessions" },
          { name: "activeUsers" },
          { name: "screenPageViews" },
          { name: "bounceRate" },
          { name: "averageSessionDuration" },
          { name: "newUsers" },
        ],
      }),

      // 2. Top pages by pageviews
      ga.runReport({
        property,
        dateRanges: [dateRange],
        dimensions: [{ name: "pagePath" }, { name: "pageTitle" }],
        metrics: [{ name: "screenPageViews" }, { name: "activeUsers" }],
        orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
        limit: 10,
      }),

      // 3. Traffic sources
      ga.runReport({
        property,
        dateRanges: [dateRange],
        dimensions: [{ name: "sessionDefaultChannelGroup" }],
        metrics: [{ name: "sessions" }, { name: "activeUsers" }],
        orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
        limit: 8,
      }),

      // 4. Daily sessions (last 28 days for sparkline)
      ga.runReport({
        property,
        dateRanges: [{ startDate: "27daysAgo", endDate: "today" }],
        dimensions: [{ name: "date" }],
        metrics: [{ name: "sessions" }, { name: "screenPageViews" }],
        orderBys: [{ dimension: { dimensionName: "date" } }],
      }),
    ]);

    // Parse overview
    const overviewRow = overviewRes[0]?.rows?.[0];
    const overview = overviewRow ? {
      sessions:       parseInt(overviewRow.metricValues?.[0]?.value ?? "0"),
      users:          parseInt(overviewRow.metricValues?.[1]?.value ?? "0"),
      pageviews:      parseInt(overviewRow.metricValues?.[2]?.value ?? "0"),
      bounceRate:     parseFloat(overviewRow.metricValues?.[3]?.value ?? "0"),
      avgSessionSec:  parseFloat(overviewRow.metricValues?.[4]?.value ?? "0"),
      newUsers:       parseInt(overviewRow.metricValues?.[5]?.value ?? "0"),
    } : { sessions: 0, users: 0, pageviews: 0, bounceRate: 0, avgSessionSec: 0, newUsers: 0 };

    // Parse top pages
    const topPages = (topPagesRes[0]?.rows ?? []).map((row) => ({
      path:      row.dimensionValues?.[0]?.value ?? "",
      title:     row.dimensionValues?.[1]?.value ?? "",
      pageviews: parseInt(row.metricValues?.[0]?.value ?? "0"),
      users:     parseInt(row.metricValues?.[1]?.value ?? "0"),
    }));

    // Parse traffic sources
    const sources = (topSourcesRes[0]?.rows ?? []).map((row) => ({
      channel:  row.dimensionValues?.[0]?.value ?? "",
      sessions: parseInt(row.metricValues?.[0]?.value ?? "0"),
      users:    parseInt(row.metricValues?.[1]?.value ?? "0"),
    }));

    // Parse daily sparkline
    const daily = (dailyRes[0]?.rows ?? []).map((row) => ({
      date:      row.dimensionValues?.[0]?.value ?? "",
      sessions:  parseInt(row.metricValues?.[0]?.value ?? "0"),
      pageviews: parseInt(row.metricValues?.[1]?.value ?? "0"),
    }));

    return NextResponse.json({ overview, topPages, sources, daily });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[GA4] error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
