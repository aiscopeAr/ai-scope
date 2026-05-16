import { prisma } from "@/lib/db";

type AdPosition =
  | "header"
  | "article-top"
  | "article-mid"
  | "article-bottom"
  | "sidebar"
  | "homepage-top"
  | "homepage-mid"
  | "category-top";

interface Props {
  position: AdPosition;
  className?: string;
}

export default async function AdSlot({ position, className = "" }: Props) {
  const ads = await prisma.adSlot.findMany({
    where: { position, enabled: true },
    orderBy: { createdAt: "asc" },
  });

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
