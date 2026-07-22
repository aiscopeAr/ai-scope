import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db";
import { absoluteUrl, SITE_NAME, SITE_NAME_AR, SITE_URL, SITE_TWITTER_HANDLE, truncate } from "@/lib/seo";
import { getCategoryMeta } from "@/lib/tool-categories";
import { CACHE_TAGS, DEFAULT_REVALIDATE_SECONDS } from "@/lib/cache";
import Breadcrumbs from "@/components/Breadcrumbs";
import { buildBreadcrumbJsonLd } from "@/lib/breadcrumb-jsonld";
import AdSlot from "@/components/AdSlot";
import ToolCard from "@/components/ToolCard";
import ToolInteractions from "@/components/ToolInteractions";

const getToolBySlug = unstable_cache(
  async (slug: string) => prisma.aITool.findUnique({ where: { slug } }).catch(() => null),
  ["ai-tool-by-slug"],
  { tags: [CACHE_TAGS.aiTools], revalidate: DEFAULT_REVALIDATE_SECONDS },
);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const tool = await getToolBySlug(slug);
  if (!tool || !tool.published) return {};

  const url = absoluteUrl(`/ai-tools/${slug}`);
  const title = tool.seoTitle ?? `${tool.name} — مراجعة وشرح بالعربية | ${SITE_NAME_AR}`;
  const description = tool.seoDescription ?? truncate(tool.descriptionAr, 160);

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      url,
      title,
      description,
      locale: "ar_AR",
      siteName: SITE_NAME,
      ...(tool.logoUrl ? { images: [{ url: tool.logoUrl, alt: tool.imageAlt ?? tool.name }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      site: SITE_TWITTER_HANDLE,
      title,
      description,
    },
  };
}

const PRICING_LABELS: Record<string, string> = {
  free:     "مجاني تماماً",
  freemium: "مجاني مع خطط مدفوعة",
  paid:     "مدفوع",
};

const PRICING_BADGE: Record<string, { bg: string; color: string; border: string }> = {
  free:     { bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0" },
  freemium: { bg: "#fffbeb", color: "#b45309", border: "#fde68a" },
  paid:     { bg: "#fff1f2", color: "#be123c", border: "#fecdd3" },
};

interface FaqItem { question: string; answer: string; }

const getToolPageData = unstable_cache(
  async (slug: string) => {
    const [tool, toolPrompts] = await Promise.all([
      prisma.aITool.findUnique({
        where: { slug },
        include: {
          comparisons: { include: { comparison: true }, take: 3 },
        },
      }).catch(() => null),

      prisma.prompt.findMany({
        where: { published: true, tool: { slug } },
        orderBy: [{ featured: "desc" }, { viewCount: "desc" }],
        take: 6,
        select: { id: true, slug: true, titleAr: true, description: true, category: true, viewCount: true },
      }).catch(() => []),
    ]);

    if (!tool || !tool.published) return null;

    const [sameCategoryTools, relatedReviews] = await Promise.all([
      // Related tools — same toolCategory first, only backfill with popular tools if too few
      prisma.aITool.findMany({
        where: { published: true, slug: { not: slug }, toolCategory: tool.toolCategory },
        orderBy: { viewCount: "desc" },
        take: 4,
        select: {
          id: true, slug: true, name: true, tagline: true, descriptionAr: true,
          logoUrl: true, toolCategory: true, pricing: true, monthlyPrice: true,
          arabicSupport: true, hasApi: true, tags: true, viewCount: true, likes: true,
          featured: true, editorPick: true,
        },
      }).catch(() => []),

      // Reviews that actually mention this tool by name, falling back to same-category reviews
      prisma.review.findMany({
        where: {
          published: true,
          OR: [
            { titleAr: { contains: tool.name, mode: "insensitive" } },
            { tags: { has: tool.name } },
          ],
        },
        orderBy: { publishedAt: "desc" },
        take: 4,
        select: { id: true, slug: true, titleAr: true, summary: true, publishedAt: true, authorSlug: true },
      }).catch(() => []),
    ]);

    let relatedTools = sameCategoryTools;
    if (relatedTools.length < 4) {
      const backfillTools = await prisma.aITool.findMany({
        where: {
          published: true,
          slug: { notIn: [slug, ...relatedTools.map((t) => t.slug)] },
        },
        orderBy: { viewCount: "desc" },
        take: 4 - relatedTools.length,
        select: {
          id: true, slug: true, name: true, tagline: true, descriptionAr: true,
          logoUrl: true, toolCategory: true, pricing: true, monthlyPrice: true,
          arabicSupport: true, hasApi: true, tags: true, viewCount: true, likes: true,
          featured: true, editorPick: true,
        },
      }).catch(() => []);
      relatedTools = [...relatedTools, ...backfillTools];
    }

    let relatedReviewsList = relatedReviews;
    if (relatedReviewsList.length === 0) {
      // No review mentions this tool by name — fall back to the general "ai-tools" review category
      relatedReviewsList = await prisma.review.findMany({
        where: { published: true, category: { slug: "ai-tools" } },
        orderBy: { publishedAt: "desc" },
        take: 4,
        select: { id: true, slug: true, titleAr: true, summary: true, publishedAt: true, authorSlug: true },
      }).catch(() => []);
    }

    return { tool, toolPrompts, relatedTools, relatedReviewsList };
  },
  ["ai-tool-page"],
  { tags: [CACHE_TAGS.aiTools, CACHE_TAGS.reviews, CACHE_TAGS.prompts], revalidate: DEFAULT_REVALIDATE_SECONDS },
);

export default async function AIToolPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const data = await getToolPageData(slug);
  if (!data) notFound();
  const { tool, toolPrompts, relatedTools, relatedReviewsList } = data;

  void prisma.aITool.update({ where: { id: tool.id }, data: { viewCount: { increment: 1 } } }).catch(() => {});

  const catMeta = getCategoryMeta(tool.toolCategory);
  const toolUrl = absoluteUrl(`/ai-tools/${slug}`);
  const faq = (Array.isArray(tool.faq) ? (tool.faq as unknown as FaqItem[]) : []);
  const pricingStyle = PRICING_BADGE[tool.pricing] ?? PRICING_BADGE.freemium;

  const breadcrumbItems = [
    { name: "الرئيسية", href: "/" },
    { name: "أدوات AI", href: "/ai-tools" },
    { name: catMeta.labelAr, href: `/ai-tools/for/${tool.toolCategory}` },
    { name: tool.name },
  ];

  const softwareJsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: tool.name,
    url: tool.website ?? toolUrl,
    applicationCategory: "ArtificialIntelligenceApplication",
    operatingSystem: "Web",
    description: truncate(tool.descriptionAr, 200),
    inLanguage: ["ar", ...(tool.arabicSupport ? ["ar"] : [])],
    offers: {
      "@type": "Offer",
      ...(tool.pricing === "free"
        ? { price: "0", priceCurrency: "USD" }
        : tool.monthlyPrice
        ? { price: String(tool.monthlyPrice), priceCurrency: "USD" }
        : {}),
      availability: "https://schema.org/OnlineOnly",
      name: PRICING_LABELS[tool.pricing] ?? tool.pricing,
    },
    aggregateRating: tool.likes > 0 ? {
      "@type": "AggregateRating",
      ratingValue: Math.min(5, 3.5 + (tool.likes / 100)),
      ratingCount: tool.likes,
    } : undefined,
    publisher: {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: SITE_NAME,
    },
  };

  const faqJsonLd = faq.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  } : null;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(buildBreadcrumbJsonLd(breadcrumbItems)) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareJsonLd) }} />
      {faqJsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />}

      <main dir="rtl">
        <div className="container mx-auto max-w-5xl px-4 py-8">
          <Breadcrumbs items={breadcrumbItems} className="mb-6" />

          <AdSlot position="tool-top" className="mb-6" />

          {/* Hero Header */}
          <div className="mb-8 rounded-[6px] border p-6 md:p-8" style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-surface)" }}>
            <div className="flex items-start gap-5">
              {tool.logoUrl ? (
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-[6px] border" style={{ borderColor: "var(--border-subtle)" }}>
                  <Image src={tool.logoUrl} alt={tool.imageAlt ?? tool.name} fill className="object-cover" />
                </div>
              ) : (
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[6px] text-3xl font-black"
                  style={{ backgroundColor: "var(--accent-bg)", color: "var(--accent)" }}>
                  {tool.name[0]}
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h1 className="text-3xl font-bold md:text-4xl" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>{tool.name}</h1>
                  {tool.editorPick && (
                    <span className="rounded-[3px] border px-2 py-0.5 text-xs font-bold"
                      style={{ backgroundColor: "#fffbeb", color: "#b45309", borderColor: "#fde68a" }}>⭐ اختيار المحررين</span>
                  )}
                  {tool.featured && (
                    <span className="rounded-[3px] border px-2 py-0.5 text-xs font-bold"
                      style={{ backgroundColor: "var(--accent-bg)", color: "var(--accent)", borderColor: "var(--accent)" }}>مميز</span>
                  )}
                </div>
                {tool.tagline && <p className="text-lg mb-3" style={{ color: "var(--text-secondary)" }}>{tool.tagline}</p>}

                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-[3px] border px-3 py-1 text-sm font-semibold"
                    style={{ backgroundColor: pricingStyle.bg, color: pricingStyle.color, borderColor: pricingStyle.border }}>
                    {PRICING_LABELS[tool.pricing] ?? tool.pricing}
                    {tool.monthlyPrice && tool.pricing !== "free" ? ` — يبدأ من $${tool.monthlyPrice}/شهر` : ""}
                  </span>
                  <Link
                    href={`/ai-tools/for/${tool.toolCategory}`}
                    className="pill-hover "
                    style={{ borderColor: "var(--border-medium)", color: "var(--text-secondary)" }}
                  >
                    {catMeta.icon} {catMeta.labelAr}
                  </Link>
                  {tool.arabicSupport && (
                    <span className="rounded-[3px] border px-2.5 py-1 text-xs font-bold"
                      style={{ backgroundColor: "#f0fdfa", color: "#0d9488", borderColor: "#99f6e4" }}>يدعم العربية ✓</span>
                  )}
                  {tool.hasApi && (
                    <span className="rounded-[3px] border px-2.5 py-1 text-xs font-bold"
                      style={{ backgroundColor: "#eff6ff", color: "#2563eb", borderColor: "#bfdbfe" }}>API متاح</span>
                  )}
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="mt-5 flex flex-wrap items-center gap-3 border-t pt-5" style={{ borderColor: "var(--border-subtle)" }}>
              {tool.website && (
                <a href={tool.website} target="_blank" rel="noopener noreferrer nofollow"
                  className="btn-primary flex items-center gap-2">
                  زيارة الموقع الرسمي ↗
                </a>
              )}
              <ToolInteractions toolId={tool.id} initialLikes={tool.likes} />
              <div className="mr-auto flex items-center gap-3 text-sm" style={{ color: "var(--text-muted)" }}>
                <span>👁 {tool.viewCount.toLocaleString("ar-EG")} مشاهدة</span>
              </div>
            </div>
          </div>

          {/* Screenshots */}
          {tool.screenshots.length > 0 && (
            <section className="mb-8">
              <h2 className="mb-4 text-xl font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>لقطات الشاشة</h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {tool.screenshots.map((url, i) => (
                  <div key={i} className="relative aspect-video overflow-hidden rounded-[6px] border" style={{ borderColor: "var(--border-subtle)" }}>
                    <Image src={url} alt={`${tool.name} — لقطة ${i + 1}`} fill className="object-cover" unoptimized />
                  </div>
                ))}
              </div>
            </section>
          )}

          <div className="grid gap-8 lg:grid-cols-[1fr_280px]">
            <div>
              {/* Main description */}
              <section className="mb-8">
                <h2 className="mb-4 text-xl font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>ما هو {tool.name}؟</h2>
                <div className="leading-relaxed whitespace-pre-wrap" style={{ color: "var(--text-secondary)" }}>
                  {tool.contentAr ?? tool.descriptionAr}
                </div>
              </section>

              {/* Tags */}
              {tool.tags.length > 0 && (
                <div className="mb-8 flex flex-wrap gap-2">
                  {tool.tags.map((t) => (
                    <span key={t} className="rounded-[3px] border px-3 py-1 text-xs"
                      style={{ borderColor: "var(--border-medium)", color: "var(--text-muted)", backgroundColor: "var(--bg-subtle)" }}>{t}</span>
                  ))}
                </div>
              )}

              {/* Pros & Cons */}
              {(tool.pros.length > 0 || tool.cons.length > 0) && (
                <section className="mb-8">
                  <h2 className="mb-4 text-xl font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>المميزات والعيوب</h2>
                  <div className="grid gap-4 md:grid-cols-2">
                    {tool.pros.length > 0 && (
                      <div className="rounded-[6px] border p-5" style={{ borderColor: "#bbf7d0", backgroundColor: "#f0fdf4" }}>
                        <h3 className="mb-3 font-bold" style={{ color: "#16a34a" }}>المميزات</h3>
                        <ul className="space-y-2">
                          {tool.pros.map((p, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm" style={{ color: "#15803d" }}>
                              <span className="mt-0.5 shrink-0" style={{ color: "#16a34a" }}>✓</span>
                              <span>{p}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {tool.cons.length > 0 && (
                      <div className="rounded-[6px] border p-5" style={{ borderColor: "#fecdd3", backgroundColor: "#fff1f2" }}>
                        <h3 className="mb-3 font-bold" style={{ color: "#be123c" }}>العيوب</h3>
                        <ul className="space-y-2">
                          {tool.cons.map((c, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm" style={{ color: "#9f1239" }}>
                              <span className="mt-0.5 shrink-0" style={{ color: "#be123c" }}>✗</span>
                              <span>{c}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* Use Cases */}
              {tool.useCases.length > 0 && (
                <section className="mb-8">
                  <h2 className="mb-4 text-xl font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>حالات الاستخدام</h2>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {tool.useCases.map((uc, i) => (
                      <div key={i} className="flex items-start gap-3 rounded-[6px] border p-4" style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-surface)" }}>
                        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-[3px] text-xs font-bold"
                          style={{ backgroundColor: "var(--accent-bg)", color: "var(--accent)" }}>
                          {i + 1}
                        </span>
                        <span className="text-sm" style={{ color: "var(--text-secondary)" }}>{uc}</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Pricing */}
              {tool.pricingDetails && (
                <section className="mb-8">
                  <h2 className="mb-4 text-xl font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>خطط الأسعار</h2>
                  <div className="rounded-[6px] border p-5" style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-surface)" }}>
                    <div className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "var(--text-secondary)" }}>{tool.pricingDetails}</div>
                  </div>
                </section>
              )}

              <AdSlot position="tool-mid" className="mb-8" />

              {/* FAQ */}
              {faq.length > 0 && (
                <section className="mb-8">
                  <h2 className="mb-4 text-xl font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>الأسئلة الشائعة</h2>
                  <div className="space-y-3">
                    {faq.map((f, i) => (
                      <details key={i} className="group rounded-[6px] border transition" style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-surface)" }}>
                        <summary className="flex cursor-pointer items-center justify-between gap-3 p-4 font-semibold list-none" style={{ color: "var(--text-primary)" }}>
                          <span>{f.question}</span>
                          <span className="shrink-0 transition group-open:rotate-180" style={{ color: "var(--accent)" }}>↓</span>
                        </summary>
                        <div className="border-t px-4 pb-4 pt-3 text-sm leading-relaxed" style={{ borderColor: "var(--border-subtle)", color: "var(--text-secondary)" }}>
                          {f.answer}
                        </div>
                      </details>
                    ))}
                  </div>
                </section>
              )}

              {/* Comparisons */}
              {tool.comparisons.length > 0 && (
                <section className="mb-8">
                  <h2 className="mb-4 text-xl font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>مقارنات تتضمن {tool.name}</h2>
                  <div className="space-y-3">
                    {tool.comparisons.map((side) => (
                      <Link
                        key={side.id}
                        href={`/compare/${side.comparison.slug}`}
                        className="card-hover "
                        style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-surface)" }}
                      >
                        <span className="font-medium" style={{ color: "var(--text-primary)" }}>{side.comparison.title}</span>
                        <span className="text-sm" style={{ color: "var(--accent)" }}>عرض المقارنة ←</span>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {/* Related reviews */}
              {relatedReviewsList.length > 0 && (
                <section className="mb-8">
                  <h2 className="mb-4 text-xl font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>تقارير ذات صلة</h2>
                  <div className="space-y-3">
                    {relatedReviewsList.map((r) => (
                      <Link
                        key={r.id}
                        href={`/reviews/${r.slug}`}
                        className="card-hover "
                        style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-surface)" }}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold transition-opacity group-hover:opacity-75 line-clamp-1" style={{ color: "var(--text-primary)" }}>{r.titleAr}</p>
                          {r.summary && <p className="mt-1 text-xs line-clamp-1" style={{ color: "var(--text-muted)" }}>{r.summary}</p>}
                        </div>
                        <span className="shrink-0 text-xs" style={{ color: "var(--text-muted)" }}>{r.authorSlug}</span>
                      </Link>
                    ))}
                  </div>
                </section>
              )}
            </div>

            {/* Sidebar */}
            <aside className="space-y-5">
              {/* Quick info card */}
              <div className="rounded-[6px] border p-5" style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-surface)" }}>
                <h3 className="mb-4 font-bold text-sm" style={{ color: "var(--text-primary)" }}>معلومات سريعة</h3>
                <dl className="space-y-3 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <dt style={{ color: "var(--text-muted)" }}>التصنيف</dt>
                    <dd className="font-medium" style={{ color: "var(--text-primary)" }}>{catMeta.icon} {catMeta.labelAr}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <dt style={{ color: "var(--text-muted)" }}>التسعير</dt>
                    <dd className="rounded-[3px] border px-2 py-0.5 text-xs font-semibold"
                      style={{ backgroundColor: pricingStyle.bg, color: pricingStyle.color, borderColor: pricingStyle.border }}>
                      {PRICING_LABELS[tool.pricing]}
                    </dd>
                  </div>
                  {tool.monthlyPrice && tool.pricing !== "free" && (
                    <div className="flex items-center justify-between gap-2">
                      <dt style={{ color: "var(--text-muted)" }}>يبدأ من</dt>
                      <dd className="font-medium" style={{ color: "var(--text-primary)" }}>${tool.monthlyPrice}/شهر</dd>
                    </div>
                  )}
                  <div className="flex items-center justify-between gap-2">
                    <dt style={{ color: "var(--text-muted)" }}>دعم العربية</dt>
                    <dd className="font-medium" style={{ color: tool.arabicSupport ? "#0d9488" : "var(--text-muted)" }}>{tool.arabicSupport ? "نعم ✓" : "لا"}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <dt style={{ color: "var(--text-muted)" }}>واجهة API</dt>
                    <dd className="font-medium" style={{ color: tool.hasApi ? "#2563eb" : "var(--text-muted)" }}>{tool.hasApi ? "متوفر ✓" : "غير متوفر"}</dd>
                  </div>
                  {tool.releaseDate && (
                    <div className="flex items-center justify-between gap-2">
                      <dt style={{ color: "var(--text-muted)" }}>تاريخ الإصدار</dt>
                      <dd className="font-medium" style={{ color: "var(--text-primary)" }}>{tool.releaseDate.getFullYear()}</dd>
                    </div>
                  )}
                </dl>
                {tool.website && (
                  <a href={tool.website} target="_blank" rel="noopener noreferrer nofollow"
                    className="btn-primary mt-4 flex w-full items-center justify-center gap-2">
                    زيارة الموقع ↗
                  </a>
                )}
              </div>

              {/* Compare CTA */}
              <div className="rounded-[6px] border p-5" style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-surface)" }}>
                <h3 className="mb-2 font-bold text-sm" style={{ color: "var(--text-primary)" }}>قارن مع أداة أخرى</h3>
                <p className="mb-3 text-xs" style={{ color: "var(--text-muted)" }}>اكتشف الأنسب لك بمقارنة مفصّلة</p>
                <Link
                  href="/compare"
                  className="pill-hover "
                  style={{ borderColor: "var(--border-medium)", color: "var(--text-secondary)", backgroundColor: "var(--bg-subtle)" }}
                >
                  ⚖️ فتح أداة المقارنة
                </Link>
              </div>

              {/* Related topics */}
              {tool.relatedTopics.length > 0 && (
                <div className="rounded-[6px] border p-5" style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-surface)" }}>
                  <h3 className="mb-3 font-bold text-sm" style={{ color: "var(--text-primary)" }}>مواضيع ذات صلة</h3>
                  <div className="flex flex-wrap gap-2">
                    {tool.relatedTopics.map((t) => (
                      <span key={t} className="rounded-[3px] border px-2.5 py-1 text-xs"
                        style={{ borderColor: "var(--border-medium)", color: "var(--text-muted)", backgroundColor: "var(--bg-subtle)" }}>{t}</span>
                    ))}
                  </div>
                </div>
              )}
            </aside>
          </div>

          {/* Prompts for this tool */}
          {toolPrompts.length > 0 && (
            <section className="mt-10 border-t pt-10" style={{ borderColor: "var(--border-subtle)" }}>
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
                  برومبتس جاهزة لـ {tool.name}
                </h2>
                <Link href={`/prompts?toolId=${tool.id}`} className="text-sm" style={{ color: "var(--accent)" }}>
                  عرض الكل ←
                </Link>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {toolPrompts.map((p) => (
                  <Link
                    key={p.id}
                    href={`/prompts/${p.slug}`}
                    className="card-hover group"
                    style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-surface)" }}
                  >
                    <p className="font-semibold line-clamp-2 transition-opacity group-hover:opacity-75" style={{ color: "var(--text-primary)" }}>
                      {p.titleAr}
                    </p>
                    {p.description && (
                      <p className="mt-1 text-xs line-clamp-2" style={{ color: "var(--text-muted)" }}>{p.description}</p>
                    )}
                    <span className="mt-2 block text-xs" style={{ color: "var(--accent)" }}>نسخ البرومبت ←</span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Related tools */}
          {relatedTools.length > 0 && (
            <section className="mt-10 border-t pt-10" style={{ borderColor: "var(--border-subtle)" }}>
              <h2 className="mb-6 text-xl font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>أدوات مشابهة</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {relatedTools.map((t) => <ToolCard key={t.id} tool={t} />)}
              </div>
            </section>
          )}

          {/* Back links */}
          <div className="mt-8 border-t pt-6 flex flex-wrap items-center gap-4" style={{ borderColor: "var(--border-subtle)" }}>
            <Link href="/ai-tools" className="text-sm hover-opacity transition" style={{ color: "var(--accent)" }}>
              ← جميع أدوات الذكاء الاصطناعي
            </Link>
            <Link href={`/ai-tools/for/${tool.toolCategory}`} className="link-secondary text-sm transition">
              أدوات {catMeta.labelAr}
            </Link>
            <Link href="/compare" className="link-secondary text-sm transition">
              مقارن الأدوات
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
