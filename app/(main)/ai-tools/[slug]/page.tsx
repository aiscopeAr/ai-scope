import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/db";
import { absoluteUrl, SITE_NAME, SITE_NAME_AR, SITE_URL, truncate } from "@/lib/seo";
import { getCategoryMeta } from "@/lib/tool-categories";
import Breadcrumbs, { buildBreadcrumbJsonLd } from "@/components/Breadcrumbs";
import AdSlot from "@/components/AdSlot";
import ToolCard from "@/components/ToolCard";
import ToolInteractions from "@/components/ToolInteractions";

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const tool = await prisma.aITool.findUnique({ where: { slug } }).catch(() => null);
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

const PRICING_BADGE_CLS: Record<string, string> = {
  free:     "bg-emerald-500/15 border-emerald-500/30 text-emerald-400",
  freemium: "bg-amber-500/15 border-amber-500/30 text-amber-400",
  paid:     "bg-red-500/15 border-red-500/30 text-red-400",
};

interface FaqItem { question: string; answer: string; }

export default async function AIToolPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const [tool, relatedTools, relatedArticles] = await Promise.all([
    prisma.aITool.findUnique({
      where: { slug },
      include: {
        comparisons: { include: { comparison: true }, take: 3 },
      },
    }).catch(() => null),

    // Related: same category, different tool
    prisma.aITool.findMany({
      where: { published: true, slug: { not: slug } },
      orderBy: { viewCount: "desc" },
      take: 4,
      select: {
        id: true, slug: true, name: true, tagline: true, descriptionAr: true,
        logoUrl: true, toolCategory: true, pricing: true, monthlyPrice: true,
        arabicSupport: true, hasApi: true, tags: true, viewCount: true, likes: true,
        featured: true, editorPick: true,
      },
    }).catch(() => []),

    // Related articles mentioning this tool by name
    prisma.article.findMany({
      where: { published: true },
      orderBy: { publishedAt: "desc" },
      take: 4,
      select: { id: true, slug: true, titleAr: true, excerpt: true, publishedAt: true, sourceName: true },
    }).catch(() => []),
  ]);

  if (!tool || !tool.published) notFound();

  // Increment view (fire and forget)
  void prisma.aITool.update({ where: { id: tool.id }, data: { viewCount: { increment: 1 } } }).catch(() => {});

  const catMeta = getCategoryMeta(tool.toolCategory);
  const toolUrl = absoluteUrl(`/ai-tools/${slug}`);
  const faq = (Array.isArray(tool.faq) ? (tool.faq as unknown as FaqItem[]) : []);
  const pricingBadge = PRICING_BADGE_CLS[tool.pricing] ?? PRICING_BADGE_CLS.freemium;

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
      price: tool.pricing === "free" ? "0" : tool.monthlyPrice ?? undefined,
      priceCurrency: "USD",
      availability: "https://schema.org/OnlineOnly",
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

          {/* ─── Hero Header ─── */}
          <div className="mb-8 rounded-2xl border border-white/6 bg-white/3 p-6 md:p-8">
            <div className="flex items-start gap-5">
              {tool.logoUrl ? (
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                  <Image src={tool.logoUrl} alt={tool.imageAlt ?? tool.name} fill className="object-cover" unoptimized />
                </div>
              ) : (
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-violet-500/15 text-3xl font-black text-violet-400">
                  {tool.name[0]}
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h1 className="text-3xl font-black text-white md:text-4xl">{tool.name}</h1>
                  {tool.editorPick && (
                    <span className="rounded-full bg-amber-500/20 border border-amber-500/30 px-2 py-0.5 text-xs font-bold text-amber-400">⭐ اختيار المحررين</span>
                  )}
                  {tool.featured && (
                    <span className="rounded-full bg-violet-500/20 border border-violet-500/30 px-2 py-0.5 text-xs font-bold text-violet-400">مميز</span>
                  )}
                </div>
                {tool.tagline && <p className="text-lg text-slate-400 mb-3">{tool.tagline}</p>}

                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full border px-3 py-1 text-sm font-semibold ${pricingBadge}`}>
                    {PRICING_LABELS[tool.pricing] ?? tool.pricing}
                    {tool.monthlyPrice && tool.pricing !== "free" ? ` — يبدأ من $${tool.monthlyPrice}/شهر` : ""}
                  </span>
                  <Link href={`/ai-tools/for/${tool.toolCategory}`} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-slate-400 hover:border-violet-500/30 hover:text-violet-300 transition">
                    {catMeta.icon} {catMeta.labelAr}
                  </Link>
                  {tool.arabicSupport && (
                    <span className="rounded-full border border-teal-500/30 bg-teal-500/10 px-2.5 py-1 text-xs font-bold text-teal-400">يدعم العربية ✓</span>
                  )}
                  {tool.hasApi && (
                    <span className="rounded-full border border-blue-500/30 bg-blue-500/10 px-2.5 py-1 text-xs font-bold text-blue-400">API متاح</span>
                  )}
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-white/8 pt-5">
              {tool.website && (
                <a
                  href={tool.website}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-violet-500 transition"
                >
                  زيارة الموقع الرسمي ↗
                </a>
              )}
              <ToolInteractions toolId={tool.id} initialLikes={tool.likes} />
              <div className="mr-auto flex items-center gap-3 text-sm text-slate-500">
                <span>👁 {tool.viewCount.toLocaleString("ar-EG")} مشاهدة</span>
              </div>
            </div>
          </div>

          {/* Screenshots gallery */}
          {tool.screenshots.length > 0 && (
            <section className="mb-8">
              <h2 className="mb-4 text-xl font-black text-white">لقطات الشاشة</h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {tool.screenshots.map((url, i) => (
                  <div key={i} className="relative aspect-video overflow-hidden rounded-xl border border-white/8 bg-white/3">
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
                <h2 className="mb-4 text-xl font-black text-white">ما هو {tool.name}؟</h2>
                <div className="text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {tool.contentAr ?? tool.descriptionAr}
                </div>
              </section>

              {/* Tags */}
              {tool.tags.length > 0 && (
                <div className="mb-8 flex flex-wrap gap-2">
                  {tool.tags.map((t) => (
                    <span key={t} className="rounded-full border border-white/8 bg-white/4 px-3 py-1 text-xs text-slate-400">{t}</span>
                  ))}
                </div>
              )}

              {/* Pros & Cons */}
              {(tool.pros.length > 0 || tool.cons.length > 0) && (
                <section className="mb-8">
                  <h2 className="mb-4 text-xl font-black text-white">المميزات والعيوب</h2>
                  <div className="grid gap-4 md:grid-cols-2">
                    {tool.pros.length > 0 && (
                      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/8 p-5">
                        <h3 className="mb-3 font-bold text-emerald-400">المميزات</h3>
                        <ul className="space-y-2">
                          {tool.pros.map((p, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-emerald-300">
                              <span className="mt-0.5 shrink-0 text-emerald-500">✓</span>
                              <span>{p}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {tool.cons.length > 0 && (
                      <div className="rounded-xl border border-red-500/20 bg-red-500/8 p-5">
                        <h3 className="mb-3 font-bold text-red-400">العيوب</h3>
                        <ul className="space-y-2">
                          {tool.cons.map((c, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-red-300">
                              <span className="mt-0.5 shrink-0 text-red-500">✗</span>
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
                  <h2 className="mb-4 text-xl font-black text-white">حالات الاستخدام</h2>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {tool.useCases.map((uc, i) => (
                      <div key={i} className="flex items-start gap-3 rounded-xl border border-white/6 bg-white/3 p-4">
                        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-500/15 text-xs font-bold text-violet-400">
                          {i + 1}
                        </span>
                        <span className="text-sm text-slate-300">{uc}</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Pricing */}
              {tool.pricingDetails && (
                <section className="mb-8">
                  <h2 className="mb-4 text-xl font-black text-white">خطط الأسعار</h2>
                  <div className="rounded-xl border border-white/6 bg-white/3 p-5">
                    <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{tool.pricingDetails}</div>
                  </div>
                </section>
              )}

              <AdSlot position="tool-mid" className="mb-8" />

              {/* FAQ */}
              {faq.length > 0 && (
                <section className="mb-8">
                  <h2 className="mb-4 text-xl font-black text-white">الأسئلة الشائعة</h2>
                  <div className="space-y-3">
                    {faq.map((f, i) => (
                      <details key={i} className="group rounded-xl border border-white/6 bg-white/3 open:border-violet-500/30">
                        <summary className="flex cursor-pointer items-center justify-between gap-3 p-4 font-semibold text-slate-200 list-none">
                          <span>{f.question}</span>
                          <span className="shrink-0 text-violet-400 transition group-open:rotate-180">↓</span>
                        </summary>
                        <div className="border-t border-white/5 px-4 pb-4 pt-3 text-sm text-slate-400 leading-relaxed">
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
                  <h2 className="mb-4 text-xl font-black text-white">مقارنات تتضمن {tool.name}</h2>
                  <div className="space-y-3">
                    {tool.comparisons.map((side) => (
                      <Link
                        key={side.id}
                        href={`/compare/${side.comparison.slug}`}
                        className="flex items-center justify-between rounded-xl border border-white/6 bg-white/3 p-4 hover:border-violet-500/30 hover:bg-violet-500/5 transition"
                      >
                        <span className="font-medium text-slate-200">{side.comparison.title}</span>
                        <span className="text-sm text-violet-400">عرض المقارنة ←</span>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {/* Related articles */}
              {relatedArticles.length > 0 && (
                <section className="mb-8">
                  <h2 className="mb-4 text-xl font-black text-white">مقالات ذات صلة</h2>
                  <div className="space-y-3">
                    {relatedArticles.map((a) => (
                      <Link
                        key={a.id}
                        href={`/news/${a.slug}`}
                        className="flex items-start gap-3 rounded-xl border border-white/6 bg-white/3 p-4 hover:border-violet-500/30 hover:bg-violet-500/5 transition group"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-slate-200 group-hover:text-violet-300 transition-colors line-clamp-1">{a.titleAr}</p>
                          {a.excerpt && <p className="mt-1 text-xs text-slate-500 line-clamp-1">{a.excerpt}</p>}
                        </div>
                        <span className="shrink-0 text-xs text-slate-600">{a.sourceName}</span>
                      </Link>
                    ))}
                  </div>
                </section>
              )}
            </div>

            {/* Sidebar */}
            <aside className="space-y-5">
              {/* Quick info card */}
              <div className="rounded-xl border border-white/6 bg-white/3 p-5">
                <h3 className="mb-4 font-black text-white text-sm">معلومات سريعة</h3>
                <dl className="space-y-3 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <dt className="text-slate-500">التصنيف</dt>
                    <dd className="font-medium text-slate-300">{catMeta.icon} {catMeta.labelAr}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <dt className="text-slate-500">التسعير</dt>
                    <dd className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${pricingBadge}`}>{PRICING_LABELS[tool.pricing]}</dd>
                  </div>
                  {tool.monthlyPrice && tool.pricing !== "free" && (
                    <div className="flex items-center justify-between gap-2">
                      <dt className="text-slate-500">يبدأ من</dt>
                      <dd className="font-medium text-slate-300">${tool.monthlyPrice}/شهر</dd>
                    </div>
                  )}
                  <div className="flex items-center justify-between gap-2">
                    <dt className="text-slate-500">دعم العربية</dt>
                    <dd className={`font-medium ${tool.arabicSupport ? "text-teal-400" : "text-slate-500"}`}>{tool.arabicSupport ? "نعم ✓" : "لا"}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <dt className="text-slate-500">واجهة API</dt>
                    <dd className={`font-medium ${tool.hasApi ? "text-blue-400" : "text-slate-500"}`}>{tool.hasApi ? "متوفر ✓" : "غير متوفر"}</dd>
                  </div>
                  {tool.releaseDate && (
                    <div className="flex items-center justify-between gap-2">
                      <dt className="text-slate-500">تاريخ الإصدار</dt>
                      <dd className="font-medium text-slate-300">{tool.releaseDate.getFullYear()}</dd>
                    </div>
                  )}
                </dl>
                {tool.website && (
                  <a
                    href={tool.website}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600/20 border border-violet-500/30 px-4 py-2.5 text-sm font-bold text-violet-400 hover:bg-violet-600/30 transition"
                  >
                    زيارة الموقع ↗
                  </a>
                )}
              </div>

              {/* Compare CTA */}
              <div className="rounded-xl border border-white/6 bg-white/3 p-5">
                <h3 className="mb-2 font-black text-white text-sm">قارن مع أداة أخرى</h3>
                <p className="mb-3 text-xs text-slate-500">اكتشف الأنسب لك بمقارنة مفصّلة</p>
                <Link
                  href="/compare"
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-400 hover:border-violet-500/30 hover:text-violet-300 transition"
                >
                  ⚖️ فتح أداة المقارنة
                </Link>
              </div>

              {/* Related topics */}
              {tool.relatedTopics.length > 0 && (
                <div className="rounded-xl border border-white/6 bg-white/3 p-5">
                  <h3 className="mb-3 font-black text-white text-sm">مواضيع ذات صلة</h3>
                  <div className="flex flex-wrap gap-2">
                    {tool.relatedTopics.map((t) => (
                      <span key={t} className="rounded-full border border-white/8 bg-white/4 px-2.5 py-1 text-xs text-slate-400">{t}</span>
                    ))}
                  </div>
                </div>
              )}
            </aside>
          </div>

          {/* Related tools */}
          {relatedTools.length > 0 && (
            <section className="mt-10 border-t border-white/8 pt-10">
              <h2 className="mb-6 text-xl font-black text-white">أدوات مشابهة</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {relatedTools.map((t) => <ToolCard key={t.id} tool={t} compact />)}
              </div>
            </section>
          )}

          {/* Back links */}
          <div className="mt-8 border-t border-white/8 pt-6 flex flex-wrap items-center gap-4">
            <Link href="/ai-tools" className="text-sm text-violet-400 hover:text-violet-300 transition-colors">← جميع أدوات الذكاء الاصطناعي</Link>
            <Link href={`/ai-tools/for/${tool.toolCategory}`} className="text-sm text-slate-500 hover:text-slate-300 transition-colors">أدوات {catMeta.labelAr}</Link>
            <Link href={`/compare`} className="text-sm text-slate-500 hover:text-slate-300 transition-colors">مقارن الأدوات</Link>
          </div>
        </div>
      </main>
    </>
  );
}
