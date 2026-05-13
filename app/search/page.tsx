"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";

interface ArticleResult {
  id: string;
  slug: string;
  titleAr: string;
  title: string;
  excerpt: string | null;
  imageUrl: string | null;
  sourceName: string;
  publishedAt: string | null;
  tags: string[];
  category: { nameAr: string; slug: string };
}

interface SearchResponse {
  articles: ArticleResult[];
  total: number;
  page: number;
  limit: number;
}

function highlight(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = text.split(new RegExp(`(${escaped})`, "gi"));
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase() ? (
      <mark key={i} className="bg-yellow-200 text-gray-900 rounded px-0.5">
        {part}
      </mark>
    ) : (
      part
    )
  );
}

const LIMIT = 12;

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialQ = searchParams.get("q") ?? "";
  const initialTag = searchParams.get("tag") ?? "";
  const initialSource = searchParams.get("source") ?? "";
  const initialPage = Math.max(1, Number(searchParams.get("page") ?? "1"));

  const [q, setQ] = useState(initialQ);
  const [tag, setTag] = useState(initialTag);
  const [source, setSource] = useState(initialSource);
  const [page, setPage] = useState(initialPage);
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const doSearch = useCallback(
    async (params: { q: string; tag: string; source: string; page: number }) => {
      const { q: sq, tag: st, source: ss, page: sp } = params;
      if (!sq && !st && !ss) {
        setResults(null);
        return;
      }
      setLoading(true);
      try {
        const qs = new URLSearchParams();
        if (sq) qs.set("q", sq);
        if (st) qs.set("tag", st);
        if (ss) qs.set("source", ss);
        qs.set("page", String(sp));
        qs.set("limit", String(LIMIT));
        const res = await fetch(`/api/search?${qs}`);
        const data: SearchResponse = await res.json();
        setResults(data);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (tag) params.set("tag", tag);
      if (source) params.set("source", source);
      if (page > 1) params.set("page", String(page));
      const qs = params.toString();
      router.replace(`/search${qs ? `?${qs}` : ""}`, { scroll: false });
      doSearch({ q, tag, source, page });
    }, 350);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, tag, source, page]);

  const totalPages = results ? Math.ceil(results.total / LIMIT) : 0;

  return (
    <div className="container mx-auto max-w-5xl px-4 py-10" dir="rtl">
      <h1 className="mb-8 text-3xl font-bold">البحث في الأخبار</h1>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="search"
            placeholder="ابحث في الأخبار…"
            value={q}
            onChange={(e) => { setQ(e.target.value); setPage(1); }}
            className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pr-10 pl-4 text-base shadow-sm focus:border-[#667eea] focus:outline-none focus:ring-1 focus:ring-[#667eea]"
          />
        </div>
        <input
          type="text"
          placeholder="فلترة بالوسم"
          value={tag}
          onChange={(e) => { setTag(e.target.value); setPage(1); }}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-base shadow-sm focus:border-[#667eea] focus:outline-none focus:ring-1 focus:ring-[#667eea] sm:w-48"
        />
        <input
          type="text"
          placeholder="فلترة بالمصدر"
          value={source}
          onChange={(e) => { setSource(e.target.value); setPage(1); }}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-base shadow-sm focus:border-[#667eea] focus:outline-none focus:ring-1 focus:ring-[#667eea] sm:w-48"
        />
      </div>

      {tag && (
        <div className="mb-4 flex items-center gap-2">
          <span className="text-sm text-gray-500">الوسم:</span>
          <span className="flex items-center gap-1 rounded-full bg-purple-100 px-3 py-1 text-sm font-medium text-purple-700">
            #{tag}
            <button onClick={() => { setTag(""); setPage(1); }} className="ml-1 text-purple-400 hover:text-purple-700">×</button>
          </span>
        </div>
      )}

      {loading && (
        <div className="py-16 text-center text-gray-400">جارٍ البحث…</div>
      )}

      {!loading && results && (
        <>
          <p className="mb-6 text-sm text-gray-500">
            {results.total === 0
              ? "لا توجد نتائج"
              : `${results.total} نتيجة — صفحة ${results.page} من ${totalPages}`}
          </p>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {results.articles.map((article) => (
              <Link
                key={article.id}
                href={`/news/${article.slug}`}
                className="group flex flex-col overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-md"
              >
                {article.imageUrl && (
                  <div className="relative h-44 overflow-hidden">
                    <Image
                      src={article.imageUrl}
                      alt={article.titleAr}
                      fill
                      className="object-cover transition-transform group-hover:scale-105"
                    />
                  </div>
                )}
                <div className="flex flex-1 flex-col p-4">
                  <span className="mb-2 text-xs font-medium text-[#667eea]">{article.category.nameAr}</span>
                  <h2 className="mb-2 line-clamp-2 font-bold leading-snug group-hover:text-[#667eea]">
                    {highlight(article.titleAr, q)}
                  </h2>
                  {article.excerpt && (
                    <p className="mb-3 line-clamp-2 text-sm text-gray-600">
                      {highlight(article.excerpt, q)}
                    </p>
                  )}
                  <div className="mt-auto flex items-center justify-between text-xs text-gray-400">
                    <span>{article.sourceName}</span>
                    {article.publishedAt && (
                      <time dateTime={article.publishedAt}>
                        {formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true, locale: ar })}
                      </time>
                    )}
                  </div>
                  {article.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {article.tags.slice(0, 3).map((t) => (
                        <span key={t} className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-10 flex items-center justify-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="rounded-lg border px-4 py-2 text-sm font-medium disabled:opacity-40 hover:bg-gray-50"
              >
                السابق
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`rounded-lg border px-4 py-2 text-sm font-medium ${
                      p === page
                        ? "gradient-primary border-transparent text-white"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="rounded-lg border px-4 py-2 text-sm font-medium disabled:opacity-40 hover:bg-gray-50"
              >
                التالي
              </button>
            </div>
          )}
        </>
      )}

      {!loading && !results && (
        <div className="py-20 text-center text-gray-400">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="mx-auto mb-4 h-12 w-12 text-gray-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <p>ابدأ بكتابة كلمة للبحث في الأخبار</p>
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto max-w-5xl px-4 py-10" dir="rtl">
          <h1 className="mb-8 text-3xl font-bold">البحث في الأخبار</h1>
          <div className="py-16 text-center text-gray-400">جارٍ التحميل…</div>
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
