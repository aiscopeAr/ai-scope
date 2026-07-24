/**
 * lib/editorial-engine/adapters/review.ts
 */
import { INLINE_LINK_TOKEN, parseInternalLinkToken } from "@/lib/internal-links";
import type { EditorialLink, EditorialSubject } from "../types";

export interface ReviewForAdapter {
  id: string;
  slug: string;
  titleAr: string;
  summary: string;
  content: string;
  seoTitle: string | null;
  seoDescription: string | null;
  faq: unknown;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
}

function extractLinks(text: string): EditorialLink[] {
  const links: EditorialLink[] = [];
  for (const m of text.matchAll(INLINE_LINK_TOKEN)) {
    const parsed = parseInternalLinkToken(m);
    links.push({ type: parsed.type, slug: parsed.slug, label: parsed.label });
  }
  return links;
}

export function toEditorialSubject(r: ReviewForAdapter): EditorialSubject {
  const bodyText = `${r.summary}\n\n${r.content}`;
  return {
    kind: "review",
    id: r.id,
    slug: r.slug,
    title: r.titleAr,
    bodyText,
    published: r.published,
    seoTitle: r.seoTitle,
    seoDescription: r.seoDescription,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    reviewedAt: null, // Review has no distinct "editorially reviewed at" field today — see gap-table in the final report
    outboundLinks: extractLinks(r.content),
    facts: {
      hasFaq: Array.isArray(r.faq) && r.faq.length > 0,
      hasBody: r.content.trim().length > 0,
    },
  };
}
