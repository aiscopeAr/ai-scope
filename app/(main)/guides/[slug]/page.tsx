import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { absoluteUrl, SITE_NAME, SITE_NAME_AR, SITE_URL, truncate } from "@/lib/seo";
import Breadcrumbs, { buildBreadcrumbJsonLd } from "@/components/Breadcrumbs";
import AdSlot from "@/components/AdSlot";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const guide = await prisma.guide.findUnique({ where: { slug } }).catch(() => null);
  if (!guide || !guide.published) return {};

  const url = absoluteUrl(`/guides/${slug}`);
  const description = truncate(guide.excerpt, 160);

  return {
    title: `${guide.title} | ${SITE_NAME_AR}`,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      url,
      title: guide.title,
      description,
      locale: "ar_AR",
      siteName: SITE_NAME,
    },
  };
}

export default async function GuidePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const guide = await prisma.guide.findUnique({ where: { slug } }).catch(() => null);

  if (!guide || !guide.published) notFound();

  const related = await prisma.guide.findMany({
    where: { published: true, category: guide.category, id: { not: guide.id } },
    orderBy: { publishedAt: "desc" },
    take: 3,
  }).catch(() => []);

  const faqItems = Array.isArray(guide.faq)
    ? (guide.faq as { question: string; answer: string }[])
    : [];

  const guideUrl = absoluteUrl(`/guides/${slug}`);
  const breadcrumbItems = [
    { name: "الرئيسية", href: "/" },
    { name: "الأدلة", href: "/guides" },
    { name: guide.title },
  ];

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": guideUrl,
    headline: guide.title,
    description: truncate(guide.excerpt, 160),
    url: guideUrl,
    datePublished: guide.publishedAt.toISOString(),
    dateModified: guide.updatedAt.toISOString(),
    inLanguage: "ar",
    publisher: {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: SITE_NAME,
      logo: { "@type": "ImageObject", url: `${SITE_URL}/icon.png` },
    },
    keywords: guide.tags.join(", "),
  };

  const faqJsonLd = faqItems.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  } : null;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(buildBreadcrumbJsonLd(breadcrumbItems)) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
      {faqJsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />}

      <article className="container mx-auto max-w-4xl px-4 py-8" dir="rtl">
        <Breadcrumbs items={breadcrumbItems} className="mb-6" />

        <AdSlot position="guide-top" className="mb-6" />

        <div className="mb-4 flex flex-wrap items-center gap-3">
          <span className="rounded-full bg-violet-100 px-3 py-1 text-sm font-medium text-violet-700">
            {guide.category === "beginner" ? "مبتدئ" : guide.category === "advanced" ? "متقدم" : guide.category === "tutorial" ? "شرح تفصيلي" : guide.category}
          </span>
          {guide.readingTime && (
            <span className="text-sm text-gray-500">{guide.readingTime} دقيقة قراءة</span>
          )}
        </div>

        <h1 className="mb-4 text-4xl font-bold leading-tight md:text-5xl">{guide.title}</h1>
        <p className="mb-8 text-xl text-gray-600 leading-relaxed">{guide.excerpt}</p>

        <div className="mb-8 border-b pb-8">
          {guide.tags.map((tag) => (
            <span key={tag} className="ml-2 inline-block rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-sm text-gray-600">
              #{tag}
            </span>
          ))}
        </div>

        <div className="prose prose-lg mb-12 max-w-none">
          <div className="whitespace-pre-wrap leading-relaxed text-gray-800">{guide.content}</div>
        </div>

        <AdSlot position="guide-mid" className="mb-8" />

        {faqItems.length > 0 && (
          <section className="mb-10" aria-label="أسئلة شائعة">
            <h2 className="mb-6 text-2xl font-bold">أسئلة شائعة</h2>
            <div className="space-y-4">
              {faqItems.map((item, i) => (
                <details key={i} className="group rounded-lg border border-gray-200 bg-gray-50 open:bg-white">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-semibold text-gray-800 marker:hidden">
                    <span>{item.question}</span>
                    <svg className="h-5 w-5 shrink-0 text-violet-500 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </summary>
                  <p className="px-5 pb-4 text-gray-700 leading-relaxed">{item.answer}</p>
                </details>
              ))}
            </div>
          </section>
        )}

        {related.length > 0 && (
          <section className="mt-12">
            <h2 className="mb-6 text-2xl font-bold">أدلة ذات صلة</h2>
            <div className="grid gap-4 md:grid-cols-3">
              {related.map((r) => (
                <Link key={r.id} href={`/guides/${r.slug}`} className="group rounded-xl border border-gray-200 p-5 hover:border-violet-300 hover:bg-violet-50 transition">
                  <h3 className="font-bold text-gray-800 group-hover:text-violet-700 line-clamp-2 text-sm">{r.title}</h3>
                  <p className="mt-2 text-xs text-gray-500 line-clamp-2">{truncate(r.excerpt, 80)}</p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </article>
    </>
  );
}
