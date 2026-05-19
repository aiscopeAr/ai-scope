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
            take: 3,
            orderBy: { publishedAt: "desc" },
            include: { category: true },
          })
        : [];

    if (byTags.length >= 3) return byTags;

    const existingIds = new Set([article.id, ...byTags.map((a) => a.id)]);
    const needed = 3 - byTags.length;
    const byCategory = await prisma.article.findMany({
      where: {
        categoryId: article.categoryId,
        id: { notIn: [...existingIds] },
        published: true,
      },
      take: needed,
      orderBy: { publishedAt: "desc" },
      include: { category: true },
    });

    return [...byTags, ...byCategory];
  } catch {
    return mockArticles
      .filter((a) => a.categoryId === article.categoryId && a.id !== article.id)
      .slice(0, 3);
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
      <article className="container mx-auto max-w-4xl px-4 py-8" dir="rtl">
        <nav className="mb-6 flex items-center gap-2 text-sm text-gray-600">
          <Link href="/" className="hover:text-[#667eea]">
            الرئيسية
          </Link>
          <span>/</span>
          <Link href={`/category/${article.category.slug}`} className="hover:text-[#667eea]">
            {article.category.nameAr}
          </Link>
          <span>/</span>
          <span className="line-clamp-1">{article.titleAr}</span>
        </nav>

        <AdSlot position="article-top" className="mb-6" />

        <Link
          href={`/category/${article.category.slug}`}
          className="gradient-primary mb-4 inline-block rounded-full px-4 py-1 text-sm font-medium text-white"
        >
          {article.category.nameAr}
        </Link>

        <h1 className="mb-6 text-4xl font-bold leading-tight md:text-5xl">{article.titleAr}</h1>

        <div className="mb-8 flex items-center gap-4 border-b pb-8 text-gray-600">
          <span className="font-medium">{article.sourceName}</span>
          <span>•</span>
          {article.publishedAt && (
            <time dateTime={article.publishedAt.toISOString()}>
              {formatDistanceToNow(new Date(article.publishedAt), {
                addSuffix: true,
                locale: ar,
              })}
            </time>
          )}
        </div>

        {article.imageUrl && (
          <div className="relative mb-8 h-96 overflow-hidden rounded-lg">
            <Image src={article.imageUrl} alt={imageAlt} fill className="object-cover" />
          </div>
        )}

        <AdSlot position="article-mid" className="mb-8" />

        <div className="prose prose-lg mb-12 max-w-none">
          <div className="whitespace-pre-wrap leading-relaxed text-gray-800">{article.contentAr}</div>
        </div>

        <AdSlot position="article-bottom" className="mb-8" />

        {articleFaq.length > 0 && (
          <section className="mb-10" aria-label="أسئلة شائعة">
            <h2 className="mb-6 text-2xl font-bold">أسئلة شائعة</h2>
            <div className="space-y-4">
              {articleFaq.map((item, i) => (
                <details
                  key={i}
                  className="group rounded-lg border border-gray-200 bg-gray-50 open:bg-white"
                >
                  <summary className="flex cursor-pointer items-center justify-between gap-4 px-5 py-4 font-semibold text-gray-800 marker:hidden list-none">
                    <span>{item.question}</span>
                    <svg
                      className="h-5 w-5 shrink-0 text-[#667eea] transition-transform group-open:rotate-180"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </summary>
                  <p className="px-5 pb-4 text-gray-700 leading-relaxed">{item.answer}</p>
                </details>
              ))}
            </div>
          </section>
        )}

        {articleTags.length > 0 && (
          <div className="mb-8 flex flex-wrap gap-2">
            {articleTags.map((tag) => (
              <Link
                key={tag}
                href={`/search?tag=${encodeURIComponent(tag)}`}
                className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-sm text-gray-600 transition-colors hover:bg-[#667eea] hover:text-white hover:border-[#667eea]"
              >
                #{tag}
              </Link>
            ))}
          </div>
        )}

        {articleKeywords.length > 0 && (
          <div className="mb-6 flex flex-wrap gap-2">
            {articleKeywords.map((kw) => (
              <Link
                key={kw}
                href={`/search?q=${encodeURIComponent(kw)}`}
                className="rounded-full bg-violet-50 px-3 py-1 text-xs text-violet-700 transition-colors hover:bg-violet-100"
              >
                {kw}
              </Link>
            ))}
          </div>
        )}

        <div className="mb-12 rounded-lg bg-gray-50 p-6">
          <p className="mb-3 text-gray-600">المصدر الأصلي:</p>
          <a
            href={article.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-[#667eea] hover:underline"
          >
            {article.sourceUrl}
          </a>
        </div>

        {related.length > 0 && (
          <section>
            <h2 className="mb-6 text-2xl font-bold">أخبار ذات صلة</h2>
            <div className="grid gap-6 md:grid-cols-3">
              {related.map((rel) => (
                <Link key={rel.id} href={`/news/${rel.slug}`} className="group">
                  {rel.imageUrl && (
                    <div className="relative mb-3 h-40 overflow-hidden rounded-lg">
                      <Image
                        src={rel.imageUrl}
                        alt={rel.titleAr}
                        fill
                        className="object-cover transition-transform group-hover:scale-105"
                      />
                    </div>
                  )}
                  <h3 className="line-clamp-2 font-bold group-hover:text-[#667eea]">{rel.titleAr}</h3>
                </Link>
              ))}
            </div>
          </section>
        )}
      </article>
    </>
  );
}
