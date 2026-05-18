import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { absoluteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "مكتبة Prompts | AI Scope",
  description: "مكتبة شاملة من prompts جاهزة للاستخدام مع ChatGPT وClaude وGemini — مترجمة ومكيّفة للعربية",
  alternates: { canonical: absoluteUrl("/tools") },
};

export default async function ToolsPage() {
  const [categories, models, featured, totalCount] = await Promise.all([
    prisma.promptCategory.findMany({ include: { _count: { select: { prompts: { where: { published: true } } } } } }),
    prisma.aIModel.findMany({ include: { _count: { select: { prompts: { where: { published: true } } } } } }),
    prisma.prompt.findMany({
      where: { published: true },
      include: { category: true, aiModel: true },
      orderBy: [{ featured: "desc" }, { copyCount: "desc" }],
      take: 6,
    }),
    prisma.prompt.count({ where: { published: true } }),
  ]);

  return (
    <main className="min-h-screen" dir="rtl">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-white/5 py-20">
        {/* Background */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-20 left-1/3 h-80 w-80 rounded-full bg-violet-600/10 blur-3xl animate-blob" />
          <div className="absolute top-10 right-1/3 h-64 w-64 rounded-full bg-fuchsia-600/8 blur-3xl animate-blob" style={{ animationDelay: "4s" }} />
          <div className="absolute inset-0 bg-gradient-to-b from-violet-950/25 via-transparent to-transparent" />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent" />
        </div>

        <div className="container mx-auto px-4 text-center relative animate-fade-up">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-5 py-2 glass">
            <span className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-pulse" />
            <span className="text-sm font-semibold text-violet-300">{totalCount} prompt جاهز للاستخدام</span>
          </div>
          <h1 className="mb-4 text-5xl font-black md:text-6xl">
            مكتبة <span className="text-gradient">Prompts</span>
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-slate-400">
            prompts جاهزة ومترجمة للعربية لأفضل نماذج الذكاء الاصطناعي — ChatGPT، Claude، Gemini والمزيد
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-14">
        {/* Categories */}
        <section className="mb-16">
          <div className="mb-6 flex items-center gap-3">
            <h2 className="text-xl font-black text-white">التصنيفات</h2>
            <div className="h-px flex-1 bg-white/5" />
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/tools/category/${cat.slug}`}
                className="group flex flex-col items-center gap-2.5 rounded-2xl border border-white/6 bg-white/3 p-5 text-center transition hover:border-violet-500/40 hover:bg-violet-500/8 card-hover"
              >
                <span className="text-3xl transition-transform group-hover:scale-110">{cat.icon}</span>
                <span className="font-bold text-slate-300 group-hover:text-violet-300 transition-colors text-sm">{cat.nameAr}</span>
                <span className="rounded-full border border-white/8 bg-white/4 px-2 py-0.5 text-xs text-slate-500">
                  {cat._count.prompts} prompt
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* AI Models */}
        <section className="mb-16">
          <div className="mb-6 flex items-center gap-3">
            <h2 className="text-xl font-black text-white">النماذج المدعومة</h2>
            <div className="h-px flex-1 bg-white/5" />
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/tools"
              className="rounded-full border border-violet-500/40 bg-violet-500/10 px-5 py-2 text-sm font-semibold text-violet-300 transition hover:bg-violet-500/20"
            >
              الكل
            </Link>
            {models.map((model) => (
              <Link
                key={model.id}
                href={`/tools?model=${model.slug}`}
                className="rounded-full border border-white/8 bg-white/4 px-5 py-2 text-sm font-medium text-slate-400 transition hover:border-violet-500/40 hover:bg-violet-500/8 hover:text-white"
              >
                {model.icon} {model.name}
                <span className="ml-2 text-xs text-slate-600">({model._count.prompts})</span>
              </Link>
            ))}
          </div>
        </section>

        {/* Featured Prompts */}
        {featured.length > 0 && (
          <section>
            <div className="mb-8 flex items-center gap-4">
              <h2 className="text-xl font-black text-white">
                {totalCount === 0 ? "قريباً — جاري إضافة المحتوى" : "أبرز الـ Prompts"}
              </h2>
              <div className="h-px flex-1 bg-white/5" />
              {totalCount > 6 && (
                <Link href="/tools/all" className="text-sm font-semibold text-violet-400 hover:text-violet-300 transition-colors">
                  عرض الكل ←
                </Link>
              )}
            </div>
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {featured.map((prompt, i) => (
                <Link
                  key={prompt.id}
                  href={`/tools/${prompt.slug}`}
                  className="group flex flex-col rounded-2xl border border-white/6 bg-white/3 p-6 card-hover transition hover:border-violet-500/30 hover:bg-violet-500/5 animate-fade-up"
                  style={{ animationDelay: `${0.06 * i}s` }}
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-2xl border border-violet-500/20">
                      {prompt.category.icon}
                    </span>
                    <span className="text-xs text-slate-500 rounded-full border border-white/8 bg-white/4 px-2.5 py-1">
                      {prompt.aiModel.icon} {prompt.aiModel.name}
                    </span>
                  </div>
                  <h3 className="mb-2 font-bold text-slate-100 group-hover:text-violet-300 transition-colors line-clamp-2">
                    {prompt.titleAr}
                  </h3>
                  <p className="mb-4 flex-1 text-sm text-slate-500 line-clamp-2">{prompt.descriptionAr}</p>
                  <div className="flex items-center gap-3 text-xs text-slate-600 border-t border-white/5 pt-3 mt-auto">
                    <span className="flex items-center gap-1">📋 <span>{prompt.copyCount}</span></span>
                    <span className="flex items-center gap-1">👁️ <span>{prompt.viewCount}</span></span>
                    <span className="mr-auto rounded-full border border-white/8 bg-white/4 px-2.5 py-0.5 text-slate-500">
                      {prompt.difficulty === "beginner" ? "مبتدئ" : prompt.difficulty === "advanced" ? "متقدم" : "متوسط"}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {totalCount === 0 && (
          <div className="py-24 text-center">
            <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-violet-500/20 bg-violet-500/10 text-5xl">
              🚀
            </div>
            <p className="text-lg font-semibold text-slate-300">جاري إضافة المحتوى تلقائياً</p>
            <p className="mt-2 text-slate-600">يتم جلب ومعالجة الـ prompts كل 6 ساعات</p>
          </div>
        )}
      </div>
    </main>
  );
}
