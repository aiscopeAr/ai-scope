import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { absoluteUrl, SITE_NAME_AR, truncate } from "@/lib/seo";
import AdSlot from "@/components/AdSlot";
import Breadcrumbs, { buildBreadcrumbJsonLd } from "@/components/Breadcrumbs";
import NewsCard from "@/components/NewsCard";

export const dynamic = "force-dynamic";

const TOPICS: Record<string, {
  titleAr: string;
  descriptionAr: string;
  icon: string;
  articleTags: string[];       // tags to match in articles
  toolCategories: string[];    // AI tool categories to show
  guideCategory: string[];     // guide categories
  color: string;
}> = {
  "llm": {
    titleAr: "نماذج اللغة الكبيرة (LLM)",
    descriptionAr: "كل ما تحتاج معرفته عن نماذج اللغة الكبيرة — GPT وClaude وGemini وLlama والتطورات الأخيرة في هذا المجال.",
    icon: "🧠",
    articleTags: ["LLM", "نماذج اللغة", "GPT", "Claude", "Gemini", "Llama"],
    toolCategories: ["chatbot"],
    guideCategory: ["beginner", "intermediate", "advanced"],
    color: "violet",
  },
  "image-generation": {
    titleAr: "توليد الصور بالذكاء الاصطناعي",
    descriptionAr: "أحدث أخبار وأدوات توليد الصور بالذكاء الاصطناعي — Midjourney وDALL-E وStable Diffusion وFlux وما هو قادم.",
    icon: "🎨",
    articleTags: ["توليد الصور", "Midjourney", "DALL-E", "Stable Diffusion", "Flux", "صور AI"],
    toolCategories: ["image"],
    guideCategory: ["tutorial", "how-to"],
    color: "fuchsia",
  },
  "ai-education": {
    titleAr: "الذكاء الاصطناعي في التعليم",
    descriptionAr: "كيف يغيّر الذكاء الاصطناعي قطاع التعليم — أدوات للطلاب والمعلمين والمؤسسات التعليمية.",
    icon: "🎓",
    articleTags: ["ذكاء اصطناعي في التعليم", "AI للطلاب", "تعليم", "المعلمون"],
    toolCategories: ["chatbot", "productivity"],
    guideCategory: ["beginner", "how-to"],
    color: "sky",
  },
  "generative-ai": {
    titleAr: "الذكاء الاصطناعي التوليدي",
    descriptionAr: "الذكاء الاصطناعي التوليدي (Generative AI) — أخبار وتطورات وأدوات في مجال توليد النصوص والصور والفيديو والصوت.",
    icon: "✨",
    articleTags: ["ذكاء اصطناعي توليدي", "Generative AI", "توليد المحتوى"],
    toolCategories: ["chatbot", "image", "video", "audio"],
    guideCategory: ["beginner", "intermediate"],
    color: "amber",
  },
  "ai-coding": {
    titleAr: "البرمجة بالذكاء الاصطناعي",
    descriptionAr: "أدوات وأخبار الذكاء الاصطناعي للمطورين — GitHub Copilot وCursor وCodeWhisperer والمنافسون الجدد.",
    icon: "💻",
    articleTags: ["برمجة", "Copilot", "كود", "مطورون", "AI للمطورين"],
    toolCategories: ["code"],
    guideCategory: ["advanced", "tutorial"],
    color: "emerald",
  },
  "openai": {
    titleAr: "OpenAI وChatGPT",
    descriptionAr: "آخر أخبار وتطورات OpenAI — ChatGPT وGPT-4 وSora وDALL-E وكل ما يصدر عن الشركة الأكثر تأثيراً في عالم الذكاء الاصطناعي.",
    icon: "🤖",
    articleTags: ["OpenAI", "ChatGPT", "GPT-4", "GPT-5", "Sora"],
    toolCategories: ["chatbot", "image"],
    guideCategory: ["beginner", "tutorial"],
    color: "emerald",
  },
  "anthropic": {
    titleAr: "Anthropic وClaude",
    descriptionAr: "آخر أخبار Anthropic ونموذج Claude — التطورات والمقارنات والاستخدامات في مختلف المجالات.",
    icon: "🔮",
    articleTags: ["Anthropic", "Claude", "Claude 3", "Claude Sonnet"],
    toolCategories: ["chatbot"],
    guideCategory: ["beginner", "intermediate"],
    color: "violet",
  },
  "ai-video": {
    titleAr: "توليد الفيديو بالذكاء الاصطناعي",
    descriptionAr: "أحدث أدوات وأخبار توليد الفيديو بالذكاء الاصطناعي — Runway وSora وPika والمزيد.",
    icon: "🎬",
    articleTags: ["توليد الفيديو", "Runway", "Sora", "Pika", "فيديو AI"],
    toolCategories: ["video"],
    guideCategory: ["tutorial", "how-to"],
    color: "rose",
  },
};

const COLOR_MAP: Record<string, { badge: string; border: string; bg: string; text: string }> = {
  violet:  { badge: "bg-violet-500/10 text-violet-400 border-violet-500/20", border: "border-violet-500/30", bg: "bg-violet-500/5", text: "text-violet-400" },
  fuchsia: { badge: "bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/20", border: "border-fuchsia-500/30", bg: "bg-fuchsia-500/5", text: "text-fuchsia-400" },
  sky:     { badge: "bg-sky-500/10 text-sky-400 border-sky-500/20", border: "border-sky-500/30", bg: "bg-sky-500/5", text: "text-sky-400" },
  amber:   { badge: "bg-amber-500/10 text-amber-400 border-amber-500/20", border: "border-amber-500/30", bg: "bg-amber-500/5", text: "text-amber-400" },
  emerald: { badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", border: "border-emerald-500/30", bg: "bg-emerald-500/5", text: "text-emerald-400" },
  rose:    { badge: "bg-rose-500/10 text-rose-400 border-rose-500/20", border: "border-rose-500/30", bg: "bg-rose-500/5", text: "text-rose-400" },
};

export async function generateStaticParams() {
  return Object.keys(TOPICS).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const topic = TOPICS[slug];
  if (!topic) return {};

  const url = absoluteUrl(`/topic/${slug}`);
  return {
    title: `${topic.titleAr} | ${SITE_NAME_AR}`,
    description: topic.descriptionAr,
    alternates: { canonical: url },
    keywords: topic.articleTags.join(", "),
    openGraph: {
      title: topic.titleAr,
      description: topic.descriptionAr,
      url,
      locale: "ar_AR",
      type: "website",
    },
  };
}

export default async function TopicPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const topic = TOPICS[slug];
  if (!topic) notFound();

  const c = COLOR_MAP[topic.color] ?? COLOR_MAP.violet;

  const [articles, tools, guides] = await Promise.all([
    prisma.article.findMany({
      where: {
        published: true,
        OR: [
          { tags: { hasSome: topic.articleTags } },
          { titleAr: { contains: topic.articleTags[0], mode: "insensitive" } },
        ],
      },
      orderBy: { publishedAt: "desc" },
      take: 9,
      include: { category: true },
    }).catch(() => []),

    prisma.aITool.findMany({
      where: { published: true, category: { in: topic.toolCategories } },
      orderBy: [{ featuredAt: { sort: "desc", nulls: "last" } }, { viewCount: "desc" }],
      take: 6,
      select: { id: true, slug: true, name: true, tagline: true, pricing: true, logoUrl: true },
    }).catch(() => []),

    prisma.guide.findMany({
      where: { published: true, category: { in: topic.guideCategory } },
      orderBy: { viewCount: "desc" },
      take: 4,
      select: { id: true, slug: true, title: true, excerpt: true, readingTime: true },
    }).catch(() => []),
  ]);

  const pageUrl = absoluteUrl(`/topic/${slug}`);
  const breadcrumbItems = [
    { name: "الرئيسية", href: "/" },
    { name: "المواضيع", href: "/" },
    { name: topic.titleAr },
  ];

  const otherTopics = Object.entries(TOPICS)
    .filter(([key]) => key !== slug)
    .slice(0, 5);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(buildBreadcrumbJsonLd(breadcrumbItems)) }} />

      <main className="min-h-screen" dir="rtl">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-white/5 py-16">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -top-20 right-1/4 h-80 w-80 rounded-full opacity-10 blur-3xl" style={{ background: "radial-gradient(circle, var(--tw-gradient-stops))" }} />
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          </div>
          <div className="container mx-auto px-4 relative">
            <Breadcrumbs items={breadcrumbItems} className="mb-6" />
            <div className="flex items-start gap-5">
              <span className="text-5xl shrink-0">{topic.icon}</span>
              <div>
                <span className={`mb-3 inline-block rounded-full border px-3 py-0.5 text-xs font-semibold ${c.badge}`}>
                  موضوع
                </span>
                <h1 className="text-3xl font-black text-white md:text-4xl">{topic.titleAr}</h1>
                <p className="mt-3 max-w-2xl text-slate-400">{topic.descriptionAr}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {topic.articleTags.slice(0, 5).map((tag) => (
                    <span key={tag} className={`rounded-full border px-2.5 py-0.5 text-xs ${c.badge}`}>{tag}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="container mx-auto px-4 py-12">
          <AdSlot position="homepage-top" className="mb-10" />

          <div className="grid gap-12 lg:grid-cols-[1fr_320px]">
            {/* Main column */}
            <div>
              {/* Articles */}
              {articles.length > 0 && (
                <section className="mb-12">
                  <div className="mb-6 flex items-center gap-3">
                    <h2 className="text-xl font-black text-white">آخر الأخبار</h2>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${c.badge}`}>{articles.length}</span>
                    <div className="h-px flex-1 bg-white/5" />
                  </div>
                  <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                    {articles.map((article) => (
                      <NewsCard key={article.id} article={article} />
                    ))}
                  </div>
                </section>
              )}

              {articles.length === 0 && (
                <div className="mb-12 rounded-2xl border border-white/6 bg-white/3 py-16 text-center">
                  <p className="text-slate-500">لم نجد أخبار لهذا الموضوع بعد — تابعنا لمتابعة التحديثات</p>
                </div>
              )}

              {/* Guides */}
              {guides.length > 0 && (
                <section className="mb-12">
                  <div className="mb-6 flex items-center gap-3">
                    <h2 className="text-xl font-black text-white">الأدلة والشروحات</h2>
                    <div className="h-px flex-1 bg-white/5" />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {guides.map((guide) => (
                      <Link
                        key={guide.id}
                        href={`/guides/${guide.slug}`}
                        className="group flex items-start gap-4 rounded-xl border border-white/6 bg-white/3 p-5 hover:border-violet-500/20 hover:bg-violet-500/5 transition"
                      >
                        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 text-sm">
                          📖
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-200 group-hover:text-violet-300 transition-colors line-clamp-2 text-sm">
                            {guide.title}
                          </h3>
                          <p className="mt-1 text-xs text-slate-500 line-clamp-2">{truncate(guide.excerpt, 80)}</p>
                          {guide.readingTime && (
                            <p className="mt-1 text-xs text-slate-600">{guide.readingTime} دقيقة قراءة</p>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              )}
            </div>

            {/* Sidebar */}
            <aside className="space-y-6">
              {/* Tools */}
              {tools.length > 0 && (
                <div className="rounded-2xl border border-white/6 bg-white/3 p-5">
                  <h3 className="mb-4 font-black text-white text-sm">أدوات AI ذات صلة</h3>
                  <div className="space-y-3">
                    {tools.map((tool) => (
                      <Link
                        key={tool.id}
                        href={`/ai-tools/${tool.slug}`}
                        className="group flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-white/5 transition"
                      >
                        {tool.logoUrl ? (
                          <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-lg border border-white/10">
                            <img src={tool.logoUrl} alt={tool.name} className="h-full w-full object-cover" />
                          </div>
                        ) : (
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 text-sm font-black text-violet-400">
                            {tool.name[0]}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-300 group-hover:text-violet-300 transition-colors">{tool.name}</p>
                          {tool.tagline && <p className="text-xs text-slate-600 line-clamp-1">{tool.tagline}</p>}
                        </div>
                      </Link>
                    ))}
                  </div>
                  <Link href="/ai-tools" className={`mt-4 block text-center text-xs font-semibold ${c.text} hover:underline`}>
                    عرض جميع الأدوات ←
                  </Link>
                </div>
              )}

              {/* Other topics */}
              <div className="rounded-2xl border border-white/6 bg-white/3 p-5">
                <h3 className="mb-4 font-black text-white text-sm">مواضيع أخرى</h3>
                <div className="space-y-2">
                  {otherTopics.map(([key, t]) => (
                    <Link
                      key={key}
                      href={`/topic/${key}`}
                      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-400 hover:bg-white/5 hover:text-white transition"
                    >
                      <span>{t.icon}</span>
                      <span className="line-clamp-1">{t.titleAr}</span>
                      <span className="mr-auto text-slate-600 text-xs">←</span>
                    </Link>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>
    </>
  );
}
