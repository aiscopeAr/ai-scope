import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/db";
import { absoluteUrl, SITE_NAME_AR, SITE_URL, truncate } from "@/lib/seo";
import AdSlot from "@/components/AdSlot";
import Breadcrumbs, { buildBreadcrumbJsonLd } from "@/components/Breadcrumbs";

export const revalidate = 3600;

const PRICING_BADGE: Record<string, string> = {
  free:     "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  freemium: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  paid:     "bg-red-500/10 text-red-400 border-red-500/20",
};
const PRICING_LABEL: Record<string, string> = {
  free: "مجاني", freemium: "مجاني+", paid: "مدفوع",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const tool = await prisma.aITool.findUnique({ where: { slug }, select: { name: true, category: true, tagline: true } }).catch(() => null);
  if (!tool) return {};

  const url = absoluteUrl(`/alternatives/${slug}`);
  const title = `أفضل بدائل ${tool.name} في 2025`;
  const description = `اكتشف أفضل البدائل لـ ${tool.name} — مقارنة مفصلة بالمميزات والأسعار لمساعدتك في اختيار الأداة المناسبة.`;

  return {
    title: `${title} | ${SITE_NAME_AR}`,
    description,
    alternates: { canonical: url },
    keywords: `بدائل ${tool.name}, أفضل ${tool.name} بديل, ${tool.name} vs`,
    openGraph: {
      title,
      description,
      url,
      locale: "ar_AR",
      type: "article",
    },
  };
}

export default async function AlternativesPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const mainTool = await prisma.aITool.findUnique({
    where: { slug, published: true },
  }).catch(() => null);

  if (!mainTool) notFound();

  // Get alternatives: same category, excluding the main tool, sorted by views
  const alternatives = await prisma.aITool.findMany({
    where: {
      published: true,
      category: mainTool.category,
      id: { not: mainTool.id },
    },
    orderBy: [{ featuredAt: { sort: "desc", nulls: "last" } }, { viewCount: "desc" }],
    take: 9,
  }).catch(() => []);

  // If not enough same-category, pad with other tools
  const altIds = new Set(alternatives.map((a) => a.id));
  altIds.add(mainTool.id);
  const extras = alternatives.length < 4
    ? await prisma.aITool.findMany({
        where: { published: true, id: { notIn: [...altIds] } },
        orderBy: { viewCount: "desc" },
        take: 6 - alternatives.length,
      }).catch(() => [])
    : [];

  const allAlternatives = [...alternatives, ...extras];

  // Related comparisons involving the main tool
  const comparisons = await prisma.comparisonSide.findMany({
    where: { toolId: mainTool.id },
    include: { comparison: true },
    take: 3,
  }).catch(() => []);

  const pageUrl = absoluteUrl(`/alternatives/${slug}`);
  const breadcrumbItems = [
    { name: "الرئيسية", href: "/" },
    { name: "أدوات AI", href: "/ai-tools" },
    { name: mainTool.name, href: `/ai-tools/${slug}` },
    { name: `بدائل ${mainTool.name}` },
  ];

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `أفضل بدائل ${mainTool.name}`,
    url: pageUrl,
    numberOfItems: allAlternatives.length,
    itemListElement: allAlternatives.map((t, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: t.name,
      url: `${SITE_URL}/ai-tools/${t.slug}`,
    })),
  };

  // Other tools in same category for "also consider"
  const otherTools = await prisma.aITool.findMany({
    where: { published: true, id: { notIn: [...altIds, ...extras.map((e) => e.id)] } },
    orderBy: { viewCount: "desc" },
    take: 4,
    select: { id: true, slug: true, name: true, tagline: true },
  }).catch(() => []);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(buildBreadcrumbJsonLd(breadcrumbItems)) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }} />

      <main className="min-h-screen" dir="rtl">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-white/5 py-14">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -top-16 left-1/3 h-72 w-72 rounded-full bg-fuchsia-600/8 blur-3xl" />
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-fuchsia-500/30 to-transparent" />
          </div>
          <div className="container mx-auto px-4 relative">
            <Breadcrumbs items={breadcrumbItems} className="mb-6" />

            {/* Main tool card */}
            <div className="mb-8 flex items-start gap-5">
              {mainTool.logoUrl ? (
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                  <Image src={mainTool.logoUrl} alt={mainTool.name} fill className="object-cover" />
                </div>
              ) : (
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-violet-500/15 text-3xl font-black text-violet-400">
                  {mainTool.name[0]}
                </div>
              )}
              <div>
                <div className="mb-1 inline-block rounded-full bg-fuchsia-500/10 border border-fuchsia-500/20 px-3 py-0.5 text-xs font-semibold text-fuchsia-400">
                  بدائل
                </div>
                <h1 className="text-3xl font-black text-white md:text-4xl">
                  أفضل بدائل {mainTool.name} في 2025
                </h1>
                <p className="mt-2 max-w-2xl text-slate-400">
                  هل تبحث عن بديل لـ {mainTool.name}؟ إليك أفضل {allAlternatives.length} أداة مشابهة مع مقارنة المميزات والأسعار لمساعدتك في الاختيار الصحيح.
                </p>
              </div>
            </div>
          </div>
        </section>

        <div className="container mx-auto px-4 py-12">
          <AdSlot position="ai-tools-top" className="mb-10" />

          {allAlternatives.length === 0 ? (
            <div className="py-20 text-center">
              <p className="text-slate-500">لم نجد بدائل مسجّلة بعد</p>
              <Link href="/ai-tools" className="mt-4 inline-block text-violet-400 hover:underline">عرض جميع الأدوات</Link>
            </div>
          ) : (
            <>
              <div className="mb-6 flex items-center gap-3">
                <h2 className="text-xl font-black text-white">أفضل {allAlternatives.length} بديل لـ {mainTool.name}</h2>
                <div className="h-px flex-1 bg-white/5" />
              </div>

              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {allAlternatives.map((tool, i) => (
                  <Link
                    key={tool.id}
                    href={`/ai-tools/${tool.slug}`}
                    className="group relative flex flex-col rounded-2xl border border-white/6 bg-white/3 p-6 hover:border-violet-500/30 hover:bg-violet-500/5 transition"
                  >
                    <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-fuchsia-500/80 text-[11px] font-black text-white">
                      {i + 1}
                    </span>
                    <div className="mb-4 flex items-center gap-3">
                      {tool.logoUrl ? (
                        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-white/10">
                          <Image src={tool.logoUrl} alt={tool.name} fill className="object-cover" />
                        </div>
                      ) : (
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/15 text-lg font-black text-violet-400">
                          {tool.name[0]}
                        </div>
                      )}
                      <div className="min-w-0">
                        <h3 className="font-bold text-slate-100 group-hover:text-violet-300 transition-colors">{tool.name}</h3>
                        {tool.tagline && <p className="text-xs text-slate-500 line-clamp-1">{tool.tagline}</p>}
                      </div>
                    </div>
                    <p className="mb-4 flex-1 text-sm text-slate-400 line-clamp-3">{tool.descriptionAr}</p>
                    {tool.pros.length > 0 && (
                      <ul className="mb-4 space-y-1">
                        {tool.pros.slice(0, 2).map((p, pi) => (
                          <li key={pi} className="flex items-center gap-1.5 text-xs text-emerald-400">
                            <span>✓</span><span className="line-clamp-1">{p}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                    <div className="flex items-center justify-between border-t border-white/5 pt-4">
                      <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${PRICING_BADGE[tool.pricing] ?? PRICING_BADGE.freemium}`}>
                        {PRICING_LABEL[tool.pricing] ?? "—"}
                      </span>
                      <span className="text-xs font-semibold text-violet-400 group-hover:text-violet-300">مراجعة مفصلة ←</span>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}

          {/* Comparisons */}
          {comparisons.length > 0 && (
            <section className="mt-14">
              <div className="mb-5 flex items-center gap-3">
                <h2 className="text-lg font-black text-white">مقارنات {mainTool.name} مع غيره</h2>
                <div className="h-px flex-1 bg-white/5" />
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {comparisons.map((side) => (
                  <Link
                    key={side.id}
                    href={`/compare/${side.comparison.slug}`}
                    className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 hover:bg-amber-500/10 transition"
                  >
                    <p className="font-semibold text-amber-300 text-sm">{side.comparison.title}</p>
                    <p className="mt-1 text-xs text-slate-500">عرض المقارنة التفصيلية ←</p>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Back to tool + other tools */}
          <div className="mt-14 flex flex-wrap gap-4 border-t border-white/8 pt-8">
            <Link
              href={`/ai-tools/${mainTool.slug}`}
              className="rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-semibold text-slate-300 hover:bg-white/8 transition"
            >
              مراجعة {mainTool.name} الكاملة
            </Link>
            <Link
              href="/ai-tools"
              className="rounded-xl border border-violet-500/30 bg-violet-500/10 px-5 py-2.5 text-sm font-semibold text-violet-400 hover:bg-violet-500/20 transition"
            >
              جميع أدوات AI ←
            </Link>
          </div>

          {otherTools.length > 0 && (
            <section className="mt-10">
              <p className="mb-4 text-sm font-semibold text-slate-500">قد يعجبك أيضاً:</p>
              <div className="flex flex-wrap gap-3">
                {otherTools.map((t) => (
                  <Link
                    key={t.id}
                    href={`/alternatives/${t.slug}`}
                    className="rounded-full border border-white/8 bg-white/3 px-4 py-2 text-sm text-slate-400 hover:border-fuchsia-500/30 hover:text-fuchsia-300 transition"
                  >
                    بدائل {t.name}
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
    </>
  );
}
