import Image from "next/image";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";

interface NewsCardProps {
  article: {
    slug: string;
    titleAr: string;
    excerpt: string | null;
    imageUrl: string | null;
    publishedAt: Date | null;
    sourceName: string;
    category: {
      nameAr: string;
      slug: string;
    };
  };
  featured?: boolean;
}

export default function NewsCard({ article, featured = false }: NewsCardProps) {
  const timeAgo = article.publishedAt
    ? formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true, locale: ar })
    : null;

  if (featured) {
    return (
      <Link href={`/news/${article.slug}`} className="group block">
        <div className="relative overflow-hidden rounded-2xl border border-white/6 bg-[#111116] card-hover transition-colors hover:border-violet-500/20">
          <div className="grid md:grid-cols-2">
            {/* Image */}
            <div className="relative h-64 md:h-80 overflow-hidden">
              {article.imageUrl ? (
                <Image
                  src={article.imageUrl}
                  alt={article.titleAr}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-violet-900/50 to-blue-900/50">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(167,139,250,0.4)" strokeWidth="1.5">
                    <circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3"/>
                  </svg>
                </div>
              )}
              {/* overlay fade */}
              <div className="absolute inset-0 bg-gradient-to-l from-[#111116] via-[#111116]/30 to-transparent hidden md:block" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#111116]/80 via-transparent to-transparent md:hidden" />
            </div>

            {/* Content */}
            <div className="flex flex-col justify-center p-8" dir="rtl">
              <span className="mb-3 inline-flex w-fit items-center rounded-full bg-violet-500/10 px-3 py-1 text-xs font-semibold text-violet-400 border border-violet-500/20">
                {article.category.nameAr}
              </span>
              <h2 className="mb-3 text-2xl font-bold leading-snug text-white transition-colors group-hover:text-violet-300 line-clamp-3">
                {article.titleAr}
              </h2>
              {article.excerpt && (
                <p className="mb-4 line-clamp-3 text-sm leading-relaxed text-slate-400">{article.excerpt}</p>
              )}
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="font-medium text-slate-400">{article.sourceName}</span>
                {timeAgo && <><span>·</span><time>{timeAgo}</time></>}
              </div>
              <div className="mt-5 flex items-center gap-1.5 text-sm font-semibold text-violet-400 transition-colors group-hover:text-violet-300">
                <span>اقرأ المزيد</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/news/${article.slug}`} className="group block h-full">
      <div className="h-full overflow-hidden rounded-2xl border border-white/6 bg-[#111116] card-hover transition-colors hover:border-violet-500/20">
        {/* Image */}
        <div className="relative h-48 overflow-hidden">
          {article.imageUrl ? (
            <Image
              src={article.imageUrl}
              alt={article.titleAr}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-110"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-violet-900/40 to-blue-900/40">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="rgba(167,139,250,0.35)" strokeWidth="1.5">
                <circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3"/>
              </svg>
            </div>
          )}
          {/* gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#111116] via-[#111116]/10 to-transparent" />
          {/* category badge */}
          <div className="absolute bottom-3 right-3">
            <span className="rounded-full bg-black/60 px-2.5 py-0.5 text-xs font-medium text-violet-300 backdrop-blur-sm border border-violet-500/20">
              {article.category.nameAr}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col p-5" dir="rtl">
          <h2 className="mb-2 line-clamp-2 text-base font-bold leading-snug text-white transition-colors group-hover:text-violet-300">
            {article.titleAr}
          </h2>
          {article.excerpt && (
            <p className="mb-3 line-clamp-2 text-sm leading-relaxed text-slate-500">{article.excerpt}</p>
          )}
          <div className="mt-auto flex items-center gap-2 text-xs text-slate-600 pt-2 border-t border-white/5">
            <span className="text-slate-500">{article.sourceName}</span>
            {timeAgo && <><span>·</span><time className="text-slate-600">{timeAgo}</time></>}
          </div>
        </div>
      </div>
    </Link>
  );
}
