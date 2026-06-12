import Link from "next/link";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";

interface Article {
  slug: string;
  titleAr: string;
  summary: string;
  imageUrl: string | null;
  publishedAt: Date | null;
  category: { nameAr: string; slug: string };
}

export default function RelatedArticles({ articles }: { articles: Article[] }) {
  if (!articles.length) return null;

  return (
    <section className="mb-10" dir="rtl">
      <h2 className="mb-5 text-xl font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
        تقارير ذات صلة
      </h2>
      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-3">
        {articles.map((article) => (
          <Link key={article.slug} href={`/reviews/${article.slug}`} className="group block">
            <div className="h-full overflow-hidden rounded-[6px] border transition"
              style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-surface)" }}
            >
              {/* Image */}
              <div className="relative h-36 overflow-hidden">
                {article.imageUrl ? (
                  <Image
                    src={article.imageUrl}
                    alt={article.titleAr}
                    fill
                    sizes="(max-width: 640px) 100vw, 33vw"
                    loading="lazy"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center"
                    style={{ backgroundColor: "var(--bg-subtle)" }}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" strokeWidth="1.5"
                      style={{ stroke: "var(--border-medium)" }}>
                      <rect x="3" y="3" width="18" height="18" rx="2"/>
                      <circle cx="8.5" cy="8.5" r="1.5"/>
                      <path d="M21 15l-5-5L5 21"/>
                    </svg>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-4">
                <span className="mb-2 inline-block text-[11px] font-semibold"
                  style={{ color: "var(--accent)" }}>
                  {article.category.nameAr}
                </span>
                <h3 className="mb-1 text-sm font-bold leading-snug line-clamp-2 transition-opacity group-hover:opacity-75"
                  style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
                  {article.titleAr}
                </h3>
                {article.publishedAt && (
                  <time className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                    {formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true, locale: ar })}
                  </time>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
