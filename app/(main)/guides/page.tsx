import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { absoluteUrl, SITE_NAME_AR, truncate } from "@/lib/seo";
import AdSlot from "@/components/AdSlot";

export const revalidate = 600;

export const metadata: Metadata = {
  title: `دليل الذكاء الاصطناعي للمبتدئين والمحترفين | ${SITE_NAME_AR}`,
  description: "أدلة شاملة وشروحات مفصلة عن الذكاء الاصطناعي — من البداية إلى الاحتراف. تعلم كيف تستخدم ChatGPT وClaude وGemini وأدوات AI الأخرى.",
  alternates: { canonical: absoluteUrl("/guides") },
  openGraph: {
    title: `دليل الذكاء الاصطناعي | ${SITE_NAME_AR}`,
    description: "أدلة شاملة عن الذكاء الاصطناعي بالعربية",
    locale: "ar_AR",
    type: "website",
  },
};

const CATEGORY_LABELS: Record<string, string> = {
  beginner: "مبتدئ",
  intermediate: "متوسط",
  advanced: "متقدم",
  tutorial: "شرح تفصيلي",
  "how-to": "كيف تفعل",
  comparison: "مقارنة",
};

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  intermediate: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  advanced: "bg-red-500/10 text-red-400 border-red-500/30",
};

export default async function GuidesPage() {
  const guides = await prisma.guide.findMany({
    where: { published: true },
    orderBy: [{ publishedAt: "desc" }],
  }).catch(() => []);

  type GuideRow = (typeof guides)[number];
  const byCategory = guides.reduce<Record<string, GuideRow[]>>((acc, g) => {
    (acc[g.category] ??= []).push(g);
    return acc;
  }, {});

  const featuredGuides = guides.slice(0, 3);

  return (
    <main className="min-h-screen" dir="rtl">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-white/5 py-20">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-20 right-1/4 h-96 w-96 rounded-full bg-violet-600/10 blur-3xl animate-blob" />
          <div className="absolute top-10 left-1/3 h-64 w-64 rounded-full bg-sky-600/8 blur-3xl animate-blob" style={{ animationDelay: "3s" }} />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent" />
        </div>
        <div className="container mx-auto px-4 text-center relative animate-fade-up">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-5 py-2">
            <span className="text-violet-400">📚</span>
            <span className="text-sm font-semibold text-violet-300">{guides.length} دليل وشرح</span>
          </div>
          <h1 className="mb-4 text-5xl font-black md:text-6xl">
            أدلة <span className="text-gradient">الذكاء الاصطناعي</span>
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-slate-400">
            شروحات مفصلة وأدلة شاملة عن أدوات AI — مكتوبة بالعربية للمبتدئين والمحترفين
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-14">
        <AdSlot position="guides-top" className="mb-10" />

        {guides.length === 0 ? (
          <div className="py-24 text-center text-slate-400">
            <div className="mb-4 text-5xl">📖</div>
            <p className="text-lg font-semibold">قريباً — جاري إعداد الأدلة</p>
          </div>
        ) : (
          <>
            {/* Featured */}
            {featuredGuides.length > 0 && (
              <section className="mb-16">
                <div className="mb-6 flex items-center gap-3">
                  <h2 className="text-xl font-black text-white">أبرز الأدلة</h2>
                  <div className="h-px flex-1 bg-white/5" />
                </div>
                <div className="grid gap-6 md:grid-cols-3">
                  {featuredGuides.map((guide) => (
                    <Link
                      key={guide.id}
                      href={`/guides/${guide.slug}`}
                      className="group flex flex-col rounded-2xl border border-white/6 bg-white/3 p-6 card-hover hover:border-violet-500/30 transition"
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${DIFFICULTY_COLORS[guide.difficulty] ?? "bg-white/5 text-slate-400 border-white/10"}`}>
                          {CATEGORY_LABELS[guide.difficulty] ?? guide.difficulty}
                        </span>
                        {guide.readingTime && (
                          <span className="text-xs text-slate-500">{guide.readingTime} دقيقة قراءة</span>
                        )}
                      </div>
                      <h3 className="mb-2 font-bold text-slate-100 group-hover:text-violet-300 transition-colors line-clamp-2">
                        {guide.title}
                      </h3>
                      <p className="flex-1 text-sm text-slate-500 line-clamp-3">{truncate(guide.excerpt, 120)}</p>
                      <div className="mt-4 flex flex-wrap gap-1.5 border-t border-white/5 pt-4">
                        {guide.tags.slice(0, 3).map((tag) => (
                          <span key={tag} className="rounded-full bg-white/5 px-2.5 py-0.5 text-xs text-slate-500">{tag}</span>
                        ))}
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* By category */}
            {Object.entries(byCategory).map(([cat, catGuides]) => (
              <section key={cat} className="mb-14">
                <div className="mb-6 flex items-center gap-3">
                  <h2 className="text-xl font-bold text-white">{CATEGORY_LABELS[cat] ?? cat}</h2>
                  <div className="h-px flex-1 bg-white/5" />
                  <span className="text-sm text-slate-500">{catGuides.length} دليل</span>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {catGuides.map((guide) => (
                    <Link
                      key={guide.id}
                      href={`/guides/${guide.slug}`}
                      className="group flex items-start gap-4 rounded-xl border border-white/6 bg-white/3 p-5 hover:border-violet-500/20 hover:bg-violet-500/5 transition"
                    >
                      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 text-sm font-black text-violet-400">
                        {guide.readingTime ?? "?"}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-200 group-hover:text-violet-300 transition-colors line-clamp-2 text-sm">
                          {guide.title}
                        </h3>
                        <p className="mt-1 text-xs text-slate-500 line-clamp-2">{truncate(guide.excerpt, 80)}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            ))}
          </>
        )}
      </div>
    </main>
  );
}
