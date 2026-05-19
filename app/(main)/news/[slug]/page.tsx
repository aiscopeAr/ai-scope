import { cache } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";

import { prisma } from "@/lib/db";
import { mockArticles } from "@/lib/mock-data";
import ViewTracker from "@/components/ViewTracker";
import AdSlot from "@/components/AdSlot";
import ReadingProgress from "@/components/ReadingProgress";
import ShareButtons from "@/components/ShareButtons";
import {
  SITE_URL,
  SITE_NAME,
  SITE_NAME_AR,
  SITE_TWITTER_HANDLE,
  truncate,
  absoluteUrl,
} from "@/lib/seo";

export const dynamic = "force-dynamic";

const getArticle = cache(async (slug: string) => {
  try {
    return await prisma.article.findUnique({
      where: { slug },
      include: { category: true },
    });
  } catch {
    return mockArticles.find((a) => a.slug === slug) ?? null;
  }
});

interface ArticleForRelated {
  id: string;
  categoryId: string;
  tags?: string[];
}

async function getRelatedArticles(article: ArticleForRelated) {
  try {
    const tags = article.tags ?? [];
    const byTags =
      tags.length > 0
        ? await prisma.article.findMany({
            where: {
              id: { not: article.id },
              published: true,
              tags: { hasSome: tags },
            },
            take: 4,
            orderBy: [{ viewCount: "desc" }, { publishedAt: "desc" }],
            include: { category: true },
          })
        : [];

    if (byTags.length >= 4) return byTags;

    const existingIds = new Set([article.id, ...byTags.map((a) => a.id)]);
    const needed = 4 - byTags.length;
    const byCategory = await prisma.article.findMany({
      where: {
        categoryId: article.categoryId,
        id: { notIn: [...existingIds] },
        published: true,
      },
      take: needed,
      orderBy: [{ viewCount: "desc" }, { publishedAt: "desc" }],
      include: { category: true },
    });

    return [...byTags, ...byCategory];
  } catch {
    return mockArticles
      .filter((a) => a.categoryId === article.categoryId && a.id !== article.id)
      .slice(0, 4);
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticle(slug);

  if (!article || !article.published) return {};

  const articleUrl = absoluteUrl(`/news/${article.slug}`);
  const description = truncate(article.excerpt ?? article.contentAr, 160);

  return {
    title: `${article.titleAr} | ${SITE_NAME_AR}`,
    description,
    alternates: { canonical: articleUrl },
    openGraph: {
      type: "article",
      url: articleUrl,
      title: article.titleAr,
      description,
      locale: "ar_AR",
      siteName: SITE_NAME,
      publishedTime: article.publishedAt?.toISOString(),
      modifiedTime: "updatedAt" in article ? (article.updatedAt as Date | undefined)?.toISOString() : undefined,
      authors: [article.sourceName],
      tags: "tags" in article ? (article.tags as string[]) : [],
      ...(article.imageUrl ? { images: [{ url: article.imageUrl, alt: article.titleAr }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      site: SITE_TWITTER_HANDLE,
      title: article.titleAr,
      description,
      ...(article.imageUrl ? { images: [article.imageUrl] } : {}),
    },
  };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await getArticle(slug);

  if (!article || !article.published) {
    notFound();
  }

  const related = await getRelatedArticles(article);

  const articleUrl = absoluteUrl(`/news/${article.slug}`);
  const description = truncate(article.excerpt ?? article.contentAr, 160);
  const articleTags: string[] = "tags" in article ? (article.tags as string[]) : [];
  const createdAt: Date = "createdAt" in article ? (article.createdAt as Date) : new Date();
  const updatedAt: Date = "updatedAt" in article ? (article.updatedAt as Date) : new Date();

  const wordCount = article.contentAr.trim().split(/\s+/).length;
  const readingMinutes = Math.max(1, Math.round(wordCount / 200));

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "الرئيسية", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: article.category.nameAr, item: `${SITE_URL}/category/${article.category.slug}` },
      { "@type": "ListItem", position: 3, name: article.titleAr, item: articleUrl },
    ],
  };

  const articleKeywords: string[] = "keywords" in article ? (article.keywords as string[]) : [];
  const articleFaq: { question: string; answer: string }[] =
    "faq" in article && Array.isArray(article.faq) ? (article.faq as { question: string; answer: string }[]) : [];
  const imageAlt: string =
    "imageAlt" in article && typeof article.imageAlt === "string"
      ? article.imageAlt
      : article.titleAr;

  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: SITE_NAME,
    url: SITE_URL,
    logo: {
      "@type": "ImageObject",
      url: `${SITE_URL}/icon.png`,
      width: 512,
      height: 512,
    },
    sameAs: [],
  };

  const newsArticleJsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "@id": articleUrl,
    headline: article.titleAr,
    description,
    url: articleUrl,
    datePublished: article.publishedAt?.toISOString() ?? createdAt.toISOString(),
    dateModified: updatedAt.toISOString(),
    inLanguage: "ar",
    author: {
      "@type": "Organization",
      name: article.sourceName,
      url: article.sourceUrl,
    },
    publisher: {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: SITE_NAME,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/icon.png`,
      },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": articleUrl },
    articleSection: article.category.nameAr,
    keywords: [...articleTags, ...articleKeywords].join(", "),
    ...(article.imageUrl
      ? {
          image: {
            "@type": "ImageObject",
            url: article.imageUrl,
            caption: imageAlt,
          },
        }
      : {}),
  };

  const faqJsonLd =
    articleFaq.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: articleFaq.map((item) => ({
            "@type": "Question",
            name: item.question,
            acceptedAnswer: {
              "@type": "Answer",
              text: item.answer,
            },
          })),
        }
      : null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(newsArticleJsonLd) }}
      />
      {faqJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      )}
      <ViewTracker slug={article.slug} />
      <ReadingProgress />
      <article className="container mx-auto max-w-4xl px-4 py-8" dir="rtl">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-sm text-slate-500">
          <Link href="/" className="hover:text-violet-400 transition-colors">الرئيسية</Link>
          <span className="text-slate-700">/</span>
          <Link href={`/category/${article.category.slug}`} className="hover:text-violet-400 transition-colors">
            {article.category.nameAr}
          </Link>
          <span className="text-slate-700">/</span>
          <span className="line-clamp-1 text-slate-400">{article.titleAr}</span>
        </nav>

        <AdSlot position="article-top" className="mb-6" />

        {/* Category badge */}
        <Link
          href={`/category/${article.category.slug}`}
          className="mb-4 inline-block rounded-full bg-violet-500/15 border border-violet-500/30 px-4 py-1 text-sm font-semibold text-violet-400 transition hover:bg-violet-500/25"
        >
          {article.category.nameAr}
        </Link>

        {/* Title */}
        <h1 className="mb-6 text-3xl font-black leading-tight text-white md:text-4xl lg:text-5xl">{article.titleAr}</h1>

        {/* Meta */}
        <div className="mb-8 flex flex-wrap items-center gap-x-4 gap-y-3 border-b border-white/8 pb-8 text-slate-400">
          <span className="font-semibold text-slate-300">{article.sourceName}</span>
          <span className="text-slate-700">•</span>
          {article.publishedAt && (
            <time dateTime={article.publishedAt.toISOString()} className="text-sm">
              {formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true, locale: ar })}
            </time>
          )}
          <span className="text-slate-700">•</span>
          <span className="text-sm">{readingMinutes} دقيقة قراءة</span>
          <div className="mr-auto">
            <ShareButtons url={articleUrl} title={article.titleAr} />
          </div>
        </div>

        {/* Hero image */}
        {article.imageUrl && (
          <div className="relative mb-8 h-72 overflow-hidden rounded-2xl sm:h-96">
            <Image src={article.imageUrl} alt={imageAlt} fill className="object-cover" />
            <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/10" />
          </div>
        )}

        <AdSlot position="article-mid" className="mb-8" />

        {/* Article body */}
        <div className="mb-12 space-y-4 text-lg leading-relaxed text-slate-300 whitespace-pre-wrap">
          {article.contentAr}
        </div>

        <AdSlot position="article-bottom" className="mb-8" />

        {/* FAQ */}
        {articleFaq.length > 0 && (
          <section className="mb-10" aria-label="أسئلة شائعة">
            <h2 className="mb-6 text-2xl font-black text-white">أسئلة شائعة</h2>
            <div className="space-y-3">
              {articleFaq.map((item, i) => (
                <details
                  key={i}
                  className="group rounded-xl border border-white/8 bg-white/3 open:bg-white/5 transition"
                >
                  <summary className="flex cursor-pointer items-center justify-between gap-4 px-5 py-4 font-semibold text-slate-200 marker:hidden list-none">
                    <span>{item.question}</span>
                    <svg
                      className="h-5 w-5 shrink-0 text-violet-400 transition-transform group-open:rotate-180"
                      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </summary>
                  <p className="px-5 pb-4 text-slate-400 leading-relaxed">{item.answer}</p>
                </details>
              ))}
            </div>
          </section>
        )}

        {/* Tags */}
        {articleTags.length > 0 && (
          <div className="mb-6 flex flex-wrap gap-2">
            {articleTags.map((tag) => (
              <Link
                key={tag}
                href={`/search?tag=${encodeURIComponent(tag)}`}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-slate-400 transition hover:border-violet-500/40 hover:bg-violet-500/10 hover:text-violet-300"
              >
                #{tag}
              </Link>
            ))}
          </div>
        )}

        {/* Keywords */}
        {articleKeywords.length > 0 && (
          <div className="mb-8 flex flex-wrap gap-2">
            {articleKeywords.map((kw) => (
              <Link
                key={kw}
                href={`/search?q=${encodeURIComponent(kw)}`}
                className="rounded-full border border-violet-500/20 bg-violet-500/8 px-3 py-1 text-xs text-violet-400 transition hover:bg-violet-500/15"
              >
                {kw}
              </Link>
            ))}
          </div>
        )}

        {/* Share bar */}
        <div className="mb-8 flex items-center justify-between gap-4 rounded-2xl border border-white/8 bg-white/3 px-5 py-4">
          <p className="text-sm font-semibold text-slate-400">أعجبك المقال؟ شاركه مع أصدقائك</p>
          <ShareButtons url={articleUrl} title={article.titleAr} />
        </div>

        {/* Source */}
        <div className="mb-12 rounded-2xl border border-white/8 bg-white/3 p-6">
          <p className="mb-2 text-sm text-slate-500">المصدر الأصلي:</p>
          <a
            href={article.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="break-all text-sm font-medium text-violet-400 hover:text-violet-300 hover:underline transition-colors"
          >
            {article.sourceUrl}
          </a>
        </div>

        {/* Related articles */}
        {related.length > 0 && (
          <section aria-label="مقالات ذات صلة">
            <div className="mb-5 flex items-center gap-3">
              <div className="h-px flex-1 bg-white/8" />
              <h2 className="text-lg font-black text-white">مقالات ذات صلة</h2>
              <div className="h-px flex-1 bg-white/8" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {related.map((rel) => {
                const relTimeAgo = rel.publishedAt
                  ? formatDistanceToNow(new Date(rel.publishedAt), { addSuffix: true, locale: ar })
                  : null;
                return (
                  <Link
                    key={rel.id}
                    href={`/news/${rel.slug}`}
                    className="group flex flex-col rounded-xl border border-white/6 bg-white/2 overflow-hidden transition hover:border-violet-500/30 hover:bg-white/4"
                  >
                    <div className="relative h-32 w-full shrink-0 bg-white/4">
                      {rel.imageUrl ? (
                        <Image
                          src={rel.imageUrl}
                          alt={rel.titleAr}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-violet-900/30 to-blue-900/30">
                          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(167,139,250,0.3)" strokeWidth="1.5">
                            <circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3"/>
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col p-3" dir="rtl">
                      <span className="mb-1.5 inline-block w-fit rounded-full bg-violet-500/10 px-2 py-0.5 text-[11px] font-semibold text-violet-400 border border-violet-500/15">
                        {rel.category.nameAr}
                      </span>
                      <h3 className="flex-1 line-clamp-3 text-sm font-bold leading-snug text-slate-200 transition-colors group-hover:text-violet-300">
                        {rel.titleAr}
                      </h3>
                      {relTimeAgo && (
                        <p className="mt-2 text-[11px] text-slate-600">{relTimeAgo}</p>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </article>
    </>
  );
}
