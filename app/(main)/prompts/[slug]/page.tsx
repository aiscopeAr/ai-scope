import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/db";
import { absoluteUrl, SITE_NAME_AR, truncate } from "@/lib/seo";
import CopyPromptButton from "@/components/CopyPromptButton";

export const revalidate = 600;

interface Props {
  params: Promise<{ slug: string }>;
}

async function getPrompt(slug: string) {
  return prisma.prompt.findUnique({
    where: { slug, published: true },
    include: { tool: { select: { id: true, name: true, slug: true, logoUrl: true, tagline: true } } },
  });
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
  const { slug } = await params;
  const prompt = await getPrompt(slug);
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

const CATEGORY_BADGE: Record<string, { bg: string; color: string; border: string }> = {
  image:     { bg: "#fdf4ff", color: "#9333ea", border: "#e9d5ff" },
  writing:   { bg: "#eff6ff", color: "#2563eb", border: "#bfdbfe" },
  code:      { bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0" },
  marketing: { bg: "#fffbeb", color: "#b45309", border: "#fde68a" },
  general:   { bg: "var(--bg-subtle)", color: "var(--text-muted)", border: "var(--border-medium)" },
};

export default async function PromptPage({ params }: Props) {
  const { slug } = await params;

  const [prompt] = await Promise.all([
    getPrompt(slug),
    prisma.prompt.update({
      where: { slug },
      data: { viewCount: { increment: 1 } },
    }).catch(() => null),
  ]);

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

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <main className="min-h-screen" dir="rtl">
        <div className="container mx-auto max-w-5xl px-4 py-10">

          {/* Breadcrumb */}
          <nav className="mb-6 flex items-center gap-2 text-sm" style={{ color: "var(--text-muted)" }}>
            <Link href="/" className="transition-colors hover:text-[var(--accent)]">الرئيسية</Link>
            <span>/</span>
            <Link href="/prompts" className="transition-colors hover:text-[var(--accent)]">مكتبة البرومبتس</Link>
            <span>/</span>
            <span style={{ color: "var(--text-secondary)" }}>{prompt.titleAr}</span>
          </nav>

          <div className="grid gap-8 lg:grid-cols-3">

            {/* ── Main ─────────────────────────────────────────────── */}
            <div className="lg:col-span-2 space-y-5">

              {/* Header card */}
              <div className="rounded-[6px] border p-6" style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-surface)" }}>
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

              {/* Prompt body */}
              <div className="rounded-[6px] border p-6" style={{ borderColor: "var(--accent)", backgroundColor: "var(--accent-bg)" }}>
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-sm font-semibold" style={{ color: "var(--accent)" }}>نص البرومبت</span>
                  <CopyPromptButton text={prompt.body} />
                </div>
                <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed overflow-x-auto"
                  dir="ltr"
                  style={{ color: "var(--text-primary)", textAlign: "left" }}>
                  {prompt.body}
                </pre>
              </div>

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
                <section className="border-t pt-6" style={{ borderColor: "var(--border-subtle)" }}>
                  <h2 className="mb-4 text-lg font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
                    برومبتس مشابهة
                  </h2>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {related.map(r => (
                      <Link key={r.id} href={`/prompts/${r.slug}`}
                        className="group rounded-[6px] border p-4 transition-all"
                        style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-surface)" }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--accent)"; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border-subtle)"; }}
                      >
                        <p className="line-clamp-2 text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                          {r.titleAr}
                        </p>
                        {r.description && (
                          <p className="mt-1 line-clamp-1 text-xs" style={{ color: "var(--text-muted)" }}>{r.description}</p>
                        )}
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
                <div className="rounded-[6px] border p-5" style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-surface)" }}>
                  <p className="mb-3 text-sm font-semibold" style={{ color: "var(--text-primary)" }}>الأداة المقترحة</p>
                  <Link href={`/ai-tools/${prompt.tool.slug}`}
                    className="flex items-center gap-3 rounded-[6px] border p-3 transition-colors"
                    style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-subtle)" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--accent)"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border-subtle)"; }}
                  >
                    {prompt.tool.logoUrl ? (
                      <Image src={prompt.tool.logoUrl} alt={prompt.tool.name} width={40} height={40} className="rounded-[6px]" />
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
                <div className="rounded-[6px] border p-5" style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-surface)" }}>
                  <p className="mb-1 text-sm font-semibold" style={{ color: "var(--text-primary)" }}>متوافق مع</p>
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                    ChatGPT، Claude، Gemini، وأي نموذج لغوي آخر
                  </p>
                </div>
              )}

              {/* Stats */}
              <div className="rounded-[6px] border p-5" style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-surface)" }}>
                <p className="mb-3 text-sm font-semibold" style={{ color: "var(--text-primary)" }}>إحصائيات</p>
                <dl className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <dt style={{ color: "var(--text-muted)" }}>المشاهدات</dt>
                    <dd className="font-medium" style={{ color: "var(--text-primary)" }}>{prompt.viewCount.toLocaleString("ar-SA")}</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt style={{ color: "var(--text-muted)" }}>الفئة</dt>
                    <dd className="font-medium" style={{ color: "var(--text-primary)" }}>{CATEGORY_LABELS[prompt.category] ?? prompt.category}</dd>
                  </div>
                </dl>
              </div>

              {/* Back */}
              <Link href="/prompts"
                className="flex items-center justify-center gap-2 rounded-[6px] border px-4 py-3 text-sm font-medium transition-colors"
                style={{ borderColor: "var(--border-medium)", color: "var(--text-secondary)", backgroundColor: "var(--bg-surface)" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--accent)"; (e.currentTarget as HTMLElement).style.color = "var(--accent)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border-medium)"; (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)"; }}
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
