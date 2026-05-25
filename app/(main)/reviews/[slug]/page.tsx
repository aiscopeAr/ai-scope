import { cache } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";

import { prisma } from "@/lib/db";
import { AUTHORS, type AuthorSlug } from "@/lib/authors";
import ViewTracker from "@/components/ViewTracker";
import ReadingProgress from "@/components/ReadingProgress";
import ShareButtons from "@/components/ShareButtons";
import AdSlot from "@/components/AdSlot";
import { SITE_URL, SITE_NAME, SITE_NAME_AR, SITE_TWITTER_HANDLE, truncate, absoluteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

const getReview = cache(async (slug: string) => {
  return prisma.review.findUnique({
    where: { slug },
    include: { category: true },
  });
});

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const review = await getReview(slug);
  if (!review?.published) return {};
  const url = absoluteUrl(`/reviews/${slug}`);
  const description = truncate(review.summary, 160);
  return {
    title: `${review.titleAr} | ${SITE_NAME_AR}`,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      url,
      title: review.titleAr,
      description,
      locale: "ar_AR",
      siteName: SITE_NAME,
      publishedTime: review.publishedAt?.toISOString(),
      ...(review.imageUrl ? { images: [{ url: review.imageUrl, alt: review.imageAlt ?? review.titleAr }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      site: SITE_TWITTER_HANDLE,
      title: review.titleAr,
      description,
      ...(review.imageUrl ? { images: [review.imageUrl] } : {}),
    },
  };
}

export default async function ReviewPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const review = await getReview(slug);
  if (!review?.published) notFound();

  const author = AUTHORS[review.authorSlug as AuthorSlug];
  const reviewUrl = absoluteUrl(`/reviews/${slug}`);
  const wordCount = review.content.trim().split(/\s+/).length;
  const readingMinutes = Math.max(5, Math.round(wordCount / 200));

  const sources = (() => {
    try { return JSON.parse(review.sources as string) as Array<{ title: string; url: string; name: string }>; }
    catch { return []; }
  })();

  const faq = (() => {
    try { return Array.isArray(review.faq) ? review.faq as Array<{ question: string; answer: string }> : []; }
    catch { return []; }
  })();

  // Render Markdown as plain paragraphs (no extra dependency)
  const paragraphs = review.content
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": reviewUrl,
    headline: review.titleAr,
    description: truncate(review.summary, 160),
    url: reviewUrl,
    datePublished: review.publishedAt?.toISOString(),
    dateModified: review.updatedAt.toISOString(),
    inLanguage: "ar",
    author: {
      "@type": "Person",
      name: author?.nameAr,
      url: absoluteUrl(`/author/${review.authorSlug}`),
      jobTitle: author?.titleAr,
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
      logo: { "@type": "ImageObject", url: `${SITE_URL}/icon.png` },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": reviewUrl },
    articleSection: review.category.nameAr,
    keywords: review.tags.join(", "),
    ...(review.imageUrl ? { image: { "@type": "ImageObject", url: review.imageUrl } } : {}),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
      <ViewTracker slug={review.slug} />
      <ReadingProgress />
      <article className="container mx-auto max-w-3xl px-4 py-8" dir="rtl">

        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-sm text-slate-500">
          <Link href="/" className="hover:text-violet-400 transition-colors">الرئيسية</Link>
          <span>/</span>
          <Link href={`/category/${review.category.slug}`} className="hover:text-violet-400 transition-colors">{review.category.nameAr}</Link>
          <span>/</span>
          <span className="line-clamp-1 text-slate-400">{review.titleAr}</span>
        </nav>

        <AdSlot position="article-top" className="mb-6" />

        {/* Category badge */}
        <Link href={`/category/${review.category.slug}`} className="mb-4 inline-block rounded-full bg-violet-500/15 border border-violet-500/30 px-4 py-1 text-sm font-semibold text-violet-400 transition hover:bg-violet-500/25">
          {review.category.nameAr}
        </Link>

        {/* Title */}
        <h1 className="mb-6 text-3xl font-black leading-tight text-white md:text-4xl">{review.titleAr}</h1>

        {/* Summary lede */}
        <p className="mb-8 text-lg leading-relaxed text-slate-300 border-r-4 border-violet-500/40 pr-4">{review.summary}</p>

        {/* Meta bar */}
        <div className="mb-8 flex flex-wrap items-center gap-x-4 gap-y-3 border-b border-white/8 pb-8 text-slate-400">
          {author && (
            <Link href={`/author/${author.slug}`} className="flex items-center gap-2">
              <div className="h-8 w-8 overflow-hidden rounded-full" style={{ outline: `2px solid ${author.accentColor}50` }}>
                <img src={author.avatarUrl} alt={author.nameAr} className="h-full w-full object-cover" />
              </div>
              <span className="text-sm font-semibold" style={{ color: author.accentColor }}>{author.nameAr}</span>
            </Link>
          )}
          <span className="text-slate-700">•</span>
          {review.publishedAt && (
            <time dateTime={review.publishedAt.toISOString()} className="text-sm">
              {formatDistanceToNow(new Date(review.publishedAt), { addSuffix: true, locale: ar })}
            </time>
          )}
          <span className="text-slate-700">•</span>
          <span className="text-sm">{readingMinutes} دقيقة قراءة</span>
          <div className="mr-auto">
            <ShareButtons url={reviewUrl} title={review.titleAr} />
          </div>
        </div>

        {/* Hero image */}
        {review.imageUrl && (
          <div className="relative mb-8 h-72 overflow-hidden rounded-2xl sm:h-96">
            <Image src={review.imageUrl} alt={review.imageAlt ?? review.titleAr} fill className="object-cover" />
            <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/10" />
          </div>
        )}

        <AdSlot position="article-mid" className="mb-8" />

        {/* Content — render Markdown headings + paragraphs */}
        <div className="mb-12 space-y-4 text-lg leading-relaxed text-slate-300">
          {paragraphs.map((p, i) => {
            if (p.startsWith("## ")) return (
              <h2 key={i} className="mt-8 text-2xl font-black text-white">{p.slice(3)}</h2>
            );
            if (p.startsWith("### ")) return (
              <h3 key={i} className="mt-6 text-xl font-bold text-white">{p.slice(4)}</h3>
            );
            if (p.startsWith("- ") || p.startsWith("* ")) return (
              <ul key={i} className="list-disc list-inside space-y-1 text-slate-300">
                {p.split("\n").map((line, j) => (
                  <li key={j}>{line.replace(/^[-*]\s+/, "")}</li>
                ))}
              </ul>
            );
            return <p key={i}>{p}</p>;
          })}
        </div>

        <AdSlot position="article-bottom" className="mb-8" />

        {/* FAQ */}
        {faq.length > 0 && (
          <section className="mb-10" aria-label="أسئلة شائعة">
            <h2 className="mb-6 text-2xl font-black text-white">أسئلة شائعة</h2>
            <div className="space-y-3">
              {faq.map((item, i) => (
                <details key={i} className="group rounded-xl border border-white/8 bg-white/3 open:bg-white/5 transition">
                  <summary className="flex cursor-pointer items-center justify-between gap-4 px-5 py-4 font-semibold text-slate-200 marker:hidden list-none">
                    <span>{item.question}</span>
                    <svg className="h-5 w-5 shrink-0 text-violet-400 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </summary>
                  <p className="px-5 pb-4 text-slate-400 leading-relaxed">{item.answer}</p>
                </details>
              ))}
            </div>
          </section>
        )}

        {/* Tags */}
        {review.tags.length > 0 && (
          <div className="mb-8 flex flex-wrap gap-2">
            {review.tags.map((tag) => (
              <span key={tag} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-slate-400">
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Share bar */}
        <div className="mb-8 flex items-center justify-between gap-4 rounded-2xl border border-white/8 bg-white/3 px-5 py-4">
          <p className="text-sm font-semibold text-slate-400">أعجبك التقرير؟ شاركه مع أصدقائك</p>
          <ShareButtons url={reviewUrl} title={review.titleAr} />
        </div>

        {/* Sources */}
        {sources.length > 0 && (
          <div className="mb-8 rounded-2xl border border-white/8 bg-white/3 p-5">
            <p className="mb-3 text-sm font-bold text-slate-400">المصادر ({sources.length})</p>
            <ul className="space-y-2">
              {sources.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="mt-0.5 h-4 w-4 shrink-0 text-slate-600">{i + 1}.</span>
                  <div>
                    <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-violet-400 hover:underline">{s.title}</a>
                    <span className="ml-2 text-slate-600">— {s.name}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Author signature card */}
        {author && (
          <div className="mb-12 overflow-hidden rounded-2xl border p-5" style={{ borderColor: `${author.accentColor}25`, backgroundColor: `${author.accentColor}08` }}>
            <div className="flex items-start gap-4">
              <Link href={`/author/${author.slug}`} className="shrink-0">
                <div className="h-14 w-14 overflow-hidden rounded-full" style={{ outline: `2px solid ${author.accentColor}50`, outlineOffset: "2px" }}>
                  <img src={author.avatarUrl} alt={author.nameAr} className="h-full w-full object-cover" />
                </div>
              </Link>
              <div className="min-w-0 flex-1">
                <div className="mb-0.5 flex flex-wrap items-center gap-2">
                  <Link href={`/author/${author.slug}`} className="text-sm font-bold text-slate-200 hover:text-white">{author.nameAr}</Link>
                  <span className="rounded-full border px-2 py-0.5 text-[10px] font-semibold" style={{ color: author.accentColor, borderColor: `${author.accentColor}40`, backgroundColor: `${author.accentColor}12` }}>
                    نظام ذكاء اصطناعي
                  </span>
                </div>
                <p className="mb-1.5 text-xs text-slate-500">{author.titleAr}</p>
                <p className="text-xs leading-relaxed text-slate-400">
                  كُتب هذا التقرير بمساعدة {author.nameAr}، نظام ذكاء اصطناعي متخصص في {author.specialtyAr}، استناداً إلى {sources.length} مصدر موثوق مع مراجعة تحريرية.
                </p>
                <Link href={`/author/${author.slug}`} className="mt-2 inline-flex items-center gap-1 text-xs font-semibold hover:underline" style={{ color: author.accentColor }}>
                  جميع تقارير {author.nameAr}
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                </Link>
              </div>
            </div>
          </div>
        )}

      </article>
    </>
  );
}
