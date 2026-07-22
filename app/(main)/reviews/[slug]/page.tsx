import React, { cache } from "react";
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
import RelatedArticles from "@/components/RelatedArticles";
import ArticleTracker from "@/components/ArticleTracker";
import { SITE_URL, SITE_NAME, SITE_NAME_AR, SITE_TWITTER_HANDLE, truncate, absoluteUrl } from "@/lib/seo";
import { tagToSlug, normalizeTag, buildTagSummaries } from "@/lib/tags";

export const revalidate = 3600; // re-render at most once per hour

export async function generateStaticParams() {
  const reviews = await prisma.review.findMany({
    where: { published: true },
    select: { slug: true },
  });
  return reviews.map((r) => ({ slug: r.slug }));
}

/** Build /api/og URL with article data embedded — avoids internal fetch from edge runtime */
function buildOgUrl(review: {
  titleAr: string;
  summary: string | null;
  imageUrl: string | null;
  category: { nameAr: string };
}): string {
  const params = new URLSearchParams({
    title: review.titleAr,
    category: review.category.nameAr,
    summary: (review.summary ?? "").slice(0, 120),
    ...(review.imageUrl ? { imageUrl: review.imageUrl } : {}),
  });
  return absoluteUrl(`/api/og?${params.toString()}`);
}

const getReview = cache(async (slug: string) => {
  return prisma.review.findUnique({
    where: { slug },
    include: { category: true },
  });
});

/** Canonical tags with enough reviews to have a /tag/[tag] page — cached per request. */
const getLinkableTagSet = cache(async (): Promise<Set<string>> => {
  const reviews = await prisma.review.findMany({ where: { published: true }, select: { tags: true } });
  const summaries = buildTagSummaries(reviews.map((r) => r.tags));
  return new Set(summaries.map((s) => s.canonical));
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
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
    },
    openGraph: {
      type: "article",
      url,
      title: review.titleAr,
      description,
      locale: "ar_AR",
      siteName: SITE_NAME,
      publishedTime: review.publishedAt?.toISOString(),
      images: [
        { url: buildOgUrl(review), width: 1200, height: 630, alt: review.titleAr },
      ],
    },
    twitter: {
      card: "summary_large_image",
      site: SITE_TWITTER_HANDLE,
      title: review.titleAr,
      description,
      images: [buildOgUrl(review)],
    },
  };
}

export default async function ReviewPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const review = await getReview(slug);
  if (!review?.published) notFound();

  const [relatedArticles, midArticle, linkableTags] = await Promise.all([
    prisma.review.findMany({
      where: { published: true, categoryId: review.categoryId, slug: { not: slug } },
      orderBy: { publishedAt: "desc" },
      take: 6,
      select: {
        slug: true, titleAr: true, summary: true, imageUrl: true, publishedAt: true,
        category: { select: { nameAr: true, slug: true } },
      },
    }),
    prisma.review.findFirst({
      where: { published: true, categoryId: { not: review.categoryId } },
      orderBy: { publishedAt: "desc" },
      select: { slug: true, titleAr: true, summary: true, imageUrl: true, category: { select: { nameAr: true, slug: true } } },
    }),
    getLinkableTagSet(),
  ]);

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

  // Render inline Markdown (bold, italic, inline-code) inside a paragraph
  function renderInline(text: string): React.ReactNode[] {
    const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**"))
        return <strong key={i}>{part.slice(2, -2)}</strong>;
      if (part.startsWith("*") && part.endsWith("*"))
        return <em key={i}>{part.slice(1, -1)}</em>;
      if (part.startsWith("`") && part.endsWith("`"))
        return <code key={i} className="rounded bg-slate-100 px-1 py-0.5 text-sm font-mono">{part.slice(1, -1)}</code>;
      return part;
    });
  }

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

  const faqJsonLd = faq.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  } : null;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
      {faqJsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />}
      <ViewTracker slug={review.slug} />
      <ArticleTracker slug={review.slug} category={review.category?.slug} />
      <ReadingProgress />
      <article className="container mx-auto max-w-3xl px-4 py-8" dir="rtl">

        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-sm" style={{ color: "var(--text-muted)" }}>
          <Link href="/" className="link-muted transition-colors">الرئيسية</Link>
          <span>/</span>
          <Link href={`/category/${review.category.slug}`} className="link-muted transition-colors">{review.category.nameAr}</Link>
          <span>/</span>
          <span className="line-clamp-1 font-medium" style={{ color: "var(--text-secondary)" }}>{review.titleAr}</span>
        </nav>

        <AdSlot position="article-top" className="mb-6" />

        {/* Category badge */}
        <Link
          href={`/category/${review.category.slug}`}
          className="btn-outline-accent mb-4 inline-block rounded-[3px] px-4 py-1 text-sm font-semibold transition"
        >
          {review.category.nameAr}
        </Link>

        {/* Title */}
        <h1 className="mb-6 text-3xl font-bold leading-tight md:text-4xl" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>{review.titleAr}</h1>

        {/* Summary lede */}
        <p className="mb-8 text-lg leading-relaxed border-r-4 pr-4" style={{ color: "var(--text-secondary)", borderColor: "var(--accent)" }}>{review.summary}</p>

        {/* Meta bar */}
        <div className="mb-8 flex flex-wrap items-center gap-x-4 gap-y-3 border-b pb-8" style={{ borderColor: "var(--border-subtle)", color: "var(--text-muted)" }}>
          {author && (
            <Link href={`/author/${author.slug}`} className="flex items-center gap-2">
              <div className="h-8 w-8 overflow-hidden rounded-[4px]" style={{ outline: `2px solid ${author.accentColor}50` }}>
                <img src={author.avatarUrl} alt={author.nameAr} className="h-full w-full object-cover" />
              </div>
              <span className="text-sm font-semibold" style={{ color: author.accentColor }}>{author.nameAr}</span>
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>· كاتب بالذكاء الاصطناعي</span>
            </Link>
          )}
          <span style={{ color: "var(--border-medium)" }}>•</span>
          {review.publishedAt && (
            <time dateTime={review.publishedAt.toISOString()} className="text-sm">
              {formatDistanceToNow(new Date(review.publishedAt), { addSuffix: true, locale: ar })}
            </time>
          )}
          <span style={{ color: "var(--border-medium)" }}>•</span>
          <span className="text-sm">{readingMinutes} دقيقة قراءة</span>
          <div className="mr-auto">
            <ShareButtons url={reviewUrl} title={review.titleAr} />
          </div>
        </div>

        {/* Hero image — priority since this is the LCP element on every article page */}
        {review.imageUrl && (
          <div className="relative mb-8 h-72 overflow-hidden rounded-[6px] sm:h-96">
            <Image src={review.imageUrl} alt={review.imageAlt ?? review.titleAr} fill priority className="object-cover" />
          </div>
        )}

        <AdSlot position="article-mid" className="mb-8" />

        {/* Content */}
        <div className="prose-ar mb-12 space-y-4">
          {paragraphs.map((p, i) => {
            const isH2 = p.startsWith("## ");
            const isH3 = p.startsWith("### ");
            const isList = p.startsWith("- ") || p.startsWith("* ");

            if (i === 3 && midArticle) return (
              <div key={i}>
                {isH2 ? <h2 className="mt-8 text-2xl font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>{renderInline(p.slice(3))}</h2>
                  : isH3 ? <h3 className="mt-6 text-xl font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>{renderInline(p.slice(4))}</h3>
                  : isList ? <ul className="list-disc list-inside space-y-1">{p.split("\n").map((line, j) => <li key={j}>{renderInline(line.replace(/^[-*]\s+/, ""))}</li>)}</ul>
                  : <p>{renderInline(p)}</p>}
                <aside className="my-6 flex gap-4 rounded-[8px] border p-4 transition hover:shadow-sm" style={{ borderColor: "var(--accent)", backgroundColor: "var(--bg-surface)" }}>
                  {midArticle.imageUrl && (
                    <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-[4px]">
                      <img src={midArticle.imageUrl} alt={midArticle.titleAr} className="h-full w-full object-cover" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="mb-1 text-[11px] font-semibold" style={{ color: "var(--accent)" }}>
                      اقرأ أيضاً · {midArticle.category.nameAr}
                    </p>
                    <a href={`/reviews/${midArticle.slug}`} className="text-sm font-bold leading-snug line-clamp-2 hover:underline" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
                      {midArticle.titleAr}
                    </a>
                    {midArticle.summary && (
                      <p className="mt-1 text-xs line-clamp-2" style={{ color: "var(--text-muted)" }}>{midArticle.summary}</p>
                    )}
                  </div>
                </aside>
              </div>
            );

            if (isH2) return <h2 key={i} className="mt-8 text-2xl font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>{renderInline(p.slice(3))}</h2>;
            if (isH3) return <h3 key={i} className="mt-6 text-xl font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>{renderInline(p.slice(4))}</h3>;
            if (isList) return (
              <ul key={i} className="list-disc list-inside space-y-1">
                {p.split("\n").map((line, j) => <li key={j}>{renderInline(line.replace(/^[-*]\s+/, ""))}</li>)}
              </ul>
            );
            return <p key={i}>{renderInline(p)}</p>;
          })}
        </div>

        <AdSlot position="article-bottom" className="mb-8" />

        {/* FAQ */}
        {faq.length > 0 && (
          <section className="mb-10" aria-label="أسئلة شائعة">
            <h2 className="mb-6 text-2xl font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>أسئلة شائعة</h2>
            <div className="space-y-3">
              {faq.map((item, i) => (
                <details key={i} className="group rounded-[6px] border transition" style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-surface)" }}>
                  <summary className="flex cursor-pointer items-center justify-between gap-4 px-5 py-4 font-semibold list-none marker:hidden" style={{ color: "var(--text-primary)" }}>
                    <span>{item.question}</span>
                    <svg className="h-5 w-5 shrink-0 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: "var(--accent)" }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </summary>
                  <p className="px-5 pb-4 leading-relaxed" style={{ color: "var(--text-secondary)" }}>{item.answer}</p>
                </details>
              ))}
            </div>
          </section>
        )}

        {/* Tags — only linked when the tag has enough reviews for its own /tag page */}
        {review.tags.length > 0 && (
          <div className="mb-8 flex flex-wrap gap-2">
            {review.tags.map((tag) => {
              const badgeClass = "rounded-[3px] border px-3 py-1 text-sm";
              const badgeStyle = { borderColor: "var(--border-medium)", color: "var(--text-muted)", backgroundColor: "var(--bg-subtle)" };
              return linkableTags.has(normalizeTag(tag)) ? (
                <Link key={tag} href={`/tag/${tagToSlug(tag)}`} className={`${badgeClass} transition-colors hover:opacity-75`} style={badgeStyle}>
                  #{tag}
                </Link>
              ) : (
                <span key={tag} className={badgeClass} style={badgeStyle}>#{tag}</span>
              );
            })}
          </div>
        )}

        {/* Share bar */}
        <div className="mb-8 flex items-center justify-between gap-4 rounded-[6px] border px-5 py-4" style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-surface)" }}>
          <p className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>أعجبك التقرير؟ شاركه مع أصدقائك</p>
          <ShareButtons url={reviewUrl} title={review.titleAr} />
        </div>

        {/* Sources */}
        {sources.length > 0 && (
          <div className="mb-8 rounded-[6px] border p-5" style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-surface)" }}>
            <p className="mb-3 text-sm font-bold" style={{ color: "var(--text-secondary)" }}>المصادر ({sources.length})</p>
            <ul className="space-y-2">
              {sources.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "var(--text-muted)" }}>{i + 1}.</span>
                  <div>
                    <a href={s.url} target="_blank" rel="noopener noreferrer" className="transition hover:underline" style={{ color: "var(--accent)" }}>{s.title}</a>
                    <span className="ml-2" style={{ color: "var(--text-muted)" }}>— {s.name}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Telegram CTA */}
        <div className="mb-8 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-[8px] px-6 py-5" style={{ background: "linear-gradient(135deg, #0088cc15, #0088cc08)", border: "1px solid #0088cc30" }}>
          <div className="flex items-center gap-3">
            <svg viewBox="0 0 24 24" className="h-9 w-9 shrink-0" fill="#0088cc"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L8.32 14.617l-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.828.942z"/></svg>
            <div>
              <p className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>تابع لوميك على تيليغرام</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>أخبار الذكاء الاصطناعي أولاً بأول</p>
            </div>
          </div>
          <a
            href="https://t.me/lumiq_news"
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 rounded-[6px] px-5 py-2.5 text-sm font-bold text-white transition hover:opacity-90"
            style={{ backgroundColor: "#0088cc" }}
          >
            انضم إلى القناة
          </a>
        </div>

        {/* Related Articles */}
        <RelatedArticles articles={relatedArticles} />

        {/* Author signature card */}
        {author && (
          <div className="mb-12 overflow-hidden rounded-[6px] border p-5" style={{ borderColor: `${author.accentColor}25`, backgroundColor: `${author.accentColor}08` }}>
            <div className="flex items-start gap-4">
              <Link href={`/author/${author.slug}`} className="shrink-0">
                <div className="h-14 w-14 overflow-hidden rounded-[6px]" style={{ outline: `2px solid ${author.accentColor}50`, outlineOffset: "2px" }}>
                  <img src={author.avatarUrl} alt={author.nameAr} className="h-full w-full object-cover" />
                </div>
              </Link>
              <div className="min-w-0 flex-1">
                <div className="mb-0.5 flex flex-wrap items-center gap-2">
                  <Link href={`/author/${author.slug}`} className="text-sm font-bold transition hover:opacity-75" style={{ color: "var(--text-primary)" }}>{author.nameAr}</Link>
                  <span className="rounded-[3px] border px-2 py-0.5 text-[10px] font-semibold" style={{ color: author.accentColor, borderColor: `${author.accentColor}40`, backgroundColor: `${author.accentColor}12` }}>
                    كاتب بالذكاء الاصطناعي
                  </span>
                </div>
                <p className="mb-1.5 text-xs" style={{ color: "var(--text-muted)" }}>{author.titleAr}</p>
                <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                  كُتب هذا التقرير بمساعدة {author.nameAr}، متخصص في {author.specialtyAr}، استناداً إلى {sources.length} مصدر موثوق مع مراجعة تحريرية.
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
