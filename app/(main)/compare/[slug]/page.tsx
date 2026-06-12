import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { absoluteUrl, SITE_NAME_AR, SITE_URL, SITE_TWITTER_HANDLE, truncate } from "@/lib/seo";
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
              },
            },
          },
        },
      },
    });
  } catch { return null; }
}

async function getOtherComparisons(currentSlug: string) {
  try {
    return await prisma.comparison.findMany({
      where: { published: true, NOT: { slug: currentSlug } },
      orderBy: { updatedAt: "desc" },
      take: 3,
      include: {
        sides: { include: { tool: { select: { name: true, logoUrl: true } } } },
      },
    });
  } catch { return []; }
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

function normalizeCriteria(criteria: unknown): string[] {
  if (Array.isArray(criteria)) return criteria.filter((item): item is string => typeof item === "string");
  if (criteria && typeof criteria === "object") return Object.entries(criteria).map(([k, v]) => `${k}: ${String(v)}`);
  return [];
}

function pricingLabel(pricing: string, monthly: number | null) {
  const map: Record<string, string> = {
    free: "مجاني",
    freemium: "مجاني جزئياً",
    paid: "مدفوع",
    enterprise: "للمؤسسات",
  };
  const label = map[pricing] ?? pricing;
  return monthly ? `${label} · $${monthly}/شهر` : label;
}

function ToolLogo({ name, logoUrl, size = 14 }: { name: string; logoUrl: string | null; size?: number }) {
  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt={name}
        style={{ width: size * 4, height: size * 4, objectFit: "contain", borderRadius: 10, background: "#f8fafc", border: "1px solid #e2e8f0", padding: 6 }}
      />
    );
  }
  return (
    <div style={{
      width: size * 4, height: size * 4, borderRadius: 10,
      background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center",
      color: "#fff", fontWeight: 700, fontSize: size,
    }}>
      {name[0]}
    </div>
  );
}

// ScoreRing — دائرة درجة دائرية (score من 0 إلى 100)
function ScoreRing({ score, winner }: { score: number; winner: boolean }) {
  const pct = score / 100;
  const r = 28;
  const circ = 2 * Math.PI * r;
  const dash = circ * pct;

  return (
    <div className="relative flex items-center justify-center" style={{ width: 72, height: 72 }}>
      <svg width={72} height={72} className="-rotate-90">
        <circle cx={36} cy={36} r={r} fill="none" stroke="#e2e8f0" strokeWidth={5} />
        <circle
          cx={36} cy={36} r={r} fill="none"
          stroke={winner ? "#16a34a" : "var(--accent)"}
          strokeWidth={5}
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 0.6s ease" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center leading-none">
        <span className="text-lg font-black" style={{ color: winner ? "#16a34a" : "var(--accent)" }}>{score}</span>
        <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>/100</span>
      </div>
    </div>
  );
}

export default async function ComparisonPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [comparison, otherComparisons] = await Promise.all([
    getComparison(slug),
    getOtherComparisons(slug),
  ]);
  if (!comparison?.published) notFound();

  const criteria = normalizeCriteria(comparison.criteria);
  const maxScore = Math.max(...comparison.sides.map(s => s.score ?? 0));
  const winner = comparison.sides.find(s => s.score === maxScore && maxScore > 0);

  return (
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
                  <ScoreRing score={side.score} winner={side.score === maxScore} />
                </div>
              )}
              {side.score === maxScore && maxScore > 0 && (
                <Trophy className="h-5 w-5" style={{ color: "#ca8a04" }} />
              )}
            </div>
          </div>
        ))}
      </section>

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

      {/* Side cards */}
      <section className="grid gap-6 lg:grid-cols-2">
        {comparison.sides.map((side) => {
          const isWinner = side.score === maxScore && maxScore > 0;
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

                {/* Best for */}
                {side.bestFor && (
                  <div className="rounded-xl p-4"
                    style={{ background: "var(--accent-bg)", border: "1px solid var(--border-subtle)" }}>
                    <p className="text-xs font-semibold mb-1" style={{ color: "var(--accent)" }}>الأفضل لـ</p>
                    <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{side.bestFor}</p>
                  </div>
                )}

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
  );
}
