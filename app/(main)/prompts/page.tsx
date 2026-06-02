import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { absoluteUrl, SITE_NAME_AR } from "@/lib/seo";
import PromptsLibrary from "@/components/PromptsLibrary";

export const revalidate = 300;

export const metadata: Metadata = {
  title: `مكتبة البرومبتس — أفضل Prompts للذكاء الاصطناعي | ${SITE_NAME_AR}`,
  description:
    "مكتبة مجانية تضم أفضل الـ prompts للذكاء الاصطناعي — ChatGPT، Midjourney، Claude وأكثر. ابحث، انسخ، واستخدم مباشرة.",
  alternates: { canonical: absoluteUrl("/prompts") },
  openGraph: {
    title: `مكتبة البرومبتس | ${SITE_NAME_AR}`,
    description: "أفضل الـ prompts للذكاء الاصطناعي — مجاناً",
    locale: "ar_AR",
    type: "website",
    url: absoluteUrl("/prompts"),
  },
};

const CATEGORIES = [
  { value: "all", label: "الكل" },
  { value: "image", label: "توليد الصور" },
  { value: "writing", label: "الكتابة" },
  { value: "code", label: "البرمجة" },
  { value: "marketing", label: "التسويق" },
  { value: "general", label: "عام" },
];

async function getData() {
  const [prompts, total, featured] = await Promise.all([
    prisma.prompt.findMany({
      where: { published: true },
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
      take: 24,
      select: {
        id: true,
        title: true,
        titleAr: true,
        description: true,
        category: true,
        tags: true,
        slug: true,
        featured: true,
        viewCount: true,
        createdAt: true,
        tool: { select: { name: true, slug: true, logoUrl: true } },
      },
    }),
    prisma.prompt.count({ where: { published: true } }),
    prisma.prompt.findMany({
      where: { published: true, featured: true },
      orderBy: { viewCount: "desc" },
      take: 6,
      select: {
        id: true,
        title: true,
        titleAr: true,
        description: true,
        category: true,
        tags: true,
        slug: true,
        featured: true,
        viewCount: true,
        createdAt: true,
        tool: { select: { name: true, slug: true, logoUrl: true } },
      },
    }),
  ]);

  return { prompts, total, featured };
}

export default async function PromptsPage() {
  const { prompts, total, featured } = await getData();

  return (
    <main className="min-h-screen bg-gray-950 text-white" dir="rtl">
      {/* Hero */}
      <section className="border-b border-white/10 bg-gradient-to-b from-violet-950/40 to-gray-950 px-4 py-16 text-center">
        <div className="mx-auto max-w-3xl">
          <span className="mb-4 inline-block rounded-full bg-violet-500/20 px-4 py-1 text-sm font-medium text-violet-300">
            مكتبة مجانية
          </span>
          <h1 className="mb-4 text-4xl font-bold tracking-tight md:text-5xl">
            مكتبة البرومبتس
          </h1>
          <p className="mb-6 text-lg text-gray-400">
            أفضل الـ prompts للذكاء الاصطناعي — مجاناً، منسّقة، وجاهزة للاستخدام
          </p>
          <p className="text-sm text-gray-500">{total.toLocaleString("ar-SA")} برومبت متاح</p>
        </div>
      </section>

      <PromptsLibrary
        initialPrompts={prompts}
        initialTotal={total}
        featuredPrompts={featured}
        categories={CATEGORIES}
      />
    </main>
  );
}
