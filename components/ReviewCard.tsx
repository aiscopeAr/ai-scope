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
  const wordCount = review.summary.trim().split(/\s+/).length * 8; // rough estimate
  const readMin = Math.max(5, Math.round(wordCount / 200));

  if (featured) {
    return (
      <Link href={`/reviews/${review.slug}`} className="group block">
        <div className="relative overflow-hidden rounded-2xl border border-white/6 bg-[#111116] transition hover:border-violet-500/20">
          <div className="grid md:grid-cols-2">
            <div className="relative h-64 md:h-96 overflow-hidden">
              {review.imageUrl ? (
                <Image src={review.imageUrl} alt={review.titleAr} fill className="object-cover transition-transform duration-700 group-hover:scale-105" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-violet-900/50 to-blue-900/50">
                  <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="rgba(167,139,250,0.3)" strokeWidth="1.2">
                    <circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3"/>
                  </svg>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-l from-[#111116] via-[#111116]/30 to-transparent hidden md:block" />
            </div>
            <div className="flex flex-col justify-center p-8" dir="rtl">
              <span className="mb-3 inline-flex w-fit items-center rounded-full bg-violet-500/10 px-3 py-1 text-xs font-semibold text-violet-400 border border-violet-500/20">
                {review.category.nameAr}
              </span>
              <h2 className="mb-3 text-2xl font-bold leading-snug text-white transition-colors group-hover:text-violet-300 line-clamp-3">
                {review.titleAr}
              </h2>
              <p className="mb-4 line-clamp-3 text-sm leading-relaxed text-slate-400">{review.summary}</p>
              <div className="flex items-center gap-3">
                {author && (
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 overflow-hidden rounded-full" style={{ outline: `2px solid ${author.accentColor}50` }}>
                      <img src={author.avatarUrl} alt={author.nameAr} className="h-full w-full object-cover" />
                    </div>
                    <span className="text-xs font-semibold" style={{ color: author.accentColor }}>{author.nameAr}</span>
                  </div>
                )}
                {timeAgo && <span className="text-xs text-slate-500">{timeAgo}</span>}
                <span className="text-xs text-slate-600">{readMin} د قراءة</span>
              </div>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/reviews/${review.slug}`} className="group block h-full">
      <div className="h-full overflow-hidden rounded-2xl border border-white/6 bg-[#111116] transition hover:border-violet-500/20">
        <div className="relative h-48 overflow-hidden">
          {review.imageUrl ? (
            <Image src={review.imageUrl} alt={review.titleAr} fill className="object-cover transition-transform duration-700 group-hover:scale-110" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-violet-900/40 to-blue-900/40">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="rgba(167,139,250,0.3)" strokeWidth="1.5">
                <circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3"/>
              </svg>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#111116] via-[#111116]/10 to-transparent" />
          <div className="absolute bottom-3 right-3">
            <span className="rounded-full bg-black/60 px-2.5 py-0.5 text-xs font-medium text-violet-300 backdrop-blur-sm border border-violet-500/20">
              {review.category.nameAr}
            </span>
          </div>
        </div>

        <div className="flex flex-col p-5" dir="rtl">
          <h2 className="mb-2 line-clamp-2 text-base font-bold leading-snug text-white transition-colors group-hover:text-violet-300">
            {review.titleAr}
          </h2>
          <p className="mb-3 line-clamp-2 text-sm leading-relaxed text-slate-500">{review.summary}</p>
          <div className="mt-auto flex items-center gap-2 text-xs text-slate-600 pt-2 border-t border-white/5">
            {author && (
              <span className="font-semibold" style={{ color: author.accentColor }}>{author.nameAr}</span>
            )}
            {timeAgo && <><span>·</span><time className="text-slate-600">{timeAgo}</time></>}
            <span className="mr-auto">{readMin} د</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
