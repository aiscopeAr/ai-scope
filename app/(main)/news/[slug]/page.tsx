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
    keywords: articleTags.join(", "),
    ...(article.imageUrl
      ? {
          image: {
            "@type": "ImageObject",
            url: article.imageUrl,
            caption: article.titleAr,
          },
        }
      : {}),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(newsArticleJsonLd) }}
      />
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
            <Image src={article.imageUrl} alt={article.titleAr} fill className="object-cover" />
          </div>
        )}

        <AdSlot position="article-mid" className="mb-8" />

        <div className="prose prose-lg mb-12 max-w-none">
          <div className="whitespace-pre-wrap leading-relaxed text-gray-800">{article.contentAr}</div>
        </div>

        <AdSlot position="article-bottom" className="mb-8" />

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
