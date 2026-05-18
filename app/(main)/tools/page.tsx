import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { absoluteUrl } from "@/lib/seo";

export const revalidate = 3600;

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
      <section className="border-b border-white/5 bg-gradient-to-b from-violet-950/30 to-transparent py-16">
        <div className="container mx-auto px-4 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-1.5 text-sm text-violet-300">
            <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />
            {totalCount} prompt جاهز للاستخدام
          </div>
          <h1 className="mb-4 text-4xl font-black text-white md:text-5xl">
            مكتبة <span className="text-gradient">Prompts</span>
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-slate-400">
            prompts جاهزة ومترجمة للعربية لأفضل نماذج الذكاء الاصطناعي — ChatGPT، Claude، Gemini والمزيد
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12">
        {/* Categories */}
        <section className="mb-14">
          <h2 className="mb-6 text-xl font-black text-white">التصنيفات</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/tools/category/${cat.slug}`}
                className="group flex flex-col items-center gap-2 rounded-2xl border border-white/5 bg-white/3 p-5 text-center transition hover:border-violet-500/40 hover:bg-violet-500/10"
              >
                <span className="text-3xl">{cat.icon}</span>
                <span className="font-bold text-slate-200 group-hover:text-violet-300">{cat.nameAr}</span>
                <span className="text-xs text-slate-500">{cat._count.prompts} prompt</span>
              </Link>
            ))}
          </div>
        </section>

        {/* AI Models */}
        <section className="mb-14">
          <h2 className="mb-6 text-xl font-black text-white">النماذج المدعومة</h2>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/tools"
              className="rounded-full border border-white/10 bg-white/5 px-5 py-2 text-sm font-medium text-slate-300 transition hover:border-violet-500/50 hover:text-white"
            >
              الكل
            </Link>
            {models.map((model) => (
              <Link
                key={model.id}
                href={`/tools?model=${model.slug}`}
                className="rounded-full border border-white/10 bg-white/5 px-5 py-2 text-sm font-medium text-slate-300 transition hover:border-violet-500/50 hover:text-white"
              >
                {model.icon} {model.name}
                <span className="ml-2 text-xs text-slate-500">({model._count.prompts})</span>
              </Link>
            ))}
          </div>
        </section>

        {/* Featured Prompts */}
        {featured.length > 0 && (
          <section>
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-black text-white">
                {totalCount === 0 ? "قريباً — جاري إضافة المحتوى" : "أبرز الـ Prompts"}
              </h2>
              {totalCount > 6 && (
                <Link href="/tools/all" className="text-sm font-semibold text-violet-400 hover:text-violet-300">
                  عرض الكل ←
                </Link>
              )}
            </div>
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {featured.map((prompt) => (
                <Link
                  key={prompt.id}
                  href={`/tools/${prompt.slug}`}
                  className="group flex flex-col rounded-2xl border border-white/5 bg-white/3 p-6 transition hover:border-violet-500/40 hover:bg-violet-500/5"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-2xl">{prompt.category.icon}</span>
                    <span className="text-xs text-slate-500">{prompt.aiModel.icon} {prompt.aiModel.name}</span>
                  </div>
                  <h3 className="mb-2 font-bold text-slate-100 group-hover:text-violet-300 line-clamp-2">
                    {prompt.titleAr}
                  </h3>
                  <p className="mb-4 flex-1 text-sm text-slate-400 line-clamp-2">{prompt.descriptionAr}</p>
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span>📋 {prompt.copyCount} نسخة</span>
                    <span>👁️ {prompt.viewCount}</span>
                    <span className="mr-auto rounded-full border border-white/10 px-2 py-0.5">
                      {prompt.difficulty === "beginner" ? "مبتدئ" : prompt.difficulty === "advanced" ? "متقدم" : "متوسط"}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {totalCount === 0 && (
          <div className="py-20 text-center text-slate-500">
            <div className="mb-4 text-6xl">🚀</div>
            <p className="text-lg font-semibold text-slate-300">جاري إضافة المحتوى تلقائياً</p>
            <p className="mt-2">يتم جلب ومعالجة الـ prompts كل 6 ساعات</p>
          </div>
        )}
      </div>
    </main>
  );
}
