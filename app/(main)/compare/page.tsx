import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { absoluteUrl, SITE_NAME_AR, truncate } from "@/lib/seo";
import AdSlot from "@/components/AdSlot";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `مقارنة أدوات الذكاء الاصطناعي | ${SITE_NAME_AR}`,
  description: "مقارنات مفصلة بين أفضل أدوات الذكاء الاصطناعي — ChatGPT مقابل Claude، Midjourney مقابل DALL-E، وأكثر. اختر الأداة المناسبة لك.",
  alternates: { canonical: absoluteUrl("/compare") },
  openGraph: {
    title: `مقارنة أدوات AI | ${SITE_NAME_AR}`,
    description: "مقارنات مفصلة بين أدوات الذكاء الاصطناعي بالعربية",
    locale: "ar_AR",
    type: "website",
  },
};

export default async function ComparePage() {
  const comparisons = await prisma.comparison.findMany({
    where: { published: true },
    include: {
      sides: {
        include: { tool: true },
      },
    },
    orderBy: { viewCount: "desc" },
  }).catch(() => []);

  return (
    <main className="min-h-screen" dir="rtl">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-white/5 py-20">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-20 left-1/3 h-80 w-80 rounded-full bg-amber-600/10 blur-3xl animate-blob" />
          <div className="absolute top-10 right-1/4 h-64 w-64 rounded-full bg-orange-600/8 blur-3xl animate-blob" style={{ animationDelay: "3s" }} />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />
        </div>
        <div className="container mx-auto px-4 text-center relative animate-fade-up">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-5 py-2">
            <span className="text-amber-400">⚖️</span>
            <span className="text-sm font-semibold text-amber-300">{comparisons.length} مقارنة مفصلة</span>
          </div>
          <h1 className="mb-4 text-5xl font-black md:text-6xl">
            مقارنة <span className="text-gradient">أدوات AI</span>
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-slate-400">
            مقارنات موضوعية ومفصلة بين أفضل أدوات الذكاء الاصطناعي — اختر الأفضل لاحتياجاتك
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-14">
        <AdSlot position="compare-top" className="mb-10" />

        {comparisons.length === 0 ? (
          <div className="py-24 text-center text-slate-400">
            <div className="mb-4 text-5xl">⚖️</div>
            <p className="text-lg font-semibold">قريباً — جاري إعداد المقارنات</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {comparisons.map((comp) => {
              const toolA = comp.sides[0]?.tool;
              const toolB = comp.sides[1]?.tool;
              const scoreA = comp.sides[0]?.score;
              const scoreB = comp.sides[1]?.score;
              return (
                <Link
                  key={comp.id}
                  href={`/compare/${comp.slug}`}
                  className="group flex flex-col rounded-2xl border border-white/6 bg-white/3 p-6 card-hover hover:border-amber-500/30 transition"
                >
                  {/* VS display */}
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div className="flex flex-1 flex-col items-center gap-1">
                      {toolA ? (
                        <>
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-lg font-black text-slate-300">
                            {toolA.name[0]}
                          </div>
                          <span className="text-xs font-bold text-slate-300">{toolA.name}</span>
                        </>
                      ) : <span className="text-slate-500">؟</span>}
                      {scoreA !== null && scoreA !== undefined && (
                        <span className="text-xs text-amber-400 font-bold">{scoreA}/100</span>
                      )}
                    </div>

                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-amber-500/40 bg-amber-500/10 text-xs font-black text-amber-400">
                      VS
                    </div>

                    <div className="flex flex-1 flex-col items-center gap-1">
                      {toolB ? (
                        <>
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-lg font-black text-slate-300">
                            {toolB.name[0]}
                          </div>
                          <span className="text-xs font-bold text-slate-300">{toolB.name}</span>
                        </>
                      ) : <span className="text-slate-500">؟</span>}
                      {scoreB !== null && scoreB !== undefined && (
                        <span className="text-xs text-amber-400 font-bold">{scoreB}/100</span>
                      )}
                    </div>
                  </div>

                  <h2 className="mb-2 text-center font-bold text-slate-100 group-hover:text-amber-300 transition-colors line-clamp-2">
                    {comp.title}
                  </h2>
                  <p className="flex-1 text-center text-sm text-slate-500 line-clamp-2">
                    {truncate(comp.summaryAr, 100)}
                  </p>
                  <div className="mt-4 border-t border-white/5 pt-4 text-center">
                    <span className="text-xs text-slate-500">👁 {comp.viewCount} مشاهدة</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
