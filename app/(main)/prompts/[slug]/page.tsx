import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/db";
import { absoluteUrl, SITE_NAME_AR, truncate } from "@/lib/seo";
import CopyPromptButton from "@/components/CopyPromptButton";

export const revalidate = 600;

interface Props {
  params: { slug: string };
}

async function getPrompt(slug: string) {
  const prompt = await prisma.prompt.findUnique({
    where: { slug, published: true },
    include: { tool: { select: { id: true, name: true, slug: true, logoUrl: true, tagline: true } } },
  });
  return prompt;
}

async function getRelated(category: string, currentSlug: string) {
  return prisma.prompt.findMany({
    where: { published: true, category, slug: { not: currentSlug } },
    orderBy: [{ featured: "desc" }, { viewCount: "desc" }],
    take: 6,
    select: {
      id: true, title: true, titleAr: true, description: true,
      category: true, slug: true, featured: true,
      tool: { select: { name: true, slug: true, logoUrl: true } },
    },
  });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const prompt = await getPrompt(params.slug);
  if (!prompt) return {};

  return {
    title: `${prompt.titleAr} | ${SITE_NAME_AR}`,
    description: truncate(prompt.description ?? prompt.body, 160),
    alternates: { canonical: absoluteUrl(`/prompts/${prompt.slug}`) },
    openGraph: {
      title: prompt.titleAr,
      description: truncate(prompt.description ?? prompt.body, 160),
      locale: "ar_AR",
      type: "article",
      url: absoluteUrl(`/prompts/${prompt.slug}`),
    },
  };
}

const CATEGORY_LABELS: Record<string, string> = {
  image: "توليد الصور",
  writing: "الكتابة",
  code: "البرمجة",
  marketing: "التسويق",
  general: "عام",
};

export default async function PromptPage({ params }: Props) {
  const [prompt, _] = await Promise.all([
    getPrompt(params.slug),
    // increment view count (fire and forget)
    prisma.prompt.update({
      where: { slug: params.slug },
      data: { viewCount: { increment: 1 } },
    }).catch(() => null),
  ]);

  if (!prompt) notFound();

  const related = await getRelated(prompt.category, prompt.slug);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: prompt.titleAr,
    description: prompt.description ?? undefined,
    inLanguage: "ar",
    url: absoluteUrl(`/prompts/${prompt.slug}`),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main className="min-h-screen bg-gray-950 text-white" dir="rtl">
        <div className="mx-auto max-w-4xl px-4 py-10">
          {/* Breadcrumb */}
          <nav className="mb-6 flex items-center gap-2 text-sm text-gray-500">
            <Link href="/" className="hover:text-white">الرئيسية</Link>
            <span>/</span>
            <Link href="/prompts" className="hover:text-white">مكتبة البرومبتس</Link>
            <span>/</span>
            <span className="text-gray-300">{prompt.titleAr}</span>
          </nav>

          <div className="grid gap-8 lg:grid-cols-3">
            {/* Main */}
            <div className="lg:col-span-2">
              {/* Header */}
              <div className="mb-6 rounded-2xl border border-white/10 bg-white/5 p-6">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-violet-500/20 px-3 py-0.5 text-xs font-medium text-violet-300">
                    {CATEGORY_LABELS[prompt.category] ?? prompt.category}
                  </span>
                  {prompt.featured && (
                    <span className="rounded-full bg-amber-500/20 px-3 py-0.5 text-xs font-medium text-amber-300">
                      ⭐ مميز
                    </span>
                  )}
                </div>

                <h1 className="mb-2 text-2xl font-bold leading-snug md:text-3xl">{prompt.titleAr}</h1>
                <p className="text-sm text-gray-400">{prompt.title}</p>

                {prompt.description && (
                  <p className="mt-4 leading-relaxed text-gray-300">{prompt.description}</p>
                )}
              </div>

              {/* Prompt body */}
              <div className="mb-6 rounded-2xl border border-violet-500/30 bg-violet-950/20 p-6">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-semibold text-violet-300">نص البرومبت</span>
                  <CopyPromptButton text={prompt.body} />
                </div>
                <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-gray-200">
                  {prompt.body}
                </pre>
              </div>

              {/* Tags */}
              {prompt.tags.length > 0 && (
                <div className="mb-6 flex flex-wrap gap-2">
                  {prompt.tags.map(tag => (
                    <span
                      key={tag}
                      className="rounded-full bg-white/5 px-3 py-1 text-xs text-gray-400"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Related prompts */}
              {related.length > 0 && (
                <section>
                  <h2 className="mb-4 text-lg font-semibold">برومبتس مشابهة</h2>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {related.map(r => (
                      <Link
                        key={r.id}
                        href={`/prompts/${r.slug}`}
                        className="group rounded-xl border border-white/10 bg-white/5 p-4 transition-all hover:border-violet-500/30"
                      >
                        <p className="line-clamp-2 text-sm font-medium text-white group-hover:text-violet-300">
                          {r.titleAr}
                        </p>
                        {r.description && (
                          <p className="mt-1 line-clamp-1 text-xs text-gray-500">{r.description}</p>
                        )}
                      </Link>
                    ))}
                  </div>
                </section>
              )}
            </div>

            {/* Sidebar */}
            <aside className="space-y-4">
              {/* Tool card */}
              {prompt.tool ? (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <p className="mb-3 text-sm font-semibold text-gray-300">الأداة المقترحة</p>
                  <Link
                    href={`/ai-tools/${prompt.tool.slug}`}
                    className="flex items-center gap-3 rounded-xl bg-white/5 p-3 transition-colors hover:bg-white/10"
                  >
                    {prompt.tool.logoUrl ? (
                      <Image
                        src={prompt.tool.logoUrl}
                        alt={prompt.tool.name}
                        width={40}
                        height={40}
                        className="rounded-lg"
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/20 text-lg">
                        🤖
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-white">{prompt.tool.name}</p>
                      {prompt.tool.tagline && (
                        <p className="text-xs text-gray-400">{prompt.tool.tagline}</p>
                      )}
                    </div>
                  </Link>
                </div>
              ) : (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <p className="mb-1 text-sm font-semibold text-gray-300">متوافق مع</p>
                  <p className="text-sm text-gray-500">
                    ChatGPT، Claude، Gemini، وأي نموذج لغوي آخر
                  </p>
                </div>
              )}

              {/* Stats */}
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <p className="mb-3 text-sm font-semibold text-gray-300">إحصائيات</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">المشاهدات</span>
                    <span className="text-white">{prompt.viewCount.toLocaleString("ar-SA")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">الفئة</span>
                    <span className="text-white">{CATEGORY_LABELS[prompt.category] ?? prompt.category}</span>
                  </div>
                </div>
              </div>

              {/* Back */}
              <Link
                href="/prompts"
                className="block w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center text-sm text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
              >
                ← العودة إلى المكتبة
              </Link>
            </aside>
          </div>
        </div>
      </main>
    </>
  );
}
