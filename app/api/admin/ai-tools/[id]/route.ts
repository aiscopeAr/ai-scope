import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { CACHE_TAGS, revalidateNow } from "@/lib/cache";

export const dynamic = "force-dynamic";

async function requireAdmin() {
  const session = await auth();
  return session ? session : null;
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const tool = await prisma.aITool.findUnique({ where: { id } });
  if (!tool) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(tool);
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const {
    name, slug, tagline, descriptionAr, contentAr, website, logoUrl, screenshots,
    toolCategory, pricing, monthlyPrice, pricingDetails,
    pros, cons, useCases, arabicSupport, hasApi, tags,
    faq, seoTitle, seoDescription, imageAlt, relatedTopics,
    featured, editorPick, published, releaseDate, sourceUrl,
  } = body;

  const tool = await prisma.aITool.update({
    where: { id },
    data: {
      name, slug,
      tagline: tagline ?? null,
      descriptionAr,
      contentAr: contentAr ?? null,
      website: website ?? null,
      logoUrl: logoUrl ?? null,
      screenshots: Array.isArray(screenshots) ? screenshots : [],
      toolCategory: toolCategory ?? "other",
      category: toolCategory ?? "other",
      pricing,
      monthlyPrice: monthlyPrice ? Number(monthlyPrice) : null,
      pricingDetails: pricingDetails ?? null,
      pros: Array.isArray(pros) ? pros : [],
      cons: Array.isArray(cons) ? cons : [],
      useCases: Array.isArray(useCases) ? useCases : [],
      arabicSupport: arabicSupport ?? false,
      hasApi: hasApi ?? false,
      tags: Array.isArray(tags) ? tags : [],
      faq: Array.isArray(faq) && faq.length > 0 ? faq : undefined,
      seoTitle: seoTitle ?? null,
      seoDescription: seoDescription ?? null,
      imageAlt: imageAlt ?? null,
      relatedTopics: Array.isArray(relatedTopics) ? relatedTopics : [],
      featured: featured ?? false,
      editorPick: editorPick ?? false,
      published: published ?? true,
      releaseDate: releaseDate ? new Date(releaseDate) : null,
      sourceUrl: sourceUrl ?? null,
      featuredAt: featured ? new Date() : null,
    },
  });

  revalidateNow(CACHE_TAGS.aiTools);

  return NextResponse.json(tool);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await prisma.aITool.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
