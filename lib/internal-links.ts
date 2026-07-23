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
 * Fetches every slug an editorial [[type:slug|label]] token could point to,
 * cached per-request via React's `cache()` (passed in by the caller) so a
 * page with many links doesn't repeat five full-table scans.
 */
export async function loadLinkableSlugSets(
  prisma: import("@prisma/client").PrismaClient,
  linkableTags: Set<string>,
): Promise<LinkableSlugSets> {
  const [reviews, tools, comparisons, prompts, categories] = await Promise.all([
    prisma.review.findMany({ where: { published: true }, select: { slug: true } }),
    prisma.aITool.findMany({ where: { published: true }, select: { slug: true } }),
    prisma.comparison.findMany({ where: { published: true }, select: { slug: true } }),
    prisma.prompt.findMany({ where: { published: true }, select: { slug: true } }),
    prisma.category.findMany({ select: { slug: true } }),
  ]);

  return {
    review: new Set(reviews.map((r) => r.slug)),
    tool: new Set(tools.map((t) => t.slug)),
    compare: new Set(comparisons.map((c) => c.slug)),
    prompt: new Set(prompts.map((p) => p.slug)),
    category: new Set(categories.map((c) => c.slug)),
    tag: linkableTags,
  };
}
