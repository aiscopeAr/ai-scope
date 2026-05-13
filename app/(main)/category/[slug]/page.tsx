import { cache } from "react";
import type { Metadata } from "next";
import NewsCard from "@/components/NewsCard";
import { prisma } from "@/lib/db";
import { mockArticles, mockCategories } from "@/lib/mock-data";
import { notFound } from "next/navigation";
import {
  SITE_URL,
  SITE_NAME,
  SITE_NAME_AR,
  truncate,
  absoluteUrl,
} from "@/lib/seo";

export const dynamic = "force-dynamic";

const getCategory = cache(async (slug: string) => {
  try {
    return await prisma.category.findUnique({ where: { slug } });
  } catch {
    return mockCategories.find((c) => c.slug === slug) ?? null;
  }
});

async function getCategoryArticles(slug: string) {
  try {
    return await prisma.article.findMany({
      where: { published: true, category: { slug } },
      orderBy: { publishedAt: "desc" },
      include: { category: true },
    });
  } catch {
    return mockArticles.filter((a) => a.category.slug === slug);
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategory(slug);
  if (!category) return {};

  const categoryUrl = absoluteUrl(`/category/${category.slug}`);
  const description = truncate(`أحدث أخبار ${category.nameAr} في عالم الذكاء الاصطناعي`, 160);

  return {
    title: `${category.nameAr} | ${SITE_NAME_AR}`,
    description,
    alternates: { canonical: categoryUrl },
    openGraph: {
      type: "website",
      url: categoryUrl,
      title: `${category.nameAr} | ${SITE_NAME}`,
      description,
      locale: "ar_AR",
      siteName: SITE_NAME,
    },
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = await getCategory(slug);

  if (!category) notFound();

  const articles = await getCategoryArticles(slug);

  const categoryUrl = absoluteUrl(`/category/${category.slug}`);
  const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": categoryUrl,
    url: categoryUrl,
    name: category.nameAr,
    inLanguage: "ar",
    isPartOf: { "@type": "WebSite", "@id": `${SITE_URL}/#website` },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }}
      />
      <section className="container mx-auto px-4 py-8" dir="rtl">
        <h1 className="mb-3 text-4xl font-bold">{category.nameAr}</h1>
        <p className="mb-10 text-lg text-gray-600">آخر المقالات في هذا التصنيف</p>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {articles.map((article) => (
            <NewsCard key={article.id} article={article} />
          ))}
        </div>
      </section>
    </>
  );
}
