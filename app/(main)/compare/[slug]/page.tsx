import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { absoluteUrl, SITE_NAME_AR, truncate } from "@/lib/seo";

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
                id: true,
                slug: true,
                name: true,
                tagline: true,
                pricing: true,
                monthlyPrice: true,
                arabicSupport: true,
                hasApi: true,
                logoUrl: true,
              },
            },
          },
        },
      },
    });
  } catch {
    return null;
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
      description,
      url,
      type: "article",
      locale: "ar_AR",
    },
  };
}

function normalizeCriteria(criteria: unknown): string[] {
  if (Array.isArray(criteria)) {
    return criteria.filter((item): item is string => typeof item === "string");
  }

  if (criteria && typeof criteria === "object") {
    return Object.entries(criteria).map(([key, value]) => `${key}: ${String(value)}`);
  }

  return [];
}

export default async function ComparisonPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const comparison = await getComparison(slug);
  if (!comparison?.published) notFound();

  const criteria = normalizeCriteria(comparison.criteria);

  return (
    <main className="container mx-auto max-w-6xl px-4 py-8" dir="rtl">
      <nav className="mb-6 flex items-center gap-2 text-sm text-slate-500">
        <Link href="/" className="hover:text-violet-400 transition-colors">الرئيسية</Link>
        <span>/</span>
        <Link href="/compare" className="hover:text-violet-400 transition-colors">المقارنات</Link>
        <span>/</span>
        <span className="line-clamp-1 text-slate-300">{comparison.title}</span>
      </nav>

      <section className="mb-10 rounded-3xl border border-white/8 bg-white/3 p-6 md:p-8">
        <p className="mb-3 text-sm font-semibold text-violet-300">مقارنة تحريرية</p>
        <h1 className="mb-3 text-3xl font-black text-white md:text-5xl">{comparison.title}</h1>
        <p className="max-w-3xl text-sm leading-relaxed text-slate-400 md:text-base">{comparison.summaryAr}</p>
      </section>

      {criteria.length > 0 && (
        <section className="mb-10 rounded-2xl border border-white/8 bg-white/3 p-5">
          <h2 className="mb-4 text-lg font-black text-white">معايير المقارنة</h2>
          <div className="flex flex-wrap gap-2">
            {criteria.map((criterion) => (
              <span
                key={criterion}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-slate-300"
              >
                {criterion}
              </span>
            ))}
          </div>
        </section>
      )}

      <section className="grid gap-5 lg:grid-cols-2">
        {comparison.sides.map((side) => (
          <article key={side.id} className="rounded-2xl border border-white/8 bg-white/3 p-5">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <Link href={`/ai-tools/${side.tool.slug}`} className="text-xl font-black text-white hover:text-violet-300 transition-colors">
                  {side.tool.name}
                </Link>
                {side.tool.tagline && <p className="mt-1 text-sm text-slate-500">{side.tool.tagline}</p>}
              </div>
              {typeof side.score === "number" && (
                <span className="rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-sm font-bold text-violet-300">
                  {side.score}/10
                </span>
              )}
            </div>

            <dl className="mb-4 grid gap-3 text-sm sm:grid-cols-2">
              <div className="rounded-xl border border-white/6 bg-white/4 p-3">
                <dt className="mb-1 text-slate-500">التسعير</dt>
                <dd className="font-semibold text-slate-200">
                  {side.tool.pricing}
                  {side.tool.monthlyPrice ? ` • $${side.tool.monthlyPrice}/mo` : ""}
                </dd>
              </div>
              <div className="rounded-xl border border-white/6 bg-white/4 p-3">
                <dt className="mb-1 text-slate-500">دعم العربية / API</dt>
                <dd className="font-semibold text-slate-200">
                  {side.tool.arabicSupport ? "عربية ✓" : "بدون عربية"} • {side.tool.hasApi ? "API ✓" : "بدون API"}
                </dd>
              </div>
            </dl>

            {side.notes && (
              <div className="mb-4 rounded-xl border border-white/6 bg-white/4 p-4">
                <h3 className="mb-2 text-sm font-bold text-white">ملاحظة سريعة</h3>
                <p className="text-sm leading-relaxed text-slate-400">{side.notes}</p>
              </div>
            )}

            {side.bestFor && (
              <p className="mb-4 text-sm text-slate-400">
                <span className="font-semibold text-slate-200">الأفضل لـ:</span> {side.bestFor}
              </p>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                <h3 className="mb-3 text-sm font-bold text-emerald-300">نقاط القوة</h3>
                <ul className="space-y-2 text-sm text-slate-300">
                  {side.strengths.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4">
                <h3 className="mb-3 text-sm font-bold text-rose-300">نقاط الضعف</h3>
                <ul className="space-y-2 text-sm text-slate-300">
                  {side.weaknesses.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </article>
        ))}
      </section>

      {comparison.verdict && (
        <section className="mt-10 rounded-2xl border border-violet-500/20 bg-violet-500/5 p-6">
          <h2 className="mb-3 text-xl font-black text-white">الخلاصة</h2>
          <p className="leading-relaxed text-slate-300">{comparison.verdict}</p>
        </section>
      )}
    </main>
  );
}
