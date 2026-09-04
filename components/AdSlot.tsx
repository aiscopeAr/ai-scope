import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db";

type AdPosition =
  | "header"
  | "article-top"
  | "article-mid"
  | "article-bottom"
  | "sidebar"
  | "home-top"
  | "home-mid"
  | "home-bottom"
  | "homepage-top"
  | "homepage-mid"
  | "category-top"
  | "guides-top"
  | "guide-top"
  | "guide-mid"
  | "ai-tools-top"
  | "ai-tools-mid"
  | "tool-top"
  | "tool-mid"
  | "companies-top"
  | "company-top"
  | "company-mid"
  | "compare-top"
  | "compare-page-top"
  | "compare-page-mid"
  | "topic-top"
  | "alternatives-top"
  | "search-top";

interface Props {
  position: AdPosition;
  className?: string;
}

const getAds = unstable_cache(
  async (position: AdPosition) => {
    try {
      return await prisma.adSlot.findMany({
        where: { position, enabled: true },
        orderBy: { createdAt: "asc" },
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
  const ads = await getAds(position);

  if (ads.length === 0) return null;

  return (
    <div className={`ad-slot ad-slot--${position} ${className}`} data-position={position}>
      {ads.map((ad) => (
        <div key={ad.id} className="w-full overflow-hidden">
          {ad.type === "script" && (
            <div dangerouslySetInnerHTML={{ __html: ad.code }} />
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
