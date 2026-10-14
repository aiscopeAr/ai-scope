import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db";

/**
 * Public endpoint feeding the client AdManager with active overlay ads
 * (popup / sticky-bottom / interstitial / sidebar-sticky). In-flow `inline`
 * slots are NOT returned here — they render server-side via <AdSlot>.
 *
 * Cached 1h like the inline ad query (ads change rarely). Schedule-window and
 * frequency/targeting decisions are made client-side so this response stays
 * cacheable and CDN-friendly.
 */
const OVERLAY_FORMATS = ["popup", "sticky-bottom", "interstitial", "sidebar-sticky"];

const getActiveOverlayAds = unstable_cache(
  async () => {
    try {
      return await prisma.adSlot.findMany({
        where: { enabled: true, format: { in: OVERLAY_FORMATS } },
        orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
        select: {
          id: true, name: true, type: true, code: true, format: true,
          network: true, dismissible: true, frequencyHours: true,
          priority: true, startAt: true, endAt: true, pages: true,
        },
      });
    } catch {
      return [];
    }
  },
  ["ads-active-overlay"],
  { revalidate: 3600 },
);

export async function GET() {
  const ads = await getActiveOverlayAds();
  return NextResponse.json(ads, {
    headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" },
  });
}
