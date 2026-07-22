import type { Metadata } from "next";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db";
import { absoluteUrl, SITE_NAME_AR } from "@/lib/seo";
import { CACHE_TAGS, DEFAULT_REVALIDATE_SECONDS } from "@/lib/cache";
import PromptsLibrary from "@/components/PromptsLibrary";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}): Promise<Metadata> {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const canonicalPath = page > 1 ? `/prompts?page=${page}` : "/prompts";
  const title = page > 1
    ? `مكتبة البرومبتس — صفحة ${page} | ${SITE_NAME_AR}`
    : `مكتبة البرومبتس — أفضل Prompts للذكاء الاصطناعي | ${SITE_NAME_AR}`;

  return {
    title,
    description:
      "مكتبة مجانية تضم أفضل الـ prompts للذكاء الاصطناعي — ChatGPT، Midjourney، Claude وأكثر. ابحث، انسخ، واستخدم مباشرة.",
    alternates: { canonical: absoluteUrl(canonicalPath) },
    openGraph: {
      title,
      description: "أفضل الـ prompts للذكاء الاصطناعي — مجاناً",
      locale: "ar_AR",
      type: "website",
      url: absoluteUrl(canonicalPath),
    },
  };
}

const CATEGORIES = [
  { value: "all", label: "الكل" },
  { value: "image", label: "توليد الصور" },
  { value: "writing", label: "الكتابة" },
  { value: "code", label: "البرمجة" },
  { value: "marketing", label: "التسويق" },
  { value: "general", label: "عام" },
];

const PAGE_SIZE = 24;

const getData = unstable_cache(
  async (page: number) => {
    const [prompts, total, featured] = await Promise.all([
      prisma.prompt.findMany({
        where: { published: true },
        orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        select: {
          id: true, title: true, titleAr: true, description: true,
          category: true, tags: true, slug: true, featured: true,
          viewCount: true, createdAt: true,
          tool: { select: { name: true, slug: true, logoUrl: true } },
        },
      }),
      prisma.prompt.count({ where: { published: true } }),
      prisma.prompt.findMany({
        where: { published: true, featured: true },
        orderBy: { viewCount: "desc" },
        take: 6,  // always fills 2 full rows of 3
        select: {
          id: true, title: true, titleAr: true, description: true,
          category: true, tags: true, slug: true, featured: true,
          viewCount: true, createdAt: true,
          tool: { select: { name: true, slug: true, logoUrl: true } },
        },
      }),
    ]);

    return { prompts, total, featured };
  },
  ["prompts-index"],
  { tags: [CACHE_TAGS.prompts], revalidate: DEFAULT_REVALIDATE_SECONDS },
);

export default async function PromptsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const { prompts, total, featured } = await getData(page);

  const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `مكتبة البرومبتس | ${SITE_NAME_AR}`,
    description: "مكتبة مجانية تضم أفضل الـ prompts للذكاء الاصطناعي",
    url: absoluteUrl(page > 1 ? `/prompts?page=${page}` : "/prompts"),
    inLanguage: "ar",
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }} />
      <main className="min-h-screen" dir="rtl">
      {/* Hero — matches ai-tools style */}
      <section className="relative overflow-hidden border-b py-14" style={{ borderColor: "var(--border-subtle)" }}>
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full opacity-[0.06] hidden sm:block"
            style={{ background: "radial-gradient(circle, #6366f1, transparent)" }} />
          <div className="absolute -bottom-16 -left-16 h-60 w-60 rounded-full opacity-[0.04] hidden sm:block"
            style={{ background: "radial-gradient(circle, #8b5cf6, transparent)" }} />
        </div>

        <div className="container relative mx-auto px-4">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-semibold"
              style={{ borderColor: "var(--accent)", backgroundColor: "var(--accent-bg)", color: "var(--accent)" }}>
              <span className="h-1.5 w-1.5 animate-pulse rounded-full" style={{ backgroundColor: "var(--accent)" }} />
              {total > 0 ? `${total.toLocaleString("ar-EG")} برومبت جاهز` : "مكتبة مجانية"}
            </div>

            <h1 className="mb-4 text-4xl font-bold leading-tight md:text-5xl"
              style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
              مكتبة<br />
              <span style={{ color: "var(--accent)" }}>البرومبتس</span>
            </h1>
            <p className="mb-2 text-lg leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              أفضل الـ prompts للذكاء الاصطناعي — مجاناً، منسّقة، وجاهزة للاستخدام
            </p>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              تُضاف prompts جديدة تلقائياً كل يوم
            </p>
          </div>
        </div>
      </section>

      <PromptsLibrary
        initialPrompts={prompts}
        initialTotal={total}
        initialPage={page}
        featuredPrompts={featured}
        categories={CATEGORIES}
      />
      </main>
    </>
  );
}
