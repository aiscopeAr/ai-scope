import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";

import { prisma } from "@/lib/db";
import { AUTHORS, type AuthorSlug } from "@/lib/authors";
import { SITE_NAME_AR, absoluteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  return Object.keys(AUTHORS).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const author = AUTHORS[slug as AuthorSlug];
  if (!author) return {};
  return {
    title: `${author.nameAr} — ${author.titleAr} | ${SITE_NAME_AR}`,
    description: author.bioAr,
    alternates: { canonical: absoluteUrl(`/author/${slug}`) },
  };
}

export default async function AuthorPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const author = AUTHORS[slug as AuthorSlug];
  if (!author) notFound();

  let reviews: Array<{
    id: string; slug: string; titleAr: string; summary: string;
    imageUrl: string | null; publishedAt: Date | null;
    category: { nameAr: string; slug: string };
  }> = [];
  let totalCount = 0;

  try {
    [reviews, totalCount] = await Promise.all([
      prisma.review.findMany({
        where: { published: true, authorSlug: slug },
        orderBy: { publishedAt: "desc" },
        take: 12,
        select: {
          id: true, slug: true, titleAr: true, summary: true,
          imageUrl: true, publishedAt: true,
          category: { select: { nameAr: true, slug: true } },
        },
      }),
      prisma.review.count({ where: { published: true, authorSlug: slug } }),
    ]);
  } catch { /* DB unavailable */ }

  return (
    <div className="min-h-screen" dir="rtl">
      {/* Hero */}
      <section className="border-b border-white/8 bg-gradient-to-b from-white/3 to-transparent py-16">
        <div className="container mx-auto max-w-4xl px-4">
          <div className="flex flex-col items-center gap-8 sm:flex-row sm:items-start">
            <div className="relative shrink-0">
              <div className="h-28 w-28 overflow-hidden rounded-full" style={{ outline: `4px solid ${author.accentColor}`, outlineOffset: "3px" }}>
                <Image src={author.avatarUrl} alt={author.nameAr} width={112} height={112} className="h-full w-full object-cover" />
              </div>
              <span className="absolute -bottom-1 -left-1 rounded-full border border-white/10 bg-[#0d0d12] px-2 py-0.5 text-[10px] font-bold" style={{ color: author.accentColor }}>AI</span>
            </div>

            <div className="flex-1 text-center sm:text-right">
              <div className="mb-1 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                <h1 className="text-3xl font-black text-white">{author.nameAr}</h1>
                <span className="rounded-full border px-3 py-0.5 text-xs font-semibold" style={{ color: author.accentColor, borderColor: `${author.accentColor}40`, backgroundColor: `${author.accentColor}12` }}>
                  نظام ذكاء اصطناعي
                </span>
              </div>
              <p className="mb-4 text-sm font-medium text-slate-400">{author.titleAr}</p>
              <p className="mb-5 max-w-xl leading-relaxed text-slate-300">{author.bioAr}</p>

              <div className="flex flex-wrap items-center justify-center gap-4 sm:justify-start">
                <div className="text-center">
                  <p className="text-2xl font-black text-white">{totalCount}</p>
                  <p className="text-xs text-slate-500">سكريفة</p>
                </div>
                <div className="h-8 w-px bg-white/10" />
                <div className="text-center">
                  <p className="text-sm font-semibold text-white">{author.specialtyAr}</p>
                  <p className="text-xs text-slate-500">التخصص</p>
                </div>
                {author.socialTwitter && (
                  <>
                    <div className="h-8 w-px bg-white/10" />
                    <a href={author.socialTwitter} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition">
                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.258 5.63 5.906-5.63Zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                      </svg>
                      تويتر
                    </a>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Voice traits */}
          <div className="mt-10 rounded-2xl border border-white/8 bg-white/3 p-5">
            <h2 className="mb-3 text-sm font-bold text-slate-400">أسلوب الكتابة</h2>
            <ul className="space-y-1.5">
              {author.voiceTraits.map((trait, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-slate-300">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: author.accentColor }} />
                  {trait}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section className="container mx-auto max-w-4xl px-4 py-12">
        <h2 className="mb-6 text-xl font-black text-white">
          سكريفات {author.nameAr}
          {totalCount > 0 && <span className="mr-2 text-base font-normal text-slate-500">({totalCount})</span>}
        </h2>

        {reviews.length === 0 ? (
          <p className="text-slate-500">لا توجد سكريفات بعد.</p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {reviews.map((r) => {
              const timeAgo = r.publishedAt
                ? formatDistanceToNow(new Date(r.publishedAt), { addSuffix: true, locale: ar })
                : null;
              return (
                <Link key={r.id} href={`/reviews/${r.slug}`} className="group flex flex-col overflow-hidden rounded-xl border border-white/6 bg-white/2 transition hover:border-violet-500/30 hover:bg-white/4">
                  <div className="relative h-44 w-full shrink-0 bg-white/4">
                    {r.imageUrl ? (
                      <Image src={r.imageUrl} alt={r.titleAr} fill className="object-cover transition-transform duration-500 group-hover:scale-105" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center" style={{ background: `linear-gradient(135deg, ${author.accentColor}20, #1e1b4b40)` }}>
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={`${author.accentColor}50`} strokeWidth="1.5">
                          <circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3"/>
                        </svg>
                      </div>
                    )}
                    <div className="absolute bottom-2 right-2">
                      <span className="rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-medium text-slate-300 backdrop-blur-sm">{r.category.nameAr}</span>
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col p-4">
                    <h3 className="mb-2 line-clamp-2 flex-1 text-sm font-bold leading-snug text-slate-200 group-hover:text-violet-300 transition-colors">{r.titleAr}</h3>
                    <p className="mb-3 line-clamp-2 text-xs leading-relaxed text-slate-500">{r.summary}</p>
                    {timeAgo && <p className="text-[11px] text-slate-600">{timeAgo}</p>}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
