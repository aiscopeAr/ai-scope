import Image from "next/image";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import { AUTHORS, type AuthorSlug } from "@/lib/authors";

interface ReviewCardProps {
  review: {
    slug: string;
    titleAr: string;
    summary: string;
    imageUrl: string | null;
    publishedAt: Date | null;
    authorSlug: string;
    tags: string[];
    viewCount: number;
    category: { nameAr: string; slug: string };
  };
  featured?: boolean;
  priority?: boolean;
}

export default function ReviewCard({ review, featured = false, priority = false }: ReviewCardProps) {
  const timeAgo = review.publishedAt
    ? formatDistanceToNow(new Date(review.publishedAt), { addSuffix: true, locale: ar })
    : null;

  const author = AUTHORS[review.authorSlug as AuthorSlug];
  const wordCount = review.summary.trim().split(/\s+/).length * 8;
  const readMin = Math.max(5, Math.round(wordCount / 200));

  if (featured) {
    return (
      <Link href={`/reviews/${review.slug}`} className="group block">
        <div className="grid items-center gap-8 md:grid-cols-2 md:gap-10 lg:gap-14">
          <div className="relative order-1 aspect-[4/3] overflow-hidden rounded-[10px] md:aspect-[4/5] lg:aspect-[16/13]">
            {review.imageUrl ? (
              <Image src={review.imageUrl} alt={review.titleAr} fill priority={priority || featured} sizes="(max-width: 768px) 100vw, 50vw" className="object-cover transition-transform duration-700 group-hover:scale-[1.03]" />
            ) : (
              <div className="flex h-full w-full items-center justify-center" style={{ backgroundColor: "var(--bg-subtle)" }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" strokeWidth="1.2" style={{ stroke: "var(--border-medium)" }}>
                  <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>
                </svg>
              </div>
            )}
          </div>
          <div className="order-2 flex flex-col" dir="rtl">
            <span className="mb-4 inline-flex w-fit items-center rounded-full px-3 py-1 text-[11px] font-semibold"
              style={{ backgroundColor: "var(--accent-bg)", color: "var(--accent)" }}>
              {review.category.nameAr}
            </span>
            <h2 className="mb-4 text-3xl font-bold leading-[1.25] line-clamp-3 transition-colors group-hover:opacity-80 lg:text-4xl"
              style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
              {review.titleAr}
            </h2>
            <p className="mb-6 line-clamp-3 text-base leading-relaxed" style={{ color: "var(--text-secondary)" }}>{review.summary}</p>
            <div className="mb-6 flex flex-wrap items-center gap-3">
              {author && (
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 overflow-hidden rounded-full" style={{ outline: `2px solid ${author.accentColor}40` }}>
                    <img src={author.avatarUrl} alt={author.nameAr} className="h-full w-full object-cover" />
                  </div>
                  <span className="text-sm font-semibold" style={{ color: author.accentColor }}>{author.nameAr}</span>
                </div>
              )}
              {timeAgo && <span className="text-sm" style={{ color: "var(--text-muted)" }}>{timeAgo}</span>}
              <span className="text-sm" style={{ color: "var(--text-muted)" }}>{readMin} د قراءة</span>
            </div>
            <span
              className="inline-flex w-fit items-center gap-2 text-sm font-bold transition-colors"
              style={{ color: "var(--brand)" }}
            >
              اقرأ المقال الكامل
              <svg className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l-7 7 7 7" />
              </svg>
            </span>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/reviews/${review.slug}`} className="group block h-full">
      <div
        className="h-full overflow-hidden rounded-[10px] border transition-all duration-200 hover:-translate-y-0.5"
        style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-surface)" }}
      >
        <div className="relative aspect-[16/10] overflow-hidden">
          {review.imageUrl ? (
            <Image src={review.imageUrl} alt={review.titleAr} fill loading="lazy" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw" className="object-cover transition-transform duration-700 group-hover:scale-105" />
          ) : (
            <div className="flex h-full w-full items-center justify-center" style={{ backgroundColor: "var(--bg-subtle)" }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" style={{ stroke: "var(--border-medium)" }}>
                <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>
              </svg>
            </div>
          )}
          <div className="absolute bottom-3 end-3">
            <span className="rounded-full px-2.5 py-0.5 text-[11px] font-medium"
              style={{ backgroundColor: "var(--bg-surface)", color: "var(--accent)", border: "1px solid var(--border-subtle)" }}>
              {review.category.nameAr}
            </span>
          </div>
        </div>

        <div className="flex flex-col p-5" dir="rtl">
          <h3 className="mb-2 line-clamp-2 text-base font-bold leading-snug transition-opacity group-hover:opacity-75"
            style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
            {review.titleAr}
          </h3>
          <p className="mb-3 line-clamp-2 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{review.summary}</p>
          <div className="mt-auto flex items-center gap-2 text-xs pt-3 border-t" style={{ borderColor: "var(--border-subtle)", color: "var(--text-muted)" }}>
            {author && (
              <span className="font-semibold" style={{ color: author.accentColor }}>{author.nameAr}</span>
            )}
            {timeAgo && <><span>·</span><time>{timeAgo}</time></>}
            <span className="mr-auto">{readMin} د</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
