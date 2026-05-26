import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { absoluteUrl, SITE_NAME_AR } from "@/lib/seo";
import HoverLink from "@/components/HoverLink";

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

export default async function CompareIndexPage() {
  const comparisons = await getComparisons();

  return (
    <main className="container mx-auto max-w-6xl px-4 py-8" dir="rtl">
      <section className="mb-10 rounded-[6px] border p-6 md:p-8" style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-surface)" }}>
        <p className="mb-3 text-sm font-semibold" style={{ color: "var(--accent)" }}>اختر بوضوح</p>
        <h1 className="mb-3 text-3xl font-bold md:text-5xl" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>مقارنات الأدوات</h1>
        <p className="max-w-3xl text-sm leading-relaxed md:text-base" style={{ color: "var(--text-secondary)" }}>
          صفحات مقارنة سريعة ومباشرة بين أدوات AI المتشابهة: الفروقات، نقاط القوة، وحالات الاستخدام المناسبة لكل خيار.
        </p>
      </section>

      {comparisons.length === 0 ? (
        <section className="rounded-[6px] border p-8 text-center" style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-surface)" }}>
          <h2 className="mb-2 text-xl font-bold" style={{ color: "var(--text-primary)" }}>لا توجد مقارنات منشورة بعد</h2>
          <p style={{ color: "var(--text-muted)" }}>بمجرد نشر أول مقارنة ستظهر هنا تلقائيًا.</p>
        </section>
      ) : (
        <section className="grid gap-5 lg:grid-cols-2">
          {comparisons.map((comparison) => (
            <HoverLink
              key={comparison.id}
              href={`/compare/${comparison.slug}`}
              className="rounded-[6px] border p-5 transition"
              baseStyle={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-surface)" }}
              hoverStyle={{ borderColor: "var(--border-medium)" }}
            >
              <div className="mb-4 flex flex-wrap items-center gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
                <span>{comparison.sides.length} أدوات</span>
                <span>•</span>
                <span>{new Date(comparison.updatedAt).toLocaleDateString("en-CA")}</span>
              </div>
              <h2 className="mb-3 text-xl font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>{comparison.title}</h2>
              <p className="mb-4 line-clamp-3 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{comparison.summaryAr}</p>
              <div className="flex flex-wrap gap-2">
                {comparison.sides.map((side) => (
                  <span key={side.id} className="rounded-[3px] border px-3 py-1 text-xs"
                    style={{ borderColor: "var(--border-medium)", color: "var(--text-secondary)", backgroundColor: "var(--bg-subtle)" }}>
                    {side.tool.name}
                  </span>
                ))}
              </div>
            </HoverLink>
          ))}
        </section>
      )}
    </main>
  );
}
