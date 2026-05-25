import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { absoluteUrl, SITE_NAME_AR } from "@/lib/seo";

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
          include: {
            tool: {
              select: {
                id: true,
                name: true,
                slug: true,
                tagline: true,
                logoUrl: true,
              },
            },
          },
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
      <section className="mb-10 rounded-3xl border border-white/8 bg-white/3 p-6 md:p-8">
        <p className="mb-3 text-sm font-semibold text-violet-300">اختر بوضوح</p>
        <h1 className="mb-3 text-3xl font-black text-white md:text-5xl">مقارنات الأدوات</h1>
        <p className="max-w-3xl text-sm leading-relaxed text-slate-400 md:text-base">
          صفحات مقارنة سريعة ومباشرة بين أدوات AI المتشابهة: الفروقات، نقاط القوة، وحالات الاستخدام المناسبة لكل خيار.
        </p>
      </section>

      {comparisons.length === 0 ? (
        <section className="rounded-2xl border border-white/8 bg-white/3 p-8 text-center">
          <h2 className="mb-2 text-xl font-bold text-white">لا توجد مقارنات منشورة بعد</h2>
          <p className="text-slate-500">بمجرد نشر أول مقارنة ستظهر هنا تلقائيًا.</p>
        </section>
      ) : (
        <section className="grid gap-5 lg:grid-cols-2">
          {comparisons.map((comparison) => (
            <Link
              key={comparison.id}
              href={`/compare/${comparison.slug}`}
              className="rounded-2xl border border-white/8 bg-white/3 p-5 transition hover:border-violet-500/30 hover:bg-violet-500/5"
            >
              <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span>{comparison.sides.length} أدوات</span>
                <span>•</span>
                <span>{new Date(comparison.updatedAt).toLocaleDateString("en-CA")}</span>
              </div>
              <h2 className="mb-3 text-xl font-black text-white">{comparison.title}</h2>
              <p className="mb-4 line-clamp-3 text-sm leading-relaxed text-slate-400">{comparison.summaryAr}</p>
              <div className="flex flex-wrap gap-2">
                {comparison.sides.map((side) => (
                  <span
                    key={side.id}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300"
                  >
                    {side.tool.name}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </section>
      )}
    </main>
  );
}
