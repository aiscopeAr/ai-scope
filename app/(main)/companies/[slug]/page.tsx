import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/db";
import { absoluteUrl, SITE_NAME, SITE_NAME_AR, SITE_URL, truncate } from "@/lib/seo";
import Breadcrumbs, { buildBreadcrumbJsonLd } from "@/components/Breadcrumbs";
import NewsCard from "@/components/NewsCard";
import AdSlot from "@/components/AdSlot";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const company = await prisma.company.findUnique({ where: { slug } }).catch(() => null);
  if (!company || !company.published) return {};

  const url = absoluteUrl(`/companies/${slug}`);
  const description = truncate(company.descriptionAr, 160);

  return {
    title: `${company.name} — شركة الذكاء الاصطناعي | ${SITE_NAME_AR}`,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      url,
      title: `${company.name} | ${SITE_NAME}`,
      description,
      locale: "ar_AR",
      siteName: SITE_NAME,
      ...(company.logoUrl ? { images: [{ url: company.logoUrl, alt: company.name }] } : {}),
    },
  };
}

export default async function CompanyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const company = await prisma.company.findUnique({ where: { slug } }).catch(() => null);
  if (!company || !company.published) notFound();

  // Increment view count
  void prisma.company.update({ where: { id: company.id }, data: { viewCount: { increment: 1 } } }).catch(() => {});

  // Find related articles mentioning this company
  const relatedArticles = await prisma.article.findMany({
    where: {
      published: true,
      OR: [
        { titleAr: { contains: company.name, mode: "insensitive" } },
        { tags: { hasSome: company.specialties.slice(0, 3) } },
      ],
    },
    orderBy: { publishedAt: "desc" },
    take: 3,
    include: { category: true },
  }).catch(() => []);

  const companyUrl = absoluteUrl(`/companies/${slug}`);
  const breadcrumbItems = [
    { name: "الرئيسية", href: "/" },
    { name: "الشركات", href: "/companies" },
    { name: company.name },
  ];

  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: company.name,
    url: company.website ?? companyUrl,
    ...(company.logoUrl ? { logo: company.logoUrl } : {}),
    ...(company.founded ? { foundingDate: String(company.founded) } : {}),
    ...(company.country ? { addressCountry: company.country } : {}),
    description: truncate(company.descriptionAr, 200),
    sameAs: company.website ? [company.website] : [],
    publisher: {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: SITE_NAME,
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(buildBreadcrumbJsonLd(breadcrumbItems)) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }} />

      <main className="container mx-auto max-w-4xl px-4 py-8" dir="rtl">
        <Breadcrumbs items={breadcrumbItems} className="mb-6" />

        <AdSlot position="company-top" className="mb-6" />

        {/* Header */}
        <div className="mb-8 flex items-start gap-5">
          {company.logoUrl ? (
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-1">
              <Image src={company.logoUrl} alt={company.name} fill className="object-contain" />
            </div>
          ) : (
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-sky-500/15 text-2xl font-black text-sky-400">
              {company.name[0]}
            </div>
          )}
          <div>
            <h1 className="text-3xl font-black text-white md:text-4xl">{company.name}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-400">
              {company.country && <span>📍 {company.country}</span>}
              {company.founded && <span>🗓 تأسست {company.founded}</span>}
              {company.website && (
                <a href={company.website} target="_blank" rel="noopener noreferrer nofollow"
                  className="text-violet-400 hover:text-violet-300 transition-colors">
                  زيارة الموقع ↗
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="mb-8 text-lg leading-relaxed text-slate-300 whitespace-pre-wrap">
          {company.descriptionAr}
        </div>

        {/* Notable Models */}
        {company.notableModels.length > 0 && (
          <section className="mb-8">
            <h2 className="mb-4 text-xl font-black text-white">النماذج والمنتجات الأبرز</h2>
            <div className="flex flex-wrap gap-2">
              {company.notableModels.map((m) => (
                <span key={m} className="rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-1.5 text-sm font-semibold text-violet-400">
                  {m}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Specialties */}
        {company.specialties.length > 0 && (
          <section className="mb-8">
            <h2 className="mb-4 text-xl font-black text-white">مجالات التخصص</h2>
            <div className="flex flex-wrap gap-2">
              {company.specialties.map((s) => (
                <span key={s} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-slate-400">
                  {s}
                </span>
              ))}
            </div>
          </section>
        )}

        <AdSlot position="company-mid" className="mb-8" />

        {/* Related Articles */}
        {relatedArticles.length > 0 && (
          <section className="mb-8">
            <h2 className="mb-6 text-xl font-black text-white">آخر أخبار {company.name}</h2>
            <div className="grid gap-6 md:grid-cols-3">
              {relatedArticles.map((article) => (
                <NewsCard key={article.id} article={article} />
              ))}
            </div>
          </section>
        )}

        {/* Back */}
        <div className="border-t border-white/8 pt-6">
          <Link href="/companies" className="text-sm text-sky-400 hover:text-sky-300 transition-colors">← جميع الشركات</Link>
        </div>
      </main>
    </>
  );
}
