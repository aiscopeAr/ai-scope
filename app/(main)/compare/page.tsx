import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { absoluteUrl, SITE_NAME_AR } from "@/lib/seo";
import { ArrowLeft, Zap } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `مقارنات أدوات الذكاء الاصطناعي | ${SITE_NAME_AR}`,
  description: "مقارنات عربية بين أدوات الذكاء الاصطناعي لمساعدتك على اختيار الأداة الأنسب.",
  alternates: { canonical: absoluteUrl("/compare") },
  openGraph: {
    title: `مقارنات أدوات الذكاء الاصطناعي | ${SITE_NAME_AR}`,
    description: "مقارنات عربية بين أدوات الذكاء الاصطناعي لمساعدتك على اختيار الأداة الأنسب.",
    url: absoluteUrl("/compare"),
    type: "website",
    locale: "ar_AR",
  },
};

async function getComparisons() {
  try {
    return await prisma.comparison.findMany({
      where: { published: true },
      orderBy: { updatedAt: "desc" },
      include: {
        sides: {
          include: { tool: { select: { id: true, name: true, slug: true, tagline: true, logoUrl: true } } },
        },
      },
      take: 24,
    });
  } catch {
    return [];
  }
}

// ألوان لكل بطاقة بالتناوب
const CARD_ACCENTS = [
  { bg: "#f0f4ff", border: "#c7d7fe", badge: "#4f46e5", badgeBg: "#eef2ff" },
  { bg: "#f0fdf4", border: "#bbf7d0", badge: "#16a34a", badgeBg: "#dcfce7" },
  { bg: "#fdf4ff", border: "#e9d5ff", badge: "#9333ea", badgeBg: "#f5f3ff" },
  { bg: "#fff7ed", border: "#fed7aa", badge: "#ea580c", badgeBg: "#fff7ed" },
];

function ToolAvatar({ name, logoUrl }: { name: string; logoUrl: string | null }) {
  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt={name}
        className="h-9 w-9 rounded-lg object-contain"
        style={{ background: "#f8fafc", border: "1px solid #e2e8f0", padding: "4px" }}
      />
    );
  }
  return (
    <div className="flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold text-white"
      style={{ background: "var(--accent)" }}>
      {name[0]}
    </div>
  );
}

export default async function CompareIndexPage() {
  const comparisons = await getComparisons();

  return (
    <main className="container mx-auto max-w-5xl px-4 py-10" dir="rtl">

      {/* Hero */}
      <section className="mb-12 text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold"
          style={{ background: "var(--accent-bg)", color: "var(--accent)", border: "1px solid var(--accent)" }}>
          <Zap className="h-3.5 w-3.5" />
          اختر بوضوح
        </div>
        <h1 className="mb-4 text-4xl font-bold md:text-6xl"
          style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)", lineHeight: 1.2 }}>
          مقارنات الأدوات
        </h1>
        <p className="mx-auto max-w-2xl text-base leading-relaxed md:text-lg"
          style={{ color: "var(--text-secondary)" }}>
          صفحات مقارنة سريعة ومباشرة بين أدوات AI المتشابهة — الفروقات، نقاط القوة، وحالات الاستخدام المناسبة لكل خيار.
        </p>
      </section>

      {comparisons.length === 0 ? (
        <div className="rounded-2xl border p-12 text-center"
          style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-surface)" }}>
          <p className="text-5xl mb-4">⚖️</p>
          <h2 className="mb-2 text-xl font-bold" style={{ color: "var(--text-primary)" }}>لا توجد مقارنات بعد</h2>
          <p style={{ color: "var(--text-muted)" }}>بمجرد نشر أول مقارنة ستظهر هنا تلقائياً.</p>
        </div>
      ) : (
        <section className="grid gap-6 md:grid-cols-2">
          {comparisons.map((comparison, i) => {
            const accent = CARD_ACCENTS[i % CARD_ACCENTS.length];
            const [sideA, sideB] = comparison.sides;
            const maxScore = Math.max(...comparison.sides.map(s => s.score ?? 0));

            return (
              <Link
                key={comparison.id}
                href={`/compare/${comparison.slug}`}
                className="group block rounded-2xl border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
                style={{
                  borderColor: accent.border,
                  backgroundColor: "var(--bg-surface)",
                  overflow: "hidden",
                }}
              >
                {/* Top color strip */}
                <div className="h-1.5 w-full" style={{ background: accent.badge }} />

                <div className="p-5">
                  {/* Tools avatars row */}
                  <div className="mb-4 flex items-center gap-3">
                    {comparison.sides.map((side, si) => (
                      <div key={side.id} className="flex items-center gap-2">
                        {si > 0 && (
                          <span className="text-xs font-bold px-1.5 py-0.5 rounded"
                            style={{ color: accent.badge, background: accent.badgeBg }}>
                            VS
                          </span>
                        )}
                        <ToolAvatar name={side.tool.name} logoUrl={side.tool.logoUrl} />
                        <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                          {side.tool.name}
                        </span>
                        {side.score && side.score === maxScore && comparison.sides.length > 1 && (
                          <span className="text-xs rounded-full px-2 py-0.5 font-semibold"
                            style={{ background: accent.badgeBg, color: accent.badge }}>
                            الأفضل
                          </span>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Title */}
                  <h2 className="mb-2 text-lg font-bold leading-snug group-hover:opacity-80 transition-opacity"
                    style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
                    {comparison.title}
                  </h2>

                  {/* Summary */}
                  <p className="mb-5 text-sm leading-relaxed line-clamp-2"
                    style={{ color: "var(--text-secondary)" }}>
                    {comparison.summaryAr}
                  </p>

                  {/* Scores bar */}
                  {comparison.sides.some(s => s.score) && (
                    <div className="mb-4 space-y-2">
                      {comparison.sides.map((side) => side.score ? (
                        <div key={side.id} className="flex items-center gap-3">
                          <span className="w-20 shrink-0 text-xs font-medium truncate"
                            style={{ color: "var(--text-muted)" }}>
                            {side.tool.name}
                          </span>
                          <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: accent.border }}>
                            <div className="h-1.5 rounded-full"
                              style={{
                                width: `${side.score}%`,
                                background: accent.badge,
                              }} />
                          </div>
                          <span className="text-xs font-bold" style={{ color: accent.badge }}>
                            {side.score}
                          </span>
                        </div>
                      ) : null)}
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                      {comparison.sides.length} أدوات
                    </span>
                    <span className="flex items-center gap-1 text-xs font-semibold transition-colors"
                      style={{ color: accent.badge }}>
                      قرأ المقارنة
                      <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </section>
      )}
    </main>
  );
}
