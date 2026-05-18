import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";

export const revalidate = 3600;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const cat = await prisma.promptCategory.findUnique({ where: { slug } });
  if (!cat) return {};
  return {
    title: `${cat.nameAr} Prompts | AI Scope`,
    description: `مكتبة prompts تصنيف ${cat.nameAr} — مترجمة ومكيّفة للعربية`,
  };
}

export default async function CategoryPromptsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const category = await prisma.promptCategory.findUnique({ where: { slug } });
  if (!category) notFound();

  const prompts = await prisma.prompt.findMany({
    where: { published: true, categoryId: category.id },
    include: { aiModel: true },
    orderBy: [{ featured: "desc" }, { copyCount: "desc" }],
    take: 50,
  });

  return (
    <main className="min-h-screen" dir="rtl">
      <section className="border-b border-white/5 py-12">
        <div className="container mx-auto px-4">
          <nav className="mb-4 text-sm text-slate-500">
            <Link href="/tools" className="hover:text-violet-400">مكتبة Prompts</Link>
            <span className="mx-2">/</span>
            <span className="text-slate-300">{category.nameAr}</span>
          </nav>
          <div className="flex items-center gap-4">
            <span className="text-5xl">{category.icon}</span>
            <div>
              <h1 className="text-3xl font-black text-white">Prompts {category.nameAr}</h1>
              <p className="mt-1 text-slate-400">{prompts.length} prompt جاهز</p>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-10">
        {prompts.length === 0 ? (
          <div className="py-20 text-center text-slate-500">لا توجد prompts في هذا التصنيف بعد — جاري الإضافة تلقائياً</div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {prompts.map((prompt) => (
              <Link
                key={prompt.id}
                href={`/tools/${prompt.slug}`}
                className="group flex flex-col rounded-2xl border border-white/5 bg-white/3 p-6 transition hover:border-violet-500/40 hover:bg-violet-500/5"
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs text-slate-500">{prompt.aiModel.icon} {prompt.aiModel.name}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs ${
                    prompt.difficulty === "beginner" ? "bg-emerald-500/10 text-emerald-400"
                    : prompt.difficulty === "advanced" ? "bg-red-500/10 text-red-400"
                    : "bg-amber-500/10 text-amber-400"
                  }`}>
                    {prompt.difficulty === "beginner" ? "مبتدئ" : prompt.difficulty === "advanced" ? "متقدم" : "متوسط"}
                  </span>
                </div>
                <h3 className="mb-2 font-bold text-slate-100 group-hover:text-violet-300 line-clamp-2">{prompt.titleAr}</h3>
                <p className="mb-4 flex-1 text-sm text-slate-400 line-clamp-2">{prompt.descriptionAr}</p>
                <div className="flex gap-4 text-xs text-slate-500">
                  <span>📋 {prompt.copyCount}</span>
                  <span>👁️ {prompt.viewCount}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
