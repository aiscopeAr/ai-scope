import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";

import { prisma } from "@/lib/db";
import { AUTHORS, type AuthorSlug } from "@/lib/authors";
import { SITE_NAME, SITE_NAME_AR, SITE_URL, SITE_TWITTER_HANDLE, absoluteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  return Object.keys(AUTHORS).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const author = AUTHORS[slug as AuthorSlug];
  if (!author) return {};
  const url = absoluteUrl(`/author/${slug}`);
  const avatarAbsolute = author.avatarUrl.startsWith("http") ? author.avatarUrl : `${SITE_URL}${author.avatarUrl}`;
  return {
    title: `${author.nameAr} — ${author.titleAr} | ${SITE_NAME_AR}`,
    description: author.bioAr,
    alternates: { canonical: url },
    robots: { index: true, follow: true },
    openGraph: {
      type: "profile",
      url,
      title: `${author.nameAr} — ${author.titleAr} | ${SITE_NAME_AR}`,
      description: author.bioAr,
      locale: "ar_AR",
      siteName: SITE_NAME,
      images: [{ url: avatarAbsolute, width: 200, height: 200, alt: author.nameAr }],
    },
    twitter: {
      card: "summary",
      site: SITE_TWITTER_HANDLE,
      title: `${author.nameAr} — ${author.titleAr}`,
      description: author.bioAr,
      images: [avatarAbsolute],
    },
  };
}

export default async function AuthorPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const author = AUTHORS[slug as AuthorSlug];
  if (!author) notFound();

  const authorUrl = absoluteUrl(`/author/${slug}`);
  const avatarAbsolute = author.avatarUrl.startsWith("http") ? author.avatarUrl : `${SITE_URL}${author.avatarUrl}`;
  const personJsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": authorUrl,
    name: author.nameAr,
    jobTitle: author.titleAr,
    url: authorUrl,
    image: { "@type": "ImageObject", url: avatarAbsolute, width: 200, height: 200 },
    description: author.bioAr,
    knowsAbout: author.specialtyAr,
    worksFor: { "@type": "Organization", "@id": `${SITE_URL}/#organization`, name: SITE_NAME },
    sameAs: author.socialTwitter ? [author.socialTwitter] : [],
  };

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
    <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }} />
    <div className="min-h-screen" dir="rtl">
      {/* Hero */}
      <section className="border-b py-16" style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-subtle)" }}>
        <div className="container mx-auto max-w-4xl px-4">
          <div className="flex flex-col items-center gap-8 sm:flex-row sm:items-start">
            <div className="relative shrink-0">
              <div className="h-28 w-28 overflow-hidden rounded-[6px]" style={{ outline: `3px solid ${author.accentColor}`, outlineOffset: "3px" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={author.avatarUrl} alt={author.nameAr} width={112} height={112} className="h-full w-full object-cover" />
              </div>
              <span className="absolute -bottom-1 -left-1 rounded-[3px] border px-2 py-0.5 text-[10px] font-bold"
                style={{ backgroundColor: "var(--bg-surface)", borderColor: `${author.accentColor}40`, color: author.accentColor }}>AI</span>
            </div>

            <div className="flex-1 text-center sm:text-right">
              <div className="mb-1 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                <h1 className="text-3xl font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>{author.nameAr}</h1>
                <span className="rounded-[3px] border px-3 py-0.5 text-xs font-semibold"
                  style={{ color: author.accentColor, borderColor: `${author.accentColor}40`, backgroundColor: `${author.accentColor}12` }}>
                  كاتب بالذكاء الاصطناعي
                </span>
              </div>
              <p className="mb-4 text-sm font-medium" style={{ color: "var(--text-secondary)" }}>{author.titleAr}</p>
              <p className="mb-5 max-w-xl leading-relaxed" style={{ color: "var(--text-primary)" }}>{author.bioAr}</p>

              <div className="flex flex-wrap items-center justify-center gap-4 sm:justify-start">
                <div className="text-center">
                  <p className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>{totalCount}</p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>تقرير</p>
                </div>
                <div className="h-8 w-px" style={{ backgroundColor: "var(--border-medium)" }} />
                <div className="text-center">
                  <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{author.specialtyAr}</p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>التخصص</p>
                </div>
                {author.socialTwitter && (
                  <>
                    <div className="h-8 w-px" style={{ backgroundColor: "var(--border-medium)" }} />
                    <a href={author.socialTwitter} target="_blank" rel="noopener noreferrer"
                      className="link-secondary flex items-center gap-1.5 text-sm transition">
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
          <div className="mt-10 rounded-[6px] border p-5" style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-surface)" }}>
            <h2 className="mb-3 text-sm font-bold" style={{ color: "var(--text-secondary)" }}>أسلوب الكتابة</h2>
            <ul className="space-y-1.5">
              {author.voiceTraits.map((trait, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm" style={{ color: "var(--text-secondary)" }}>
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
        <h2 className="mb-6 text-xl font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
          تقارير {author.nameAr}
          {totalCount > 0 && <span className="mr-2 text-base font-normal" style={{ color: "var(--text-muted)" }}>({totalCount})</span>}
        </h2>

        {reviews.length === 0 ? (
          <p style={{ color: "var(--text-muted)" }}>لا توجد تقارير بعد.</p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {reviews.map((r) => {
              const timeAgo = r.publishedAt
                ? formatDistanceToNow(new Date(r.publishedAt), { addSuffix: true, locale: ar })
                : null;
              return (
                <Link key={r.id} href={`/reviews/${r.slug}`}
                  className="card-hover "
                  style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-surface)" }}
                >
                  <div className="relative h-44 w-full shrink-0" style={{ backgroundColor: "var(--bg-subtle)" }}>
                    {r.imageUrl ? (
                      <Image src={r.imageUrl} alt={r.titleAr} fill className="object-cover transition-transform duration-500 group-hover:scale-105" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" style={{ stroke: "var(--border-medium)" }}>
                          <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>
                        </svg>
                      </div>
                    )}
                    <div className="absolute bottom-2 end-2">
                      <span className="rounded-[3px] px-2 py-0.5 text-[11px] font-medium"
                        style={{ backgroundColor: "var(--bg-surface)", color: "var(--accent)", border: "1px solid var(--border-subtle)" }}>
                        {r.category.nameAr}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col p-4">
                    <h3 className="mb-2 line-clamp-2 flex-1 text-sm font-bold leading-snug transition-opacity group-hover:opacity-75"
                      style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>{r.titleAr}</h3>
                    <p className="mb-3 line-clamp-2 text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>{r.summary}</p>
                    {timeAgo && <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>{timeAgo}</p>}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
    </>
  );
}
