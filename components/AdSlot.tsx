import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db";
import type { AdPosition } from "@/lib/ads/positions";
import ScriptAd from "@/components/ads/ScriptAd";

interface Props {
  position: AdPosition;
  className?: string;
}

const getAds = unstable_cache(
  async (position: AdPosition) => {
    try {
      return await prisma.adSlot.findMany({
        // Only in-flow ("inline") slots render here; overlay formats (popup,
        // sticky, interstitial) are mounted globally by AdManager (Phase 2).
        where: { position, enabled: true, format: "inline" },
        orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
      });
    } catch {
      return [];
    }
  },
  ["ad-slot"],
  // 1h (was 60s). As a nested unstable_cache dependency of every AdSlot-bearing
  // SSG/ISR page, a short window here collapsed those pages' effective
  // revalidation to ~60s and forced frequent Neon regenerations under crawl.
  // Ads change rarely, so 3600s is safe; there is no on-demand ad invalidation
  // to preserve (admin ad edits surface within the hour).
  { revalidate: 3600 },
);

export default async function AdSlot({ position, className = "" }: Props) {
  const all = await getAds(position);

  // Schedule window check runs at render (not inside the 1h cache, whose clock
  // would be frozen): hide slots before startAt or after endAt. This is an
  // async server component, so reading the clock here is fine — the
  // react-hooks/purity rule (meant for client render) is a false positive.
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();
  const ads = all.filter((ad) => {
    if (ad.startAt && new Date(ad.startAt).getTime() > now) return false;
    if (ad.endAt && new Date(ad.endAt).getTime() < now) return false;
    return true;
  });

  if (ads.length === 0) return null;

  return (
    <div className={`ad-slot ad-slot--${position} ${className}`} data-position={position}>
      {ads.map((ad) => (
        <div key={ad.id} className="w-full overflow-hidden">
          {ad.type === "script" && (
            // Must use ScriptAd (client) — injected <script> via innerHTML does
            // NOT execute, so AdSense/Taboola loaders never ran before.
            <ScriptAd code={ad.code} name={ad.name} />
          )}
          {ad.type === "iframe" && (
            <iframe
              src={ad.code}
              className="w-full border-0"
              style={{ minHeight: 90 }}
              loading="lazy"
              title={ad.name}
            />
          )}
          {ad.type === "image" && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={ad.code} alt={ad.name} className="mx-auto max-w-full" loading="lazy" />
          )}
        </div>
      ))}
    </div>
  );
}
