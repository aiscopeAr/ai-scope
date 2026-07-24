/**
 * lib/editorial-engine/adapters/aiTool.ts
 */
import { INLINE_LINK_TOKEN, parseInternalLinkToken } from "@/lib/internal-links";
import type { EditorialLink, EditorialSubject } from "../types";

export interface AIToolForAdapter {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  descriptionAr: string;
  contentAr: string | null;
  website: string | null;
  pricing: string;
  arabicSupport: boolean;
  hasApi: boolean;
  seoTitle: string | null;
  seoDescription: string | null;
  faq: unknown;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastUpdated: Date | null;
}

function extractLinks(text: string): EditorialLink[] {
  const links: EditorialLink[] = [];
  for (const m of text.matchAll(INLINE_LINK_TOKEN)) {
    const parsed = parseInternalLinkToken(m);
    links.push({ type: parsed.type, slug: parsed.slug, label: parsed.label });
  }
  return links;
}

export function toEditorialSubject(t: AIToolForAdapter): EditorialSubject {
  const bodyText = `${t.descriptionAr}\n\n${t.contentAr ?? ""}`;
  return {
    kind: "aiTool",
    id: t.id,
    slug: t.slug,
    title: t.name,
    bodyText,
    published: t.published,
    seoTitle: t.seoTitle,
    seoDescription: t.seoDescription,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
    reviewedAt: t.lastUpdated, // AITool's existing lastUpdated field already means "we verified this is current" — reused, not duplicated
    outboundLinks: extractLinks(t.contentAr ?? ""),
    facts: {
      hasFaq: Array.isArray(t.faq) && t.faq.length > 0,
      hasBody: (t.contentAr ?? "").trim().length > 0,
      hasPricing: !!t.pricing,
      hasArabicSupportField: true, // always set (boolean, defaults false) — flagged separately by factual-completeness if descriptionAr contradicts it
      hasApiField: true,
      hasWebsite: !!t.website,
      hasTagline: !!t.tagline,
      hasDescription: t.descriptionAr.trim().length > 0,
    },
  };
}
