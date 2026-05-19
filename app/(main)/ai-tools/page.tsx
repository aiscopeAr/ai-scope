import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/db";
import { absoluteUrl, SITE_NAME_AR } from "@/lib/seo";
import AdSlot from "@/components/AdSlot";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `أفضل أدوات الذكاء الاصطناعي 2025 | ${SITE_NAME_AR}`,
  description: "دليل شامل لأفضل أدوات الذكاء الاصطناعي — ChatGPT وClaude وGemini وMidjourney والمزيد. مراجعات بالعربية مع المميزات والعيوب والأسعار.",
  alternates: { canonical: absoluteUrl("/ai-tools") },
  openGraph: {
    title: `أدوات الذكاء الاصطناعي | ${SITE_NAME_AR}`,
    description: "أفضل أدوات AI مع مراجعات ومقارنات بالعربية",
    locale: "ar_AR",
    type: "website",
  },
};

const CATEGORY_MAP: Record<string, { label: string; icon: string }> = {
  chatbot:      { label: "محادثة وكتابة",  icon: "💬" },
  image:        { label: "توليد الصور",    icon: "🎨" },
  video:        { label: "توليد الفيديو",  icon: "🎬" },
  audio:        { label: "الصوت والموسيقى", icon: "🎵" },
  code:         { label: "البرمجة",         icon: "💻" },
  productivity: { label: "الإنتاجية",       icon: "⚡" },
  other:        { label: "أخرى",             icon: "🔧" },
};

const PRICING_MAP: Record<string, { label: string; color: string }> = {
  free:     { label: "مجاني",          color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  freemium: { label: "مجاني + مدفوع", color: "bg-amber-50 text-amber-700 border-amber-200" },
  paid:     { label: "مدفوع",          color: "bg-red-50 text-red-700 border-red-200" },
};

export default async function AIToolsPage() {
  const tools = await prisma.aITool.findMany({
    where: { published: true },
    orderBy: [{ featuredAt: { sort: "desc", nulls: "last" } }, { viewCount: "desc" }],
  }).catch(() => []);

  type ToolRow = (typeof tools)[number];
  const byCategory = tools.reduce<Record<string, ToolRow[]>>((acc, t) => {
    (acc[t.category] ??= []).push(t);
    return acc;
  }, {});

  const categories = Object.keys(CATEGORY_MAP).filter((k) => byCategory[k]?.length);

  return (
    <main className="min-h-screen" dir="rtl">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-white/5 py-20">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-20 left-1/4 h-96 w-96 rounded-full bg-fuchsia-600/10 blur-3xl animate-blob" />
          <div className="absolute top-10 right-1/3 h-64 w-64 rounded-full bg-violet-600/8 blur-3xl animate-blob" style={{ animationDelay: "2s" }} />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-fuchsia-500/40 to-transparent" />
        </div>
        <div className="container mx-auto px-4 text-center relative animate-fade-up">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-fuchsia-500/30 bg-fuchsia-500/10 px-5 py-2">
            <span className="h-1.5 w-1.5 rounded-full bg-fuchsia-400 animate-pulse" />
            <span className="text-sm font-semibold text-fuchsia-300">{tools.length} أداة ذكاء اصطناعي</span>
          </div>
          <h1 className="mb-4 text-5xl font-black md:text-6xl">
            أدوات <span className="text-gradient">الذكاء الاصطناعي</span>
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-slate-400">
            دليل شامل لأفضل أدوات AI مع مراجعات مفصلة بالعربية — الأسعار والمميزات والعيوب
          </p>
        </div>
      </section>

      {/* Category nav */}
      {categories.length > 0 && (
        <div className="sticky top-0 z-10 border-b border-white/5 bg-[#0a0a0f]/90 backdrop-blur-sm">
          <div className="container mx-auto flex gap-1 overflow-x-auto px-4 py-3 scrollbar-none">
            {categories.map((cat) => {
              const meta = CATEGORY_MAP[cat];
              return (
                <a
                  key={cat}
                  href={`#${cat}`}
                  className="flex shrink-0 items-center gap-1.5 rounded-full border border-white/8 bg-white/4 px-4 py-1.5 text-sm text-slate-400 transition hover:border-violet-500/40 hover:text-white"
                >
                  <span>{meta.icon}</span>
                  <span>{meta.label}</span>
                </a>
              );
            })}
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-14">
        <AdSlot position="ai-tools-top" className="mb-10" />

        {tools.length === 0 ? (
          <div className="py-24 text-center text-slate-400">
            <div className="mb-4 text-5xl">🔧</div>
            <p className="text-lg font-semibold">قريباً — جاري إضافة مراجعات الأدوات</p>
          </div>
        ) : (
          categories.map((cat) => {
            const meta = CATEGORY_MAP[cat];
            const catTools = byCategory[cat] ?? [];
            return (
              <section key={cat} id={cat} className="mb-16 scroll-mt-20">
                <div className="mb-6 flex items-center gap-3">
                  <span className="text-2xl">{meta.icon}</span>
                  <h2 className="text-xl font-black text-white">{meta.label}</h2>
                  <div className="h-px flex-1 bg-white/5" />
                  <span className="text-sm text-slate-500">{catTools.length} أداة</span>
                </div>
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {catTools.map((tool) => {
                    const pricing = PRICING_MAP[tool.pricing] ?? PRICING_MAP.freemium;
                    return (
                      <Link
                        key={tool.id}
                        href={`/ai-tools/${tool.slug}`}
                        className="group flex flex-col rounded-2xl border border-white/6 bg-white/3 p-6 card-hover hover:border-violet-500/30 transition"
                      >
                        <div className="mb-4 flex items-center gap-3">
                          {tool.logoUrl ? (
                            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl">
                              <Image src={tool.logoUrl} alt={tool.name} fill className="object-cover" />
                            </div>
                          ) : (
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 text-lg font-black text-violet-400">
                              {tool.name[0]}
                            </div>
                          )}
                          <div>
                            <h3 className="font-bold text-slate-100 group-hover:text-violet-300 transition-colors">
                              {tool.name}
                            </h3>
                            {tool.tagline && (
                              <p className="text-xs text-slate-500 line-clamp-1">{tool.tagline}</p>
                            )}
                          </div>
                        </div>
                        <p className="mb-4 flex-1 text-sm text-slate-400 line-clamp-3">{tool.descriptionAr}</p>
                        <div className="flex items-center justify-between border-t border-white/5 pt-4">
                          <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${pricing.color}`}>
                            {pricing.label}
                          </span>
                          <span className="text-xs text-slate-500">👁 {tool.viewCount}</span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </section>
            );
          })
        )}
      </div>
    </main>
  );
}
