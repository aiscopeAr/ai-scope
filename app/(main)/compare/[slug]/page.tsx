import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { absoluteUrl, SITE_NAME, SITE_NAME_AR, SITE_URL, truncate } from "@/lib/seo";
import Breadcrumbs, { buildBreadcrumbJsonLd } from "@/components/Breadcrumbs";
import AdSlot from "@/components/AdSlot";

export const revalidate = 300;

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
    { name: "Home", href: "/" },
    { name: "Compare", href: "/compare" },
    { name: comp.title },
  ];

  const criteria = Array.isArray(comp.criteria)
    ? (comp.criteria as { name: string; scoreA?: number; scoreB?: number }[])
    : [];

  const PRICING_LABELS: Record<string, string> = { free: "Free", freemium: "Free + Paid", paid: "Paid" };

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

        <h1 className="mb-4 text-3xl font-black text-white md:text-4xl">{comp.title}</h1>
        <p className="mb-10 text-lg text-slate-400 leading-relaxed">{comp.summaryAr}</p>

        {/* Score bars */}
        {toolA && toolB && (
          <section className="mb-10">
            <div className="grid gap-4 md:grid-cols-2">
              {[toolA, toolB].map((side) => (
                <div key={side.id} className="rounded-xl border border-white/8 bg-white/3 p-6">
                  <h2 className="mb-4 text-xl font-black text-white">{side.tool.name}</h2>
                  {side.score !== null && side.score !== undefined && (
                    <div className="mb-4">
                      <div className="mb-1 flex justify-between text-sm text-slate-400">
                        <span>التقييم الإجمالي</span>
                        <span className="font-bold text-slate-200">{side.score}/100</span>
                      </div>
                      <div className="h-3 overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-violet-500 to-violet-400 transition-all"
                          style={{ width: `${(side.score / maxScore) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                  {side.notes && (
                    <p className="text-sm text-slate-400 leading-relaxed whitespace-pre-wrap">{side.notes}</p>
                  )}
                  {side.tool.website && (
                    <a
                      href={side.tool.website}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      className="mt-4 inline-block rounded-lg border border-violet-500/30 bg-violet-500/10 px-4 py-2 text-sm font-medium text-violet-400 hover:bg-violet-500/20 transition"
                    >
                      زيارة {side.tool.name} ↗
                    </a>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Pricing comparison */}
        {toolA && toolB && (
          <section className="mb-10">
            <h2 className="mb-4 text-xl font-black text-white">Pricing Comparison</h2>
            <div className="overflow-x-auto rounded-xl border border-white/8">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/8 bg-white/3">
                    <th className="p-4 text-right font-bold text-slate-300">Feature</th>
                    <th className="p-4 text-center font-bold text-slate-300">{toolA.tool.name}</th>
                    <th className="p-4 text-center font-bold text-slate-300">{toolB.tool.name}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-white/5">
                    <td className="p-4 text-slate-400">Pricing Model</td>
                    <td className="p-4 text-center font-medium text-slate-300">{PRICING_LABELS[toolA.tool.pricing] ?? toolA.tool.pricing}</td>
                    <td className="p-4 text-center font-medium text-slate-300">{PRICING_LABELS[toolB.tool.pricing] ?? toolB.tool.pricing}</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="p-4 text-slate-400">Starting Price</td>
                    <td className="p-4 text-center text-slate-300">{toolA.tool.pricing === "free" ? "Free" : toolA.tool.monthlyPrice ? `$${toolA.tool.monthlyPrice}/mo` : "—"}</td>
                    <td className="p-4 text-center text-slate-300">{toolB.tool.pricing === "free" ? "Free" : toolB.tool.monthlyPrice ? `$${toolB.tool.monthlyPrice}/mo` : "—"}</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="p-4 text-slate-400">Arabic Support</td>
                    <td className="p-4 text-center">{toolA.tool.arabicSupport ? <span className="text-teal-400">Yes</span> : <span className="text-slate-600">No</span>}</td>
                    <td className="p-4 text-center">{toolB.tool.arabicSupport ? <span className="text-teal-400">Yes</span> : <span className="text-slate-600">No</span>}</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="p-4 text-slate-400">API Available</td>
                    <td className="p-4 text-center">{toolA.tool.hasApi ? <span className="text-blue-400">Yes</span> : <span className="text-slate-600">No</span>}</td>
                    <td className="p-4 text-center">{toolB.tool.hasApi ? <span className="text-blue-400">Yes</span> : <span className="text-slate-600">No</span>}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Strengths & Weaknesses */}
        {(toolA?.strengths?.length || toolA?.weaknesses?.length || toolB?.strengths?.length || toolB?.weaknesses?.length) && (
          <section className="mb-10">
            <h2 className="mb-4 text-xl font-black text-white">Strengths & Weaknesses</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {[toolA, toolB].filter(Boolean).map((side) => side && (
                <div key={side.id} className="rounded-xl border border-white/8 bg-white/3 p-5">
                  <h3 className="mb-4 font-bold text-slate-200">{side.tool.name}</h3>
                  {side.strengths && side.strengths.length > 0 && (
                    <div className="mb-3">
                      <p className="mb-2 text-xs font-semibold text-emerald-400">Strengths</p>
                      <ul className="space-y-1.5">
                        {side.strengths.map((s, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-emerald-300">
                            <span className="mt-0.5 shrink-0 text-emerald-500">+</span>{s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {side.weaknesses && side.weaknesses.length > 0 && (
                    <div>
                      <p className="mb-2 text-xs font-semibold text-red-400">Weaknesses</p>
                      <ul className="space-y-1.5">
                        {side.weaknesses.map((w, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-red-300">
                            <span className="mt-0.5 shrink-0 text-red-500">-</span>{w}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {side.bestFor && (
                    <div className="mt-3 rounded-lg border border-violet-500/20 bg-violet-500/8 px-3 py-2 text-xs text-violet-300">
                      <span className="font-semibold">Best for:</span> {side.bestFor}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Criteria table */}
        {criteria.length > 0 && (
          <section className="mb-10">
            <h2 className="mb-4 text-xl font-black text-white">المقارنة التفصيلية</h2>
            <div className="overflow-x-auto rounded-xl border border-white/8">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/8 bg-white/3">
                    <th className="p-4 text-right font-bold text-slate-300">المعيار</th>
                    <th className="p-4 text-center font-bold text-slate-300">{toolA?.tool.name}</th>
                    <th className="p-4 text-center font-bold text-slate-300">{toolB?.tool.name}</th>
                  </tr>
                </thead>
                <tbody>
                  {criteria.map((c, i) => (
                    <tr key={i} className="border-b border-white/5 last:border-0">
                      <td className="p-4 font-medium text-slate-400">{c.name}</td>
                      <td className="p-4 text-center">
                        {c.scoreA !== undefined ? (
                          <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-violet-500/15 text-xs font-bold text-violet-400">
                            {c.scoreA}
                          </div>
                        ) : <span className="text-slate-600">—</span>}
                      </td>
                      <td className="p-4 text-center">
                        {c.scoreB !== undefined ? (
                          <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-violet-500/15 text-xs font-bold text-violet-400">
                            {c.scoreB}
                          </div>
                        ) : <span className="text-slate-600">—</span>}
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
            <h2 className="mb-4 text-xl font-black text-white">الحكم النهائي</h2>
            <div className="rounded-xl border border-amber-500/25 bg-amber-500/8 p-6">
              <p className="leading-relaxed text-amber-200 whitespace-pre-wrap">{comp.verdict}</p>
            </div>
          </section>
        )}

        <AdSlot position="compare-page-mid" className="mb-8" />

        {/* Tool detail links */}
        {comp.sides.length > 0 && (
          <section className="mb-8">
            <h2 className="mb-4 text-xl font-black text-white">مراجعات مفصلة</h2>
            <div className="flex flex-wrap gap-3">
              {comp.sides.map((side) => (
                <Link
                  key={side.id}
                  href={`/ai-tools/${side.tool.slug}`}
                  className="rounded-xl border border-violet-500/30 bg-violet-500/10 px-4 py-2 text-sm font-medium text-violet-400 hover:bg-violet-500/20 transition"
                >
                  مراجعة {side.tool.name} ←
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Back */}
        <div className="border-t border-white/8 pt-6">
          <Link href="/compare" className="text-sm text-amber-400 hover:text-amber-300 transition-colors">← جميع المقارنات</Link>
        </div>
      </main>
    </>
  );
}
