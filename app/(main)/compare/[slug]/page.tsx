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
  const comp = await prisma.comparison.findUnique({ where: { slug } }).catch(() => null);
  if (!comp || !comp.published) return {};

  const url = absoluteUrl(`/compare/${slug}`);
  const description = truncate(comp.summaryAr, 160);

  return {
    title: `${comp.title} | ${SITE_NAME_AR}`,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      url,
      title: comp.title,
      description,
      locale: "ar_AR",
      siteName: SITE_NAME,
    },
  };
}

export default async function ComparisonPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const comp = await prisma.comparison.findUnique({
    where: { slug },
    include: {
      sides: {
        include: { tool: true },
        orderBy: { score: "desc" },
      },
    },
  }).catch(() => null);

  if (!comp || !comp.published) notFound();

  void prisma.comparison.update({ where: { id: comp.id }, data: { viewCount: { increment: 1 } } }).catch(() => {});

  const [toolA, toolB] = comp.sides;
  const compUrl = absoluteUrl(`/compare/${slug}`);
  const breadcrumbItems = [
    { name: "الرئيسية", href: "/" },
    { name: "المقارنات", href: "/compare" },
    { name: comp.title },
  ];

  const criteria = Array.isArray(comp.criteria)
    ? (comp.criteria as { name: string; scoreA?: number; scoreB?: number }[])
    : [];

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": compUrl,
    headline: comp.title,
    description: truncate(comp.summaryAr, 160),
    url: compUrl,
    dateModified: comp.updatedAt.toISOString(),
    inLanguage: "ar",
    publisher: {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: SITE_NAME,
    },
  };

  const maxScore = Math.max(toolA?.score ?? 0, toolB?.score ?? 0, 1);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(buildBreadcrumbJsonLd(breadcrumbItems)) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />

      <main className="container mx-auto max-w-4xl px-4 py-8" dir="rtl">
        <Breadcrumbs items={breadcrumbItems} className="mb-6" />

        <AdSlot position="compare-page-top" className="mb-6" />

        <h1 className="mb-4 text-3xl font-bold md:text-4xl">{comp.title}</h1>
        <p className="mb-10 text-lg text-gray-600 leading-relaxed">{comp.summaryAr}</p>

        {/* Score bars */}
        {toolA && toolB && (
          <section className="mb-10">
            <div className="grid gap-4 md:grid-cols-2">
              {[toolA, toolB].map((side) => (
                <div key={side.id} className="rounded-xl border border-gray-200 bg-gray-50 p-6">
                  <h2 className="mb-4 text-xl font-bold">{side.tool.name}</h2>
                  {side.score !== null && side.score !== undefined && (
                    <div className="mb-4">
                      <div className="mb-1 flex justify-between text-sm text-gray-600">
                        <span>التقييم الإجمالي</span>
                        <span className="font-bold">{side.score}/100</span>
                      </div>
                      <div className="h-3 overflow-hidden rounded-full bg-gray-200">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-violet-500 to-violet-600 transition-all"
                          style={{ width: `${(side.score / maxScore) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                  {side.notes && (
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{side.notes}</p>
                  )}
                  {side.tool.website && (
                    <a
                      href={side.tool.website}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      className="mt-4 inline-block rounded-lg border border-violet-200 bg-violet-50 px-4 py-2 text-sm font-medium text-violet-700 hover:bg-violet-100 transition"
                    >
                      زيارة {side.tool.name} ↗
                    </a>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Criteria table */}
        {criteria.length > 0 && (
          <section className="mb-10">
            <h2 className="mb-4 text-xl font-bold">المقارنة التفصيلية</h2>
            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="p-4 text-right font-bold text-gray-700">المعيار</th>
                    <th className="p-4 text-center font-bold text-gray-700">{toolA?.tool.name}</th>
                    <th className="p-4 text-center font-bold text-gray-700">{toolB?.tool.name}</th>
                  </tr>
                </thead>
                <tbody>
                  {criteria.map((c, i) => (
                    <tr key={i} className="border-b border-gray-100 last:border-0">
                      <td className="p-4 font-medium text-gray-700">{c.name}</td>
                      <td className="p-4 text-center">
                        {c.scoreA !== undefined ? (
                          <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-violet-100 text-xs font-bold text-violet-700">
                            {c.scoreA}
                          </div>
                        ) : <span className="text-gray-400">—</span>}
                      </td>
                      <td className="p-4 text-center">
                        {c.scoreB !== undefined ? (
                          <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-violet-100 text-xs font-bold text-violet-700">
                            {c.scoreB}
                          </div>
                        ) : <span className="text-gray-400">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Verdict */}
        {comp.verdict && (
          <section className="mb-10">
            <h2 className="mb-4 text-xl font-bold">الحكم النهائي</h2>
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-6">
              <p className="leading-relaxed text-gray-800 whitespace-pre-wrap">{comp.verdict}</p>
            </div>
          </section>
        )}

        <AdSlot position="compare-page-mid" className="mb-8" />

        {/* Tool detail links */}
        {comp.sides.length > 0 && (
          <section className="mb-8">
            <h2 className="mb-4 text-xl font-bold">مراجعات مفصلة</h2>
            <div className="flex flex-wrap gap-3">
              {comp.sides.map((side) => (
                <Link
                  key={side.id}
                  href={`/ai-tools/${side.tool.slug}`}
                  className="rounded-lg border border-violet-200 bg-violet-50 px-4 py-2 text-sm font-medium text-violet-700 hover:bg-violet-100 transition"
                >
                  مراجعة {side.tool.name} ←
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Back */}
        <div className="border-t border-gray-100 pt-6">
          <Link href="/compare" className="text-sm text-amber-600 hover:underline">← جميع المقارنات</Link>
        </div>
      </main>
    </>
  );
}
