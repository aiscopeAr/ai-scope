/**
 * lib/editorial-engine/adapters/prompt.ts
 */
import type { EditorialSubject } from "../types";

export interface PromptForAdapter {
  id: string;
  slug: string;
  titleAr: string;
  description: string | null;
  body: string;
  toolId: string | null;
  tool: { published: boolean } | null;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export function toEditorialSubject(p: PromptForAdapter): EditorialSubject {
  const bodyText = `${p.description ?? ""}\n\n${p.body}`;
  return {
    kind: "prompt",
    id: p.id,
    slug: p.slug,
    title: p.titleAr,
    bodyText,
    published: p.published,
    seoTitle: null, // Prompt has no dedicated SEO fields today — see gap-table
    seoDescription: p.description,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
    reviewedAt: null,
    outboundLinks: [], // prompts are copy-paste content — Sprint 4 deliberately excluded them from the [[...]] system
    facts: {
      hasDescription: !!p.description && p.description.trim().length > 0,
      hasBody: p.body.trim().length > 0,
      linkedToolPublished: p.toolId ? (p.tool?.published ?? false) : undefined,
    },
  };
}
