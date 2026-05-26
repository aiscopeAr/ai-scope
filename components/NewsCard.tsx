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
        <div className="relative overflow-hidden rounded-[6px] border transition" style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-surface)" }}>
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
                <div className="flex h-full w-full items-center justify-center" style={{ backgroundColor: "var(--bg-subtle)" }}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" style={{ stroke: "var(--border-medium)" }}>
                    <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>
                  </svg>
                </div>
              )}
              <div className="absolute inset-0 hidden md:block" style={{ background: "linear-gradient(to left, var(--bg-surface) 0%, transparent 60%)" }} />
            </div>

            {/* Content */}
            <div className="flex flex-col justify-center p-8" dir="rtl">
              <span className="mb-3 inline-flex w-fit items-center rounded-[3px] px-2.5 py-1 text-[11px] font-semibold"
                style={{ backgroundColor: "var(--accent-bg)", color: "var(--accent)" }}>
                {article.category.nameAr}
              </span>
              <h2 className="mb-3 text-2xl font-bold leading-snug line-clamp-3 transition-opacity group-hover:opacity-75"
                style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
                {article.titleAr}
              </h2>
              {article.excerpt && (
                <p className="mb-4 line-clamp-3 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{article.excerpt}</p>
              )}
              <div className="flex items-center gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
                <span className="font-medium" style={{ color: "var(--text-secondary)" }}>{article.sourceName}</span>
                {timeAgo && <><span>·</span><time>{timeAgo}</time></>}
              </div>
              <div className="mt-5 flex items-center gap-1.5 text-sm font-semibold transition-opacity group-hover:opacity-75" style={{ color: "var(--accent)" }}>
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
      <div className="h-full overflow-hidden rounded-[6px] border transition" style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-surface)" }}>
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
            <div className="flex h-full w-full items-center justify-center" style={{ backgroundColor: "var(--bg-subtle)" }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" style={{ stroke: "var(--border-medium)" }}>
                <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>
              </svg>
            </div>
          )}
          <div className="absolute bottom-0 inset-x-0 h-16" style={{ background: "linear-gradient(to top, var(--bg-surface), transparent)" }} />
          {/* category badge */}
          <div className="absolute bottom-3 end-3">
            <span className="rounded-[3px] px-2 py-0.5 text-[11px] font-medium"
              style={{ backgroundColor: "var(--bg-surface)", color: "var(--accent)", border: "1px solid var(--border-subtle)" }}>
              {article.category.nameAr}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col p-5" dir="rtl">
          <h2 className="mb-2 line-clamp-2 text-base font-bold leading-snug transition-opacity group-hover:opacity-75"
            style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
            {article.titleAr}
          </h2>
          {article.excerpt && (
            <p className="mb-3 line-clamp-2 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{article.excerpt}</p>
          )}
          <div className="mt-auto flex items-center gap-2 text-xs pt-2 border-t" style={{ borderColor: "var(--border-subtle)", color: "var(--text-muted)" }}>
            <span>{article.sourceName}</span>
            {timeAgo && <><span>·</span><time>{timeAgo}</time></>}
          </div>
        </div>
      </div>
    </Link>
  );
}
