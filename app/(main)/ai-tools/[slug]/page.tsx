import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
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
  const tool = await prisma.aITool.findUnique({ where: { slug } }).catch(() => null);
  if (!tool || !tool.published) return {};

  const url = absoluteUrl(`/ai-tools/${slug}`);
  const description = truncate(tool.descriptionAr, 160);

  return {
    title: `${tool.name} — مراجعة وشرح بالعربية | ${SITE_NAME_AR}`,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      url,
      title: `${tool.name} | ${SITE_NAME}`,
      description,
      locale: "ar_AR",
      siteName: SITE_NAME,
      ...(tool.logoUrl ? { images: [{ url: tool.logoUrl, alt: tool.name }] } : {}),
    },
  };
}

const PRICING_LABELS: Record<string, string> = {
  free: "مجاني تماماً",
  freemium: "مجاني مع خطط مدفوعة",
  paid: "مدفوع",
};

export default async function AIToolPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tool = await prisma.aITool.findUnique({
    where: { slug },
    include: {
      comparisons: {
        include: { comparison: true },
        take: 3,
      },
    },
  }).catch(() => null);

  if (!tool || !tool.published) notFound();

  // Increment view count (fire and forget)
  void prisma.aITool.update({ where: { id: tool.id }, data: { viewCount: { increment: 1 } } }).catch(() => {});

  const toolUrl = absoluteUrl(`/ai-tools/${slug}`);
  const breadcrumbItems = [
    { name: "الرئيسية", href: "/" },
    { name: "أدوات AI", href: "/ai-tools" },
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
    inLanguage: "ar",
    offers: {
      "@type": "Offer",
      price: tool.pricing === "free" ? "0" : undefined,
      priceCurrency: "USD",
    },
    publisher: {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: SITE_NAME,
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(buildBreadcrumbJsonLd(breadcrumbItems)) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareJsonLd) }} />

      <main className="container mx-auto max-w-4xl px-4 py-8" dir="rtl">
        <Breadcrumbs items={breadcrumbItems} className="mb-6" />

        <AdSlot position="tool-top" className="mb-6" />

        {/* Header */}
        <div className="mb-8 flex items-start gap-5">
          {tool.logoUrl ? (
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-white/5">
              <Image src={tool.logoUrl} alt={tool.name} fill className="object-cover" />
            </div>
          ) : (
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-violet-500/15 text-2xl font-black text-violet-400">
              {tool.name[0]}
            </div>
          )}
          <div>
            <h1 className="text-3xl font-black text-white md:text-4xl">{tool.name}</h1>
            {tool.tagline && <p className="mt-1 text-lg text-slate-400">{tool.tagline}</p>}
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-violet-500/15 border border-violet-500/30 px-3 py-1 text-sm font-semibold text-violet-400">
                {PRICING_LABELS[tool.pricing] ?? tool.pricing}
              </span>
              {tool.website && (
                <a
                  href={tool.website}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-slate-400 hover:border-violet-500/40 hover:text-violet-300 transition"
                >
                  زيارة الموقع ↗
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="mb-8 text-lg leading-relaxed text-slate-300 whitespace-pre-wrap">
          {tool.descriptionAr}
        </div>

        {/* Pros & Cons */}
        {(tool.pros.length > 0 || tool.cons.length > 0) && (
          <div className="mb-8 grid gap-4 md:grid-cols-2">
            {tool.pros.length > 0 && (
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/8 p-5">
                <h2 className="mb-3 font-bold text-emerald-400">المميزات</h2>
                <ul className="space-y-2">
                  {tool.pros.map((p, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-emerald-300">
                      <span className="mt-0.5 text-emerald-500">✓</span>
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {tool.cons.length > 0 && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/8 p-5">
                <h2 className="mb-3 font-bold text-red-400">العيوب</h2>
                <ul className="space-y-2">
                  {tool.cons.map((c, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-red-300">
                      <span className="mt-0.5 text-red-500">✗</span>
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
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

        <AdSlot position="tool-mid" className="mb-8" />

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

        {/* Back + alternatives */}
        <div className="border-t border-white/8 pt-6 flex flex-wrap items-center gap-4">
          <Link href="/ai-tools" className="text-sm text-violet-400 hover:text-violet-300 transition-colors">← جميع أدوات الذكاء الاصطناعي</Link>
          <Link href={`/alternatives/${tool.slug}`} className="text-sm text-slate-500 hover:text-slate-300 transition-colors">بدائل {tool.name}</Link>
        </div>
      </main>
    </>
  );
}
