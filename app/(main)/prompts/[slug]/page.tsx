import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db";
import { absoluteUrl, SITE_NAME_AR, truncate } from "@/lib/seo";
import { CACHE_TAGS } from "@/lib/cache";
import { buildBreadcrumbJsonLd } from "@/lib/breadcrumb-jsonld";
import PromptBodyTabs from "@/components/PromptBodyTabs";
import ArticleTracker from "@/components/ArticleTracker";
import ViewPing from "@/components/ViewPing";

export const revalidate = 600;

interface Props {
  params: Promise<{ slug: string }>;
}

// Cached prompt-by-slug read. `slug` is a function argument, so unstable_cache
// keys each slug to its own entry (no global/shared entry). generateMetadata
// and the page both call this with the same slug → one shared cached read
// instead of two uncached Neon queries. Tagged with CACHE_TAGS.prompts so a
// publish/edit (which calls revalidateNow(CACHE_TAGS.prompts)) refreshes it
// immediately; the 600s window (matching this route's `revalidate`) is only a
// safety net. Keeps the route Dynamic — this removes per-request Neon reads,
// not the render itself.
const getPromptCached = unstable_cache(
  async (slug: string) =>
    prisma.prompt.findUnique({
      where: { slug, published: true },
      include: { tool: { select: { id: true, name: true, slug: true, logoUrl: true, tagline: true } } },
    }),
  ["prompt-by-slug"],
  { tags: [CACHE_TAGS.prompts], revalidate: 600 },
);

// React cache() dedupes the two calls within one request (generateMetadata +
// page) so a cold entry is fetched once, not twice; unstable_cache above then
// serves every later request from the data cache. Mirrors reviews/[slug].
const getPrompt = cache((slug: string) => getPromptCached(slug));

// Cached related-prompts read. Both `category` and `currentSlug` are function
// arguments, so each (category, slug) pair keys its own entry. Same tag/window
// as getPrompt; select/order/limit are unchanged.
const getRelated = unstable_cache(
  async (category: string, currentSlug: string) =>
    prisma.prompt.findMany({
      where: { published: true, category, slug: { not: currentSlug } },
      orderBy: [{ featured: "desc" }, { viewCount: "desc" }],
      take: 6,
      select: {
        id: true, title: true, titleAr: true, description: true,
        category: true, slug: true, featured: true,
        tool: { select: { name: true, slug: true, logoUrl: true } },
      },
    }),
  ["prompt-related"],
  { tags: [CACHE_TAGS.prompts], revalidate: 600 },
);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const prompt = await getPrompt(slug);
  if (!prompt) return {};
  const description = truncate(prompt.description ?? prompt.body, 160);
  // صورة OG ديناميكية للبرومبت — نفس نمط /api/og المستخدم في صفحات التقارير.
  // تمرير category يجعل الصورة تعرض وسم "مكتبة البرومبتس" (المسار لا يدعم type=prompt).
  const ogImage = absoluteUrl(
    `/api/og?${new URLSearchParams({ title: prompt.titleAr, category: "مكتبة البرومبتس" }).toString()}`,
  );
  return {
    title: `${prompt.titleAr} | ${SITE_NAME_AR}`,
    description,
    alternates: { canonical: absoluteUrl(`/prompts/${prompt.slug}`) },
    openGraph: {
      title: prompt.titleAr,
      description,
      locale: "ar_AR",
      type: "article",
      url: absoluteUrl(`/prompts/${prompt.slug}`),
      images: [{ url: ogImage, width: 1200, height: 630, alt: prompt.titleAr }],
    },
    twitter: {
      card: "summary_large_image",
      title: prompt.titleAr,
      description,
      images: [ogImage],
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

const CATEGORY_BADGE: Record<string, { bg: string; color: string; border: string }> = {
  image:     { bg: "#fdf4ff", color: "#9333ea", border: "#e9d5ff" },
  writing:   { bg: "#eff6ff", color: "#2563eb", border: "#bfdbfe" },
  code:      { bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0" },
  marketing: { bg: "#fffbeb", color: "#b45309", border: "#fde68a" },
  general:   { bg: "var(--bg-subtle)", color: "var(--text-muted)", border: "var(--border-medium)" },
};

export default async function PromptPage({ params }: Props) {
  const { slug } = await params;

  const prompt = await getPrompt(slug);

  if (!prompt) notFound();

  const related = await getRelated(prompt.category, prompt.slug);
  const badge = CATEGORY_BADGE[prompt.category] ?? CATEGORY_BADGE.general;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: prompt.titleAr,
    description: prompt.description ?? undefined,
    inLanguage: "ar",
    url: absoluteUrl(`/prompts/${prompt.slug}`),
  };

  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: "الرئيسية", href: "/" },
    { name: "مكتبة البرومبتس", href: "/prompts" },
    { name: prompt.titleAr },
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

      <ArticleTracker slug={prompt.slug} category={prompt.category} />
      <ViewPing endpoint={`/api/prompts/${prompt.slug}/view`} />
      <main className="min-h-screen" dir="rtl">
        <div className="container mx-auto max-w-5xl px-4 py-10">

          {/* Breadcrumb */}
          <nav className="mb-6 flex items-center gap-2 text-sm" style={{ color: "var(--text-muted)" }}>
            <Link href="/" className="transition-colors hover:text-[var(--text-primary)]">الرئيسية</Link>
            <span>/</span>
            <Link href="/prompts" className="transition-colors hover:text-[var(--text-primary)]">مكتبة البرومبتس</Link>
            <span>/</span>
            <span style={{ color: "var(--text-secondary)" }}>{prompt.titleAr}</span>
          </nav>

          <div className="grid gap-8 lg:grid-cols-3">

            {/* ── Main ─────────────────────────────────────────────── */}
            <div className="lg:col-span-2 space-y-5">

              {/* Header card */}
              <div className="rounded-[6px] border p-6"
                style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-surface)" }}>
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  <span className="rounded-[3px] border px-2.5 py-0.5 text-xs font-semibold"
                    style={{ backgroundColor: badge.bg, color: badge.color, borderColor: badge.border }}>
                    {CATEGORY_LABELS[prompt.category] ?? prompt.category}
                  </span>
                  {prompt.featured && (
                    <span className="rounded-[3px] border px-2.5 py-0.5 text-xs font-semibold"
                      style={{ backgroundColor: "#fffbeb", color: "#b45309", borderColor: "#fde68a" }}>
                      ⭐ مميز
                    </span>
                  )}
                </div>

                <h1 className="mb-1 text-2xl font-bold leading-snug md:text-3xl"
                  style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
                  {prompt.titleAr}
                </h1>
                <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>{prompt.title}</p>

                {prompt.description && (
                  <p className="leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                    {prompt.description}
                  </p>
                )}
              </div>

              {/* Prompt body with language tabs */}
              <PromptBodyTabs body={prompt.body} bodyAr={prompt.bodyAr ?? null} slug={prompt.slug} category={prompt.category} />

              {/* Tags */}
              {prompt.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {prompt.tags.map(tag => (
                    <span key={tag}
                      className="rounded-[3px] border px-3 py-1 text-xs"
                      style={{ borderColor: "var(--border-medium)", color: "var(--text-muted)", backgroundColor: "var(--bg-subtle)" }}>
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Related prompts */}
              {related.length > 0 && (
                <section className="rounded-[6px] border p-6"
                  style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-surface)" }}>
                  <div className="mb-5 flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-bold"
                        style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
                        برومبتس قد تعجبك
                      </h2>
                      <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                        في نفس الفئة — جاهزة للاستخدام الآن
                      </p>
                    </div>
                    <Link href="/prompts"
                      className="text-xs font-semibold transition-opacity hover:opacity-70"
                      style={{ color: "var(--accent)" }}>
                      عرض الكل ←
                    </Link>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {related.map((r, i) => (
                      <Link key={r.id} href={`/prompts/${r.slug}`}
                        className="card-hover group flex flex-col gap-2 rounded-[6px]">
                        <div className="flex items-start gap-3">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[6px] text-sm font-bold"
                            style={{ backgroundColor: "var(--accent-bg)", color: "var(--accent)" }}>
                            {i + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="line-clamp-2 text-sm font-semibold leading-snug"
                              style={{ color: "var(--text-primary)" }}>
                              {r.titleAr}
                            </p>
                            {r.description && (
                              <p className="mt-1 line-clamp-2 text-xs leading-relaxed"
                                style={{ color: "var(--text-muted)" }}>
                                {r.description}
                              </p>
                            )}
                          </div>
                        </div>
                        <span className="text-xs font-semibold" style={{ color: "var(--accent)" }}>
                          نسخ واستخدام ←
                        </span>
                      </Link>
                    ))}
                  </div>
                </section>
              )}
            </div>

            {/* ── Sidebar ──────────────────────────────────────────── */}
            <aside className="space-y-4">

              {/* Tool card */}
              {prompt.tool ? (
                <div className="rounded-[6px] border p-5"
                  style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-surface)" }}>
                  <p className="mb-3 text-sm font-semibold" style={{ color: "var(--text-primary)" }}>الأداة المقترحة</p>
                  <Link href={`/ai-tools/${prompt.tool.slug}`}
                    className="card-hover flex items-center gap-3">
                    {prompt.tool.logoUrl ? (
                      <Image src={prompt.tool.logoUrl} alt={prompt.tool.name} width={40} height={40}
                        className="rounded-[6px] shrink-0" />
                    ) : (
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[6px] text-xl"
                        style={{ backgroundColor: "var(--accent-bg)", color: "var(--accent)" }}>🤖</div>
                    )}
                    <div>
                      <p className="font-semibold" style={{ color: "var(--text-primary)" }}>{prompt.tool.name}</p>
                      {prompt.tool.tagline && (
                        <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{prompt.tool.tagline}</p>
                      )}
                    </div>
                  </Link>
                </div>
              ) : (
                <div className="rounded-[6px] border p-5"
                  style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-surface)" }}>
                  <p className="mb-1 text-sm font-semibold" style={{ color: "var(--text-primary)" }}>متوافق مع</p>
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                    ChatGPT، Claude، Gemini، وأي نموذج لغوي آخر
                  </p>
                </div>
              )}

              {/* Stats */}
              <div className="rounded-[6px] border p-5"
                style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-surface)" }}>
                <p className="mb-3 text-sm font-semibold" style={{ color: "var(--text-primary)" }}>إحصائيات</p>
                <dl className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <dt style={{ color: "var(--text-muted)" }}>المشاهدات</dt>
                    <dd className="font-medium" style={{ color: "var(--text-primary)" }}>
                      {prompt.viewCount.toLocaleString("ar-SA")}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt style={{ color: "var(--text-muted)" }}>الفئة</dt>
                    <dd className="font-medium" style={{ color: "var(--text-primary)" }}>
                      {CATEGORY_LABELS[prompt.category] ?? prompt.category}
                    </dd>
                  </div>
                </dl>
              </div>

              {/* Back */}
              <Link href="/prompts"
                className="pill-hover flex items-center justify-center gap-2 w-full py-2.5 text-sm font-medium"
                style={{ borderColor: "var(--border-medium)", color: "var(--text-secondary)" }}>
                ← العودة إلى المكتبة
              </Link>
            </aside>
          </div>
        </div>
      </main>
    </>
  );
}
