import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { generateToolContent } from "@/lib/tools-ingestion";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const tool = await prisma.aITool.findUnique({ where: { id } });
  if (!tool) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const content = await generateToolContent({
    name: tool.name,
    website: tool.website ?? "",
    tagline: tool.tagline ?? undefined,
    rawDescription: tool.descriptionAr, // use existing Arabic as base
    pricing: tool.pricing,
    monthlyPrice: tool.monthlyPrice ?? undefined,
    sourceUrl: tool.sourceUrl ?? "",
    sourceName: "manual",
    tags: tool.tags,
  });

  if (!content) return NextResponse.json({ error: "AI generation failed" }, { status: 500 });

  const updated = await prisma.aITool.update({
    where: { id },
    data: {
      descriptionAr: content.descriptionAr,
      contentAr: content.contentAr,
      pros: content.pros,
      cons: content.cons,
      useCases: content.useCases,
      tags: content.tags,
      toolCategory: content.toolCategory,
      seoTitle: content.seoTitle,
      seoDescription: content.seoDescription,
      imageAlt: content.imageAlt,
      faq: content.faq.length > 0 ? content.faq : undefined,
      relatedTopics: content.relatedTopics,
      arabicSupport: content.arabicSupport,
      hasApi: content.hasApi,
    },
  });

  return NextResponse.json({ ok: true, slug: updated.slug });
}
