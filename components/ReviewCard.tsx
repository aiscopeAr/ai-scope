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
}

export default function ReviewCard({ review, featured = false }: ReviewCardProps) {
  const timeAgo = review.publishedAt
    ? formatDistanceToNow(new Date(review.publishedAt), { addSuffix: true, locale: ar })
    : null;

  const author = AUTHORS[review.authorSlug as AuthorSlug];
  const wordCount = review.summary.trim().split(/\s+/).length * 8;
  const readMin = Math.max(5, Math.round(wordCount / 200));

  if (featured) {
    return (
      <Link href={`/reviews/${review.slug}`} className="group block">
        <div className="relative overflow-hidden rounded-[6px] border transition" style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-surface)" }}>
          <div className="grid md:grid-cols-2">
            <div className="relative h-64 md:h-96 overflow-hidden">
              {review.imageUrl ? (
                <Image src={review.imageUrl} alt={review.titleAr} fill className="object-cover transition-transform duration-700 group-hover:scale-105" />
              ) : (
                <div className="flex h-full w-full items-center justify-center" style={{ backgroundColor: "var(--bg-subtle)" }}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" strokeWidth="1.2" style={{ stroke: "var(--border-medium)" }}>
                    <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>
                  </svg>
                </div>
              )}
              <div className="absolute inset-0 hidden md:block" style={{ background: "linear-gradient(to left, var(--bg-surface) 0%, transparent 60%)" }} />
            </div>
            <div className="flex flex-col justify-center p-8" dir="rtl">
              <span className="mb-3 inline-flex w-fit items-center rounded-[3px] px-2.5 py-1 text-[11px] font-semibold"
                style={{ backgroundColor: "var(--accent-bg)", color: "var(--accent)" }}>
                {review.category.nameAr}
              </span>
              <h2 className="mb-3 text-2xl font-bold leading-snug line-clamp-3 transition-colors group-hover:opacity-80"
                style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
                {review.titleAr}
              </h2>
              <p className="mb-4 line-clamp-3 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{review.summary}</p>
              <div className="flex items-center gap-3">
                {author && (
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 overflow-hidden rounded-[4px]" style={{ outline: `2px solid ${author.accentColor}40` }}>
                      <img src={author.avatarUrl} alt={author.nameAr} className="h-full w-full object-cover" />
                    </div>
                    <span className="text-xs font-semibold" style={{ color: author.accentColor }}>{author.nameAr}</span>
                  </div>
                )}
                {timeAgo && <span className="text-xs" style={{ color: "var(--text-muted)" }}>{timeAgo}</span>}
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>{readMin} د قراءة</span>
              </div>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/reviews/${review.slug}`} className="group block h-full">
      <div className="h-full overflow-hidden rounded-[6px] border transition" style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-surface)" }}>
        <div className="relative h-48 overflow-hidden">
          {review.imageUrl ? (
            <Image src={review.imageUrl} alt={review.titleAr} fill className="object-cover transition-transform duration-700 group-hover:scale-110" />
          ) : (
            <div className="flex h-full w-full items-center justify-center" style={{ backgroundColor: "var(--bg-subtle)" }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" style={{ stroke: "var(--border-medium)" }}>
                <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>
              </svg>
            </div>
          )}
          <div className="absolute bottom-0 inset-x-0 h-16" style={{ background: "linear-gradient(to top, var(--bg-surface), transparent)" }} />
          <div className="absolute bottom-3 end-3">
            <span className="rounded-[3px] px-2 py-0.5 text-[11px] font-medium"
              style={{ backgroundColor: "var(--bg-surface)", color: "var(--accent)", border: "1px solid var(--border-subtle)" }}>
              {review.category.nameAr}
            </span>
          </div>
        </div>

        <div className="flex flex-col p-5" dir="rtl">
          <h2 className="mb-2 line-clamp-2 text-base font-bold leading-snug transition-opacity group-hover:opacity-75"
            style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
            {review.titleAr}
          </h2>
          <p className="mb-3 line-clamp-2 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{review.summary}</p>
          <div className="mt-auto flex items-center gap-2 text-xs pt-2 border-t" style={{ borderColor: "var(--border-subtle)", color: "var(--text-muted)" }}>
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
