import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { SITE_URL, SITE_NAME, SITE_NAME_AR, SITE_DESCRIPTION_AR } from "@/lib/seo";

// DIAGNOSTIC VARIANT G — revert to revalidate=60 (ISR) with the same minimal body, to close the causal loop (Variant F proved dynamic rendering = clean).
export const revalidate = 60;

export const metadata: Metadata = {
  title: `${SITE_NAME} — ${SITE_NAME_AR}`,
  description: SITE_DESCRIPTION_AR,
  alternates: { canonical: SITE_URL },
  openGraph: {
    url: SITE_URL,
    title: `${SITE_NAME} — ${SITE_NAME_AR}`,
    description: SITE_DESCRIPTION_AR,
    type: "website",
  },
};

async function getData() {
  try {
    const [featuredReview, latestReviews, featuredTools, toolOfWeek, latestComparisons, featuredPrompts, tutorialReviews] = await Promise.all([
      prisma.review.findFirst({
        where: { published: true, category: { slug: { not: "tutorials" } } },
        orderBy: { publishedAt: "desc" },
        include: { category: true },
      }),
      prisma.review.findMany({
        where: { published: true, category: { slug: { not: "tutorials" } } },
        orderBy: { publishedAt: "desc" },
        skip: 1,
        take: 8,
        include: { category: true },
      }),
      prisma.aITool.findMany({
        where: { published: true },
        orderBy: [{ featured: "desc" }, { viewCount: "desc" }],
        take: 6,
      }),
      prisma.aITool.findFirst({
        where: { published: true, editorPick: true },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.comparison.findMany({
        where: { published: true },
        orderBy: { updatedAt: "desc" },
        take: 3,
        include: {
          sides: {
            include: { tool: { select: { name: true, logoUrl: true, slug: true } } },
          },
        },
      }),
      prisma.prompt.findMany({
        where: { published: true },
        orderBy: [{ featured: "desc" }, { viewCount: "desc" }],
        take: 6,
        select: {
          id: true, slug: true, titleAr: true, description: true,
          category: true, featured: true,
          tool: { select: { name: true, slug: true, logoUrl: true } },
        },
      }),
      prisma.review.findMany({
        where: { published: true, category: { slug: "tutorials" } },
        orderBy: { publishedAt: "desc" },
        take: 4,
        select: {
          id: true, slug: true, titleAr: true, summary: true,
          imageUrl: true, publishedAt: true, tags: true,
          category: { select: { nameAr: true, slug: true } },
        },
      }),
    ]);
    return { featuredReview, latestReviews, featuredTools, toolOfWeek, latestComparisons, featuredPrompts, tutorialReviews };
  } catch {
    return { featuredReview: null, latestReviews: [], featuredTools: [], toolOfWeek: null, latestComparisons: [], featuredPrompts: [], tutorialReviews: [] };
  }
}

export default async function HomePage() {
  // DIAGNOSTIC VARIANT G — revert-to-ISR proof step, same minimal body as Variant E/F. Not for merge.
  await getData();

  return (
    <main className="container mx-auto max-w-6xl px-4 py-10 md:px-6" dir="rtl">
      <h1
        className="mb-6 text-sm font-semibold tracking-wide sm:mb-8"
        style={{ color: "var(--text-muted)" }}
      >
        Lumiq — أخبار وأدوات الذكاء الاصطناعي بالعربية
      </h1>
      <div className="h-64 rounded-[10px]" style={{ backgroundColor: "var(--bg-surface)" }}>
        DIAGNOSTIC PLACEHOLDER E — entire homepage body minimized
      </div>
    </main>
  );
}
