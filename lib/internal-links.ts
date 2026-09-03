/**
 * lib/internal-links.ts
 *
 * Editorial internal linking (Growth Sprint 3, Phase 1).
 *
 * Editors (or generation prompts) write links inline in article/tool body
 * text using a plain-text token:
 *
 *   [[review:gemini-vs-gpt5|قارن بين Gemini وGPT-5]]
 *   [[tool:notion-ai|Notion AI]]
 *   [[compare:chatgpt-vs-claude|شاهد المقارنة الكاملة]]
 *   [[prompt:daily-standup-summary|برومبت جاهز]]
 *   [[category:ai-models|جميع تقارير النماذج]]
 *   [[tag:نماذج-لغوية|كل الوسوم ذات الصلة]]
 *
 * INLINE_LINK_TOKEN is exported so page components can add it as one more
 * alternative in their existing paragraph-splitting regex (e.g. the
 * `renderInline` split in the reviews page) — this is not a replacement
 * content pipeline, it's one more recognized token in the pipeline that
 * already exists.
 */

import { unstable_cache } from "next/cache";
import { prisma as db } from "@/lib/db";
import { CACHE_TAGS, DEFAULT_REVALIDATE_SECONDS } from "@/lib/cache";

export type InternalLinkType = "review" | "tool" | "compare" | "prompt" | "category" | "tag";

const TYPE_PATH: Record<InternalLinkType, string> = {
  review: "/reviews",
  tool: "/ai-tools",
  compare: "/compare",
  prompt: "/prompts",
  category: "/category",
  tag: "/tag",
};

/** Matches [[type:slug|label]]. Capture groups: 1=type, 2=slug, 3=label. */
export const INLINE_LINK_TOKEN =
  /\[\[(review|tool|compare|prompt|category|tag):([^\]|]+)\|([^\]]+)\]\]/g;

export interface ParsedInternalLink {
  type: InternalLinkType;
  slug: string;
  label: string;
  href: string;
}

export function parseInternalLinkToken(match: RegExpMatchArray): ParsedInternalLink {
  const [, type, slug, label] = match as unknown as [string, InternalLinkType, string, string];
  return { type, slug, label, href: `${TYPE_PATH[type]}/${slug}` };
}

/**
 * A resolvable-target set, fetched once per page render and passed to the
 * renderer so an editor typo or a since-unpublished target degrades to
 * plain text instead of a dead link.
 */
export interface LinkableSlugSets {
  review: Set<string>;
  tool: Set<string>;
  compare: Set<string>;
  prompt: Set<string>;
  category: Set<string>;
  tag: Set<string>;
}

export function isLinkTargetValid(link: ParsedInternalLink, sets: LinkableSlugSets): boolean {
  return sets[link.type].has(link.slug);
}

/**
 * The five slug lists an editorial [[type:slug|label]] token can point to,
 * cached across requests via unstable_cache so review/tool regenerations
 * don't each repeat five full-table scans against Neon (audit Sprint 1A).
 *
 * unstable_cache serializes its result as JSON, so this returns plain arrays;
 * loadLinkableSlugSets() rebuilds the Sets. Tagged with every content type it
 * reads, so publishing a review/tool/prompt (which already call
 * revalidateNow(CACHE_TAGS.*)) refreshes it immediately; comparisons and
 * categories, which have no on-demand invalidation, fall back to the
 * conservative time-based revalidate below.
 */
const getLinkableSlugArrays = unstable_cache(
  async () => {
    const [reviews, tools, comparisons, prompts, categories] = await Promise.all([
      db.review.findMany({ where: { published: true }, select: { slug: true } }),
      db.aITool.findMany({ where: { published: true }, select: { slug: true } }),
      db.comparison.findMany({ where: { published: true }, select: { slug: true } }),
      db.prompt.findMany({ where: { published: true }, select: { slug: true } }),
      db.category.findMany({ select: { slug: true } }),
    ]);

    return {
      review: reviews.map((r) => r.slug),
      tool: tools.map((t) => t.slug),
      compare: comparisons.map((c) => c.slug),
      prompt: prompts.map((p) => p.slug),
      category: categories.map((c) => c.slug),
    };
  },
  ["linkable-slug-sets"],
  {
    tags: [
      CACHE_TAGS.reviews,
      CACHE_TAGS.aiTools,
      CACHE_TAGS.comparisons,
      CACHE_TAGS.prompts,
      CACHE_TAGS.categories,
    ],
    revalidate: DEFAULT_REVALIDATE_SECONDS,
  },
);

/**
 * Fetches every slug an editorial [[type:slug|label]] token could point to.
 * Backed by getLinkableSlugArrays()'s unstable_cache so a page with many links
 * doesn't repeat five full-table scans. The `prisma` argument is retained for
 * call-site compatibility; the cached loader uses the shared singleton.
 */
export async function loadLinkableSlugSets(
  prisma: import("@prisma/client").PrismaClient,
  linkableTags: Set<string>,
): Promise<LinkableSlugSets> {
  void prisma;
  const arrays = await getLinkableSlugArrays();

  return {
    review: new Set(arrays.review),
    tool: new Set(arrays.tool),
    compare: new Set(arrays.compare),
    prompt: new Set(arrays.prompt),
    category: new Set(arrays.category),
    tag: linkableTags,
  };
}
