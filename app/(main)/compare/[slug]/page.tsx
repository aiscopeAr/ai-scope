import type { Metadata } from "next";
import Link from "next/link";
import HoverLink from "@/components/HoverLink";
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
              select: { id: true, slug: true, name: true, tagline: true, pricing: true, monthlyPrice: true, arabicSupport: true, hasApi: true, logoUrl: true },
            },
          },
        },
      },
    });
  } catch { return null; }
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
    openGraph: { title: `${comparison.title} | ${SITE_NAME_AR}`, description, url, type: "article", locale: "ar_AR" },
  };
}

function normalizeCriteria(criteria: unknown): string[] {
  if (Array.isArray(criteria)) return criteria.filter((item): item is string => typeof item === "string");
  if (criteria && typeof criteria === "object") return Object.entries(criteria).map(([key, value]) => `${key}: ${String(value)}`);
  return [];
}

export default async function ComparisonPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const comparison = await getComparison(slug);
  if (!comparison?.published) notFound();

  const criteria = normalizeCriteria(comparison.criteria);

  return (
    <main className="container mx-auto max-w-6xl px-4 py-8" dir="rtl">
      <nav className="mb-6 flex items-center gap-2 text-sm" style={{ color: "var(--text-muted)" }}>
        <Link href="/" className="link-muted transition-colors">الرئيسية</Link>
        <span>/</span>
        <Link href="/compare" className="link-muted transition-colors">المقارنات</Link>
        <span>/</span>
        <span className="line-clamp-1 font-medium" style={{ color: "var(--text-secondary)" }}>{comparison.title}</span>
      </nav>

      <section className="mb-10 rounded-[6px] border p-6 md:p-8" style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-surface)" }}>
        <p className="mb-3 text-sm font-semibold" style={{ color: "var(--accent)" }}>مقارنة تحريرية</p>
        <h1 className="mb-3 text-3xl font-bold md:text-5xl" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>{comparison.title}</h1>
        <p className="max-w-3xl text-sm leading-relaxed md:text-base" style={{ color: "var(--text-secondary)" }}>{comparison.summaryAr}</p>
      </section>

      {criteria.length > 0 && (
        <section className="mb-10 rounded-[6px] border p-5" style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-surface)" }}>
          <h2 className="mb-4 text-lg font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>معايير المقارنة</h2>
          <div className="flex flex-wrap gap-2">
            {criteria.map((criterion) => (
              <span key={criterion} className="rounded-[3px] border px-3 py-1 text-sm"
                style={{ borderColor: "var(--border-medium)", color: "var(--text-secondary)", backgroundColor: "var(--bg-subtle)" }}>
                {criterion}
              </span>
            ))}
          </div>
        </section>
      )}

      <section className="grid gap-5 lg:grid-cols-2">
        {comparison.sides.map((side) => (
          <article key={side.id} className="rounded-[6px] border p-5" style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-surface)" }}>
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <Link href={`/ai-tools/${side.tool.slug}`} className="text-xl font-bold transition hover:opacity-75" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
                  {side.tool.name}
                </Link>
                {side.tool.tagline && <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>{side.tool.tagline}</p>}
              </div>
              {typeof side.score === "number" && (
                <span className="rounded-[3px] border px-3 py-1 text-sm font-bold"
                  style={{ borderColor: "var(--accent)", backgroundColor: "var(--accent-bg)", color: "var(--accent)" }}>
                  {side.score}/10
                </span>
              )}
            </div>

            <dl className="mb-4 grid gap-3 text-sm sm:grid-cols-2">
              <div className="rounded-[6px] border p-3" style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-subtle)" }}>
                <dt className="mb-1" style={{ color: "var(--text-muted)" }}>التسعير</dt>
                <dd className="font-semibold" style={{ color: "var(--text-primary)" }}>
                  {side.tool.pricing}
                  {side.tool.monthlyPrice ? ` • $${side.tool.monthlyPrice}/mo` : ""}
                </dd>
              </div>
              <div className="rounded-[6px] border p-3" style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-subtle)" }}>
                <dt className="mb-1" style={{ color: "var(--text-muted)" }}>دعم العربية / API</dt>
                <dd className="font-semibold" style={{ color: "var(--text-primary)" }}>
                  {side.tool.arabicSupport ? "عربية ✓" : "بدون عربية"} • {side.tool.hasApi ? "API ✓" : "بدون API"}
                </dd>
              </div>
            </dl>

            {side.notes && (
              <div className="mb-4 rounded-[6px] border p-4" style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-subtle)" }}>
                <h3 className="mb-2 text-sm font-bold" style={{ color: "var(--text-primary)" }}>ملاحظة سريعة</h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{side.notes}</p>
              </div>
            )}

            {side.bestFor && (
              <p className="mb-4 text-sm" style={{ color: "var(--text-secondary)" }}>
                <span className="font-semibold" style={{ color: "var(--text-primary)" }}>الأفضل لـ:</span> {side.bestFor}
              </p>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[6px] border p-4" style={{ borderColor: "#bbf7d0", backgroundColor: "#f0fdf4" }}>
                <h3 className="mb-3 text-sm font-bold" style={{ color: "#16a34a" }}>نقاط القوة</h3>
                <ul className="space-y-2 text-sm" style={{ color: "#15803d" }}>
                  {side.strengths.map((item) => <li key={item}>• {item}</li>)}
                </ul>
              </div>
              <div className="rounded-[6px] border p-4" style={{ borderColor: "#fecdd3", backgroundColor: "#fff1f2" }}>
                <h3 className="mb-3 text-sm font-bold" style={{ color: "#be123c" }}>نقاط الضعف</h3>
                <ul className="space-y-2 text-sm" style={{ color: "#9f1239" }}>
                  {side.weaknesses.map((item) => <li key={item}>• {item}</li>)}
                </ul>
              </div>
            </div>
          </article>
        ))}
      </section>

      {comparison.verdict && (
        <section className="mt-10 rounded-[6px] border p-6" style={{ borderColor: "var(--accent)", backgroundColor: "var(--accent-bg)" }}>
          <h2 className="mb-3 text-xl font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>الخلاصة</h2>
          <p className="leading-relaxed" style={{ color: "var(--text-secondary)" }}>{comparison.verdict}</p>
        </section>
      )}
    </main>
  );
}
