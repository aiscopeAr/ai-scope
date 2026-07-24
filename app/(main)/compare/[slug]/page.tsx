import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { absoluteUrl, SITE_NAME_AR, SITE_URL, SITE_TWITTER_HANDLE, truncate } from "@/lib/seo";
import { buildBreadcrumbJsonLd } from "@/lib/breadcrumb-jsonld";
import { pricingLabel, normalizeCriteria, getMaxScore, isWinningSide, getKeyDifferences } from "@/lib/comparison-helpers";
import ToolLogo from "@/components/comparison/ToolLogo";
import ScoreRing from "@/components/comparison/ScoreRing";
import MethodologySection from "@/components/comparison/MethodologySection";
import ReviewDateBadge from "@/components/comparison/ReviewDateBadge";
import NotRecommendedForBadge from "@/components/comparison/NotRecommendedForBadge";
import DecisionSummary from "@/components/comparison/DecisionSummary";
import ChooseIfCard from "@/components/comparison/ChooseIfCard";
import KeyDifferences from "@/components/comparison/KeyDifferences";
import EditorialTrustSection from "@/components/comparison/EditorialTrustSection";
import RelatedContentSection from "@/components/comparison/RelatedContentSection";
import { CheckCircle2, XCircle, Trophy, ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

async function getComparison(slug: string) {
  try {
    return await prisma.comparison.findUnique({
      where: { slug },
      include: {
        sides: {
          include: {
            tool: {
              select: {
                id: true, slug: true, name: true, tagline: true,
                pricing: true, monthlyPrice: true,
                arabicSupport: true, hasApi: true, logoUrl: true,
                toolCategory: true,
              },
            },
          },
        },
      },
    });
  } catch { return null; }
}

/** Related comparisons ranked by relevance (shares a tool category with
 *  the current comparison) before falling back to recency — previously
 *  this list was ordered purely by updatedAt with no relevance signal. */
async function getOtherComparisons(currentSlug: string, toolCategories: string[]) {
  try {
    const candidates = await prisma.comparison.findMany({
      where: { published: true, NOT: { slug: currentSlug } },
      orderBy: { updatedAt: "desc" },
      take: 12,
      include: {
        sides: { include: { tool: { select: { name: true, logoUrl: true, toolCategory: true } } } },
      },
    });

    const categorySet = new Set(toolCategories);
    const scored = candidates.map((c) => {
      const relevance = c.sides.some((s) => categorySet.has(s.tool.toolCategory)) ? 1 : 0;
      return { comparison: c, relevance };
    });
    scored.sort((a, b) => b.relevance - a.relevance);

    return scored.slice(0, 3).map((s) => s.comparison);
  } catch { return []; }
}

interface RelatedToolRef {
  id: string;
  slug: string;
  name: string;
  toolCategory: string;
}

/** Reviews that actually mention either tool by name, prompts linked to
 *  either tool via a real toolId FK, and other tools in the same
 *  category(ies) as the tools being compared — same matching pattern
 *  already used on the AI Tool detail page
 *  (app/(main)/ai-tools/[slug]/page.tsx), reused here rather than
 *  inventing a new heuristic. */
async function getRelatedContent(tools: RelatedToolRef[]) {
  try {
    const toolCategories = [...new Set(tools.map((t) => t.toolCategory))];
    const [reviews, relatedTools, prompts] = await Promise.all([
      prisma.review.findMany({
        where: {
          published: true,
          OR: tools.flatMap((t) => [
            { titleAr: { contains: t.name, mode: "insensitive" as const } },
            { tags: { has: t.name } },
          ]),
        },
        orderBy: { publishedAt: "desc" },
        take: 4,
        select: { slug: true, titleAr: true },
      }),
      prisma.aITool.findMany({
        where: {
          published: true,
          slug: { notIn: tools.map((t) => t.slug) },
          toolCategory: { in: toolCategories },
        },
        orderBy: { viewCount: "desc" },
        take: 4,
        select: { slug: true, name: true },
      }),
      prisma.prompt.findMany({
        where: { published: true, toolId: { in: tools.map((t) => t.id) } },
        orderBy: { viewCount: "desc" },
        take: 4,
        select: { slug: true, titleAr: true },
      }),
    ]);
    return { reviews, relatedTools, prompts };
  } catch {
    return { reviews: [], relatedTools: [], prompts: [] };
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const comparison = await getComparison(slug);
  if (!comparison?.published) return {};
  const url = absoluteUrl(`/compare/${slug}`);
  const description = truncate(comparison.summaryAr, 160);
  return {
    title: `${comparison.title} | ${SITE_NAME_AR}`,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: `${comparison.title} | ${SITE_NAME_AR}`,
      description, url, type: "article", locale: "ar_AR",
      images: [{ url: `${SITE_URL}/opengraph-image`, width: 1200, height: 630, alt: comparison.title }],
    },
    twitter: {
      card: "summary_large_image",
      site: SITE_TWITTER_HANDLE,
      title: `${comparison.title} | ${SITE_NAME_AR}`,
      description,
      images: [`${SITE_URL}/opengraph-image`],
    },
  };
}

export default async function ComparisonPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const comparison = await getComparison(slug);
  if (!comparison?.published) notFound();

  const toolCategories = comparison.sides.map((s) => s.tool.toolCategory);
  const [otherComparisons, relatedContent] = await Promise.all([
    getOtherComparisons(slug, toolCategories),
    getRelatedContent(comparison.sides.map((s) => s.tool)),
  ]);

  const criteria = normalizeCriteria(comparison.criteria);
  const maxScore = getMaxScore(comparison.sides);
  const winner = comparison.sides.find((s) => isWinningSide(s, maxScore));
  const keyDifferences = getKeyDifferences(comparison.sides.map((s) => s.tool));

  const comparisonUrl = absoluteUrl(`/compare/${slug}`);
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: comparison.title,
    description: truncate(comparison.summaryAr, 160),
    url: comparisonUrl,
    inLanguage: "ar",
    dateModified: comparison.updatedAt.toISOString(),
    publisher: {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: SITE_NAME_AR,
    },
    about: comparison.sides.map((s) => ({
      "@type": "SoftwareApplication",
      name: s.tool.name,
      applicationCategory: "ArtificialIntelligenceApplication",
    })),
  };

  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: "الرئيسية", href: "/" },
    { name: "المقارنات", href: "/compare" },
    { name: comparison.title },
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <main className="container mx-auto max-w-5xl px-4 py-10" dir="rtl">

      {/* Breadcrumb */}
      <nav className="mb-8 flex items-center gap-2 text-sm" style={{ color: "var(--text-muted)" }}>
        <Link href="/" className="hover:underline">الرئيسية</Link>
        <span>/</span>
        <Link href="/compare" className="hover:underline">المقارنات</Link>
        <span>/</span>
        <span className="line-clamp-1 font-medium" style={{ color: "var(--text-secondary)" }}>{comparison.title}</span>
      </nav>

      {/* Hero */}
      <section className="mb-10 rounded-2xl border p-7 md:p-10"
        style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-surface)" }}>
        <p className="mb-3 text-sm font-semibold tracking-wide" style={{ color: "var(--accent)" }}>
          مقارنة تحريرية
        </p>
        <h1 className="mb-4 text-3xl font-bold leading-snug md:text-5xl"
          style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
          {comparison.title}
        </h1>
        <p className="max-w-3xl text-base leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          {comparison.summaryAr}
        </p>
      </section>

      {/* Tools VS row */}
      <section className="mb-10 flex flex-wrap items-center justify-center gap-4">
        {comparison.sides.map((side, i) => (
          <div key={side.id} className="flex items-center gap-4">
            {i > 0 && (
              <div className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-black"
                style={{ background: "var(--accent)", color: "#fff" }}>
                VS
              </div>
            )}
            <div className="flex items-center gap-3 rounded-2xl border px-5 py-3"
              style={{ borderColor: "var(--border-subtle)", background: "var(--bg-surface)" }}>
              <ToolLogo name={side.tool.name} logoUrl={side.tool.logoUrl} size={11} />
              <div>
                <p className="font-bold text-base" style={{ color: "var(--text-primary)" }}>{side.tool.name}</p>
                {side.tool.tagline && (
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>{side.tool.tagline}</p>
                )}
              </div>
              {side.score && (
                <div className="mr-1">
                  <ScoreRing score={side.score} winner={isWinningSide(side, maxScore)} />
                </div>
              )}
              {isWinningSide(side, maxScore) && (
                <Trophy className="h-5 w-5" style={{ color: "#ca8a04" }} />
              )}
            </div>
          </div>
        ))}
      </section>

      {/* Decision summary */}
      <DecisionSummary winner={winner} />

      {/* Choose X if / Choose Y if */}
      {comparison.sides.some((s) => s.bestFor || s.strengths.length > 0) && (
        <section className="mb-10 grid gap-4 sm:grid-cols-2">
          {comparison.sides.map((side) => (
            <ChooseIfCard key={side.id} toolName={side.tool.name} bestFor={side.bestFor} strengths={side.strengths} />
          ))}
        </section>
      )}

      {/* Key differences */}
      <KeyDifferences differences={keyDifferences} toolNames={comparison.sides.map((s) => s.tool.name)} />

      {/* Criteria chips */}
      {criteria.length > 0 && (
        <section className="mb-10">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
            معايير المقارنة
          </p>
          <div className="flex flex-wrap gap-2">
            {criteria.map((criterion) => (
              <span key={criterion}
                className="rounded-full border px-4 py-1.5 text-sm font-medium"
                style={{ borderColor: "var(--border-medium)", color: "var(--text-secondary)", background: "var(--bg-subtle)" }}>
                {criterion}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Methodology */}
      <MethodologySection methodology={comparison.methodology} />

      {/* Side cards */}
      <section className="grid gap-6 lg:grid-cols-2">
        {comparison.sides.map((side) => {
          const isWinner = isWinningSide(side, maxScore);
          return (
            <article key={side.id}
              className="rounded-2xl border overflow-hidden"
              style={{
                borderColor: isWinner ? "#86efac" : "var(--border-subtle)",
                background: "var(--bg-surface)",
                boxShadow: isWinner ? "0 0 0 2px #86efac33" : undefined,
              }}>

              {/* Card header */}
              <div className="flex items-center justify-between gap-4 p-5 pb-4"
                style={{ borderBottom: "1px solid var(--border-subtle)", background: isWinner ? "#f0fdf4" : "var(--bg-subtle)" }}>
                <div className="flex items-center gap-3">
                  <ToolLogo name={side.tool.name} logoUrl={side.tool.logoUrl} size={10} />
                  <div>
                    <Link href={`/ai-tools/${side.tool.slug}`}
                      className="text-lg font-bold hover:opacity-75 transition-opacity"
                      style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
                      {side.tool.name}
                    </Link>
                    {side.tool.tagline && (
                      <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{side.tool.tagline}</p>
                    )}
                  </div>
                </div>
                {side.score && <ScoreRing score={side.score} winner={isWinner} />}
              </div>

              <div className="p-5 space-y-5">
                {/* Meta pills */}
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full border px-3 py-1 text-xs font-medium"
                    style={{ borderColor: "var(--border-medium)", color: "var(--text-secondary)", background: "var(--bg-subtle)" }}>
                    💰 {pricingLabel(side.tool.pricing, side.tool.monthlyPrice)}
                  </span>
                  <span className="rounded-full border px-3 py-1 text-xs font-medium"
                    style={{
                      borderColor: side.tool.arabicSupport ? "#86efac" : "var(--border-medium)",
                      color: side.tool.arabicSupport ? "#16a34a" : "var(--text-muted)",
                      background: side.tool.arabicSupport ? "#f0fdf4" : "var(--bg-subtle)",
                    }}>
                    {side.tool.arabicSupport ? "✓ عربية" : "✗ بدون عربية"}
                  </span>
                  <span className="rounded-full border px-3 py-1 text-xs font-medium"
                    style={{
                      borderColor: side.tool.hasApi ? "#bfdbfe" : "var(--border-medium)",
                      color: side.tool.hasApi ? "#1d4ed8" : "var(--text-muted)",
                      background: side.tool.hasApi ? "#eff6ff" : "var(--bg-subtle)",
                    }}>
                    {side.tool.hasApi ? "✓ API" : "✗ بدون API"}
                  </span>
                </div>

                {/* Notes */}
                {side.notes && (
                  <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                    {side.notes}
                  </p>
                )}

                {/* Strengths & Weaknesses */}
                <div className="grid gap-3 sm:grid-cols-2">
                  {/* Strengths */}
                  <div className="rounded-xl p-4" style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
                    <p className="mb-3 text-xs font-bold uppercase tracking-wide" style={{ color: "#16a34a" }}>
                      نقاط القوة
                    </p>
                    <ul className="space-y-2">
                      {side.strengths.map((item) => (
                        <li key={item} className="flex items-start gap-2 text-sm" style={{ color: "#15803d" }}>
                          <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: "#22c55e" }} />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Weaknesses */}
                  <div className="rounded-xl p-4" style={{ background: "#fff1f2", border: "1px solid #fecdd3" }}>
                    <p className="mb-3 text-xs font-bold uppercase tracking-wide" style={{ color: "#be123c" }}>
                      نقاط الضعف
                    </p>
                    <ul className="space-y-2">
                      {side.weaknesses.map((item) => (
                        <li key={item} className="flex items-start gap-2 text-sm" style={{ color: "#9f1239" }}>
                          <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: "#f43f5e" }} />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Best for */}
                {side.bestFor && (
                  <div className="rounded-xl p-4"
                    style={{ background: "var(--accent-bg)", border: "1px solid var(--border-subtle)" }}>
                    <p className="text-xs font-semibold mb-1" style={{ color: "var(--accent)" }}>الأفضل لـ</p>
                    <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{side.bestFor}</p>
                  </div>
                )}

                {/* Not recommended for */}
                <NotRecommendedForBadge notRecommendedFor={side.notRecommendedFor} />
              </div>
            </article>
          );
        })}
      </section>

      {/* Verdict */}
      {comparison.verdict && (
        <section className="mt-10 rounded-2xl border-2 p-7"
          style={{ borderColor: "var(--accent)", background: "var(--accent-bg)" }}>
          <div className="flex items-center gap-3 mb-4">
            <Trophy className="h-6 w-6" style={{ color: "#ca8a04" }} />
            <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
              الخلاصة النهائية
            </h2>
          </div>
          <p className="text-base leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            {comparison.verdict}
          </p>
        </section>
      )}

      {/* Review date */}
      <div className="mt-4">
        <ReviewDateBadge reviewedAt={comparison.reviewedAt} />
      </div>

      {/* Related AI tools */}
      <RelatedContentSection
        heading="أدوات ذكاء اصطناعي مشابهة"
        items={relatedContent.relatedTools.map((t) => ({ href: `/ai-tools/${t.slug}`, title: t.name }))}
      />

      {/* Related reviews */}
      <RelatedContentSection
        heading="تقارير ذات صلة"
        items={relatedContent.reviews.map((r) => ({ href: `/reviews/${r.slug}`, title: r.titleAr }))}
      />

      {/* Related prompts */}
      <RelatedContentSection
        heading="برومبتات جاهزة لهذه الأدوات"
        items={relatedContent.prompts.map((p) => ({ href: `/prompts/${p.slug}`, title: p.titleAr }))}
      />

      {/* Editorial trust */}
      <EditorialTrustSection updatedAt={comparison.updatedAt} />

      {/* Other comparisons */}
      {otherComparisons.length > 0 && (
        <section className="mt-14">
          <h2 className="mb-5 text-lg font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
            مقارنات أخرى قد تهمك
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {otherComparisons.map((comp) => (
              <Link key={comp.id} href={`/compare/${comp.slug}`}
                className="group flex flex-col gap-3 rounded-2xl border p-4 transition-all hover:-translate-y-0.5 hover:shadow-md"
                style={{ borderColor: "var(--border-subtle)", background: "var(--bg-surface)" }}>
                <div className="flex flex-wrap items-center gap-2">
                  {comp.sides.map((side, i) => (
                    <div key={side.id} className="flex items-center gap-1.5">
                      {i > 0 && (
                        <span className="rounded px-1 py-0.5 text-[10px] font-black"
                          style={{ background: "var(--accent-bg)", color: "var(--accent)" }}>VS</span>
                      )}
                      {side.tool.logoUrl ? (
                        <img src={side.tool.logoUrl} alt={side.tool.name}
                          className="h-6 w-6 rounded-md object-contain"
                          style={{ background: "#f8fafc", border: "1px solid #e2e8f0", padding: 2 }} />
                      ) : (
                        <div className="flex h-6 w-6 items-center justify-center rounded-md text-[10px] font-bold text-white"
                          style={{ background: "var(--accent)" }}>
                          {side.tool.name[0]}
                        </div>
                      )}
                      <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                        {side.tool.name}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="text-sm font-bold leading-snug group-hover:opacity-75 transition-opacity"
                  style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
                  {comp.title}
                </p>
                <span className="text-xs font-semibold" style={{ color: "var(--accent)" }}>قرأ المقارنة ←</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Back link */}
      <div className="mt-10 text-center">
        <Link href="/compare"
          className="inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-semibold transition-all hover:opacity-80"
          style={{ borderColor: "var(--border-medium)", color: "var(--text-secondary)", background: "var(--bg-surface)" }}>
          <ArrowLeft className="h-4 w-4" />
          عودة لجميع المقارنات
        </Link>
      </div>
      </main>
    </>
  );
}
