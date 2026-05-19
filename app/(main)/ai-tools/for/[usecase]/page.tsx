import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/db";
import { absoluteUrl, SITE_NAME_AR, SITE_URL, truncate } from "@/lib/seo";
import AdSlot from "@/components/AdSlot";
import Breadcrumbs, { buildBreadcrumbJsonLd } from "@/components/Breadcrumbs";

export const dynamic = "force-dynamic";

// Curated use-case definitions — each maps to a set of tool categories + keywords
const USE_CASES: Record<string, {
  titleAr: string;
  h1: string;
  descriptionAr: string;
  categories: string[];
  keywords: string[];
  icon: string;
}> = {
  students: {
    titleAr: "أفضل أدوات الذكاء الاصطناعي للطلاب",
    h1: "أفضل أدوات AI للطلاب 2025",
    descriptionAr: "اكتشف أفضل أدوات الذكاء الاصطناعي التي تساعد الطلاب على التعلم والبحث وكتابة الأبحاث والتلخيص — مجاناً أو بأسعار منخفضة.",
    categories: ["chatbot", "productivity"],
    keywords: ["ذكاء اصطناعي للطلاب", "أدوات AI للدراسة", "مساعد الدراسة", "كتابة الأبحاث"],
    icon: "🎓",
  },
  developers: {
    titleAr: "أفضل أدوات الذكاء الاصطناعي للمطورين",
    h1: "أفضل أدوات AI للمطورين والبرمجة 2025",
    descriptionAr: "أدوات AI تساعد المطورين على كتابة الكود وإصلاح الأخطاء وتوليد الاختبارات وفهم الكود القديم — وفّر ساعات من وقتك.",
    categories: ["code", "chatbot"],
    keywords: ["AI للمطورين", "مساعد البرمجة", "كود بالذكاء الاصطناعي", "GitHub Copilot بديل"],
    icon: "💻",
  },
  writers: {
    titleAr: "أفضل أدوات الذكاء الاصطناعي للكتّاب",
    h1: "أفضل أدوات AI للكتابة والمحتوى 2025",
    descriptionAr: "أدوات الذكاء الاصطناعي التي تساعد الكتّاب والمدونين وصانعي المحتوى على الكتابة بشكل أسرع وأفضل — بالعربية والإنجليزية.",
    categories: ["chatbot", "productivity"],
    keywords: ["AI للكتابة", "مساعد الكتابة", "كتابة المحتوى بالذكاء الاصطناعي", "ChatGPT للكتابة"],
    icon: "✍️",
  },
  designers: {
    titleAr: "أفضل أدوات الذكاء الاصطناعي للمصممين",
    h1: "أفضل أدوات AI للتصميم وتوليد الصور 2025",
    descriptionAr: "أدوات الذكاء الاصطناعي التي تحوّل أفكارك إلى صور وتصاميم احترافية في ثوانٍ — Midjourney وDALL-E والمزيد.",
    categories: ["image", "video"],
    keywords: ["AI للتصميم", "توليد الصور بالذكاء الاصطناعي", "Midjourney", "أدوات التصميم"],
    icon: "🎨",
  },
  business: {
    titleAr: "أفضل أدوات الذكاء الاصطناعي للأعمال",
    h1: "أفضل أدوات AI للأعمال والشركات 2025",
    descriptionAr: "أدوات AI تزيد إنتاجية فريقك وتؤتمت المهام المتكررة وتساعد على اتخاذ قرارات أفضل — للشركات الناشئة والمؤسسات الكبيرة.",
    categories: ["productivity", "chatbot"],
    keywords: ["AI للأعمال", "ذكاء اصطناعي للشركات", "أتمتة الأعمال", "AI للإنتاجية"],
    icon: "💼",
  },
  content: {
    titleAr: "أفضل أدوات الذكاء الاصطناعي لصانعي المحتوى",
    h1: "أفضل أدوات AI لصانعي المحتوى ويوتيوبرز 2025",
    descriptionAr: "أدوات AI لإنشاء الفيديو والصوت والصور والنصوص — مثالية لليوتيوبرز والمدونين ومديري السوشيال ميديا.",
    categories: ["video", "audio", "image", "chatbot"],
    keywords: ["AI لصانعي المحتوى", "يوتيوب بالذكاء الاصطناعي", "توليد الفيديو", "AI للسوشيال ميديا"],
    icon: "📱",
  },
  research: {
    titleAr: "أفضل أدوات الذكاء الاصطناعي للبحث العلمي",
    h1: "أفضل أدوات AI للبحث العلمي والأكاديمي 2025",
    descriptionAr: "أدوات الذكاء الاصطناعي التي تساعد الباحثين والأكاديميين على مراجعة الأدبيات وتلخيص الأوراق البحثية وتحليل البيانات.",
    categories: ["chatbot", "productivity"],
    keywords: ["AI للبحث العلمي", "ذكاء اصطناعي للأكاديميين", "تلخيص الأبحاث", "مساعد البحث"],
    icon: "🔬",
  },
  arabic: {
    titleAr: "أفضل أدوات الذكاء الاصطناعي باللغة العربية",
    h1: "أفضل أدوات AI تدعم اللغة العربية 2025",
    descriptionAr: "أدوات الذكاء الاصطناعي التي تدعم اللغة العربية بشكل ممتاز — للكتابة والترجمة والمحادثة والبحث باللغة العربية.",
    categories: ["chatbot", "productivity"],
    keywords: ["AI باللغة العربية", "ذكاء اصطناعي عربي", "ChatGPT بالعربي", "كتابة عربية بالذكاء الاصطناعي"],
    icon: "🌐",
  },
};

export async function generateStaticParams() {
  return Object.keys(USE_CASES).map((usecase) => ({ usecase }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ usecase: string }>;
}): Promise<Metadata> {
  const { usecase } = await params;
  const uc = USE_CASES[usecase];
  if (!uc) return {};

  const url = absoluteUrl(`/ai-tools/for/${usecase}`);
  return {
    title: `${uc.titleAr} | ${SITE_NAME_AR}`,
    description: uc.descriptionAr,
    alternates: { canonical: url },
    keywords: uc.keywords.join(", "),
    openGraph: {
      title: uc.titleAr,
      description: uc.descriptionAr,
      url,
      locale: "ar_AR",
      type: "website",
    },
  };
}

const PRICING_BADGE: Record<string, string> = {
  free:     "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  freemium: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  paid:     "bg-red-500/10 text-red-400 border-red-500/20",
};
const PRICING_LABEL: Record<string, string> = {
  free: "مجاني", freemium: "مجاني+", paid: "مدفوع",
};

export default async function UseCasePage({
  params,
}: {
  params: Promise<{ usecase: string }>;
}) {
  const { usecase } = await params;
  const uc = USE_CASES[usecase];
  if (!uc) notFound();

  const tools = await prisma.aITool.findMany({
    where: { published: true, category: { in: uc.categories } },
    orderBy: [{ featuredAt: { sort: "desc", nulls: "last" } }, { viewCount: "desc" }],
  }).catch(() => []);

  // Also fetch all tools to show "other recommended" section
  const allTools = tools.length < 3
    ? await prisma.aITool.findMany({ where: { published: true }, orderBy: { viewCount: "desc" }, take: 6 }).catch(() => [])
    : [];

  const displayTools = tools.length > 0 ? tools : allTools;

  const pageUrl = absoluteUrl(`/ai-tools/for/${usecase}`);
  const breadcrumbItems = [
    { name: "الرئيسية", href: "/" },
    { name: "أدوات AI", href: "/ai-tools" },
    { name: uc.titleAr },
  ];

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: uc.titleAr,
    description: uc.descriptionAr,
    url: pageUrl,
    numberOfItems: displayTools.length,
    itemListElement: displayTools.map((t, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: t.name,
      url: `${SITE_URL}/ai-tools/${t.slug}`,
      description: truncate(t.descriptionAr, 150),
    })),
  };

  // Other use-cases for internal linking
  const otherUseCases = Object.entries(USE_CASES)
    .filter(([key]) => key !== usecase)
    .slice(0, 4);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(buildBreadcrumbJsonLd(breadcrumbItems)) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }} />

      <main className="min-h-screen" dir="rtl">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-white/5 py-16">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -top-16 right-1/4 h-80 w-80 rounded-full bg-violet-600/10 blur-3xl" />
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/30 to-transparent" />
          </div>
          <div className="container mx-auto px-4 relative">
            <Breadcrumbs items={breadcrumbItems} className="mb-6" />
            <div className="flex items-center gap-4 mb-4">
              <span className="text-5xl">{uc.icon}</span>
              <div>
                <h1 className="text-3xl font-black text-white md:text-4xl">{uc.h1}</h1>
                <p className="mt-2 text-slate-400 max-w-2xl">{uc.descriptionAr}</p>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {uc.keywords.map((kw) => (
                <span key={kw} className="rounded-full border border-violet-500/20 bg-violet-500/8 px-3 py-1 text-xs text-violet-400">
                  {kw}
                </span>
              ))}
            </div>
          </div>
        </section>

        <div className="container mx-auto px-4 py-12">
          <AdSlot position="ai-tools-top" className="mb-10" />

          {/* Tools grid */}
          {displayTools.length === 0 ? (
            <div className="py-20 text-center text-slate-500">
              <p className="text-lg">لا توجد أدوات في هذه الفئة بعد</p>
              <Link href="/ai-tools" className="mt-4 inline-block text-violet-400 hover:underline">عرض جميع الأدوات</Link>
            </div>
          ) : (
            <>
              <div className="mb-6 flex items-center gap-3">
                <h2 className="text-xl font-black text-white">الأدوات الموصى بها</h2>
                <span className="rounded-full bg-violet-500/10 px-2.5 py-0.5 text-xs font-bold text-violet-400">{displayTools.length} أداة</span>
                <div className="h-px flex-1 bg-white/5" />
              </div>

              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {displayTools.map((tool, i) => (
                  <Link
                    key={tool.id}
                    href={`/ai-tools/${tool.slug}`}
                    className="group relative flex flex-col rounded-2xl border border-white/6 bg-white/3 p-6 hover:border-violet-500/30 hover:bg-violet-500/5 transition"
                  >
                    {i < 3 && (
                      <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-violet-500 text-[11px] font-black text-white">
                        {i + 1}
                      </span>
                    )}
                    <div className="mb-4 flex items-center gap-3">
                      {tool.logoUrl ? (
                        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-white/10">
                          <Image src={tool.logoUrl} alt={tool.name} fill className="object-cover" />
                        </div>
                      ) : (
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/15 text-lg font-black text-violet-400">
                          {tool.name[0]}
                        </div>
                      )}
                      <div className="min-w-0">
                        <h3 className="font-bold text-slate-100 group-hover:text-violet-300 transition-colors">{tool.name}</h3>
                        {tool.tagline && <p className="text-xs text-slate-500 line-clamp-1">{tool.tagline}</p>}
                      </div>
                    </div>
                    <p className="mb-4 flex-1 text-sm text-slate-400 line-clamp-3">{tool.descriptionAr}</p>
                    {tool.pros.length > 0 && (
                      <ul className="mb-4 space-y-1">
                        {tool.pros.slice(0, 2).map((p, pi) => (
                          <li key={pi} className="flex items-center gap-1.5 text-xs text-emerald-400">
                            <span>✓</span><span className="line-clamp-1">{p}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                    <div className="flex items-center justify-between border-t border-white/5 pt-4">
                      <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${PRICING_BADGE[tool.pricing] ?? PRICING_BADGE.freemium}`}>
                        {PRICING_LABEL[tool.pricing] ?? "—"}
                      </span>
                      <span className="text-xs font-semibold text-violet-400 group-hover:text-violet-300">مراجعة مفصلة ←</span>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}

          {/* Internal links to other use cases */}
          <section className="mt-16">
            <div className="mb-5 flex items-center gap-3">
              <h2 className="text-lg font-black text-white">أدوات AI لاحتياجات أخرى</h2>
              <div className="h-px flex-1 bg-white/5" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {otherUseCases.map(([key, meta]) => (
                <Link
                  key={key}
                  href={`/ai-tools/for/${key}`}
                  className="flex items-center gap-3 rounded-xl border border-white/6 bg-white/3 p-4 hover:border-violet-500/20 hover:bg-violet-500/5 transition"
                >
                  <span className="text-2xl">{meta.icon}</span>
                  <span className="text-sm font-semibold text-slate-300">{meta.titleAr}</span>
                </Link>
              ))}
            </div>
          </section>

          <div className="mt-10 border-t border-white/8 pt-8 text-center">
            <Link href="/ai-tools" className="inline-flex items-center gap-2 rounded-2xl border border-violet-500/30 bg-violet-500/10 px-6 py-3 text-sm font-semibold text-violet-400 hover:bg-violet-500/20 transition">
              عرض جميع أدوات الذكاء الاصطناعي ←
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
