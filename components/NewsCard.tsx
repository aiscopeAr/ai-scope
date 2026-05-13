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
  return (
    <Link
      href={`/news/${article.slug}`}
      className={`group block ${featured ? "gap-6 md:grid md:grid-cols-2" : ""}`}
    >
      <div className={`relative overflow-hidden rounded-lg bg-gray-100 ${featured ? "h-96" : "h-48"}`}>
        {article.imageUrl ? (
          <Image
            src={article.imageUrl}
            alt={article.titleAr}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-purple-100 to-purple-200">
            <span className="text-4xl">📰</span>
          </div>
        )}

        <div className="absolute top-4 right-4">
          <span className="rounded-full bg-white/90 px-3 py-1 text-sm font-medium text-[#667eea] backdrop-blur-sm">
            {article.category.nameAr}
          </span>
        </div>
      </div>

      <div className={`${featured ? "flex flex-col justify-center" : "mt-4"}`} dir="rtl">
        <h2
          className={`line-clamp-2 font-bold transition-colors group-hover:text-[#667eea] ${
            featured ? "mb-4 text-3xl" : "mb-2 text-xl"
          }`}
        >
          {article.titleAr}
        </h2>

        {article.excerpt && <p className="mb-3 line-clamp-2 leading-relaxed text-gray-600">{article.excerpt}</p>}

        <div className="flex items-center gap-3 text-sm text-gray-500">
          <span>{article.sourceName}</span>
          <span>•</span>
          {article.publishedAt && (
            <time>
              {formatDistanceToNow(new Date(article.publishedAt), {
                addSuffix: true,
                locale: ar,
              })}
            </time>
          )}
        </div>
      </div>
    </Link>
  );
}
