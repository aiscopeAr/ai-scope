import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

async function requireAdmin() {
  const session = await auth();
  if (!session) return null;
  return session;
}

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const tools = await prisma.aITool.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(tools);
}

export async function POST(request: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const {
    name, slug, tagline, descriptionAr, contentAr, website, logoUrl, screenshots,
    toolCategory, pricing, monthlyPrice, pricingDetails,
    pros, cons, useCases, arabicSupport, hasApi, tags,
    faq, seoTitle, seoDescription, imageAlt, relatedTopics,
    featured, editorPick, published, releaseDate, sourceUrl,
  } = body;

  if (!name || !slug || !descriptionAr)
    return NextResponse.json({ error: "name, slug, descriptionAr required" }, { status: 400 });

  const existing = await prisma.aITool.findUnique({ where: { slug } });
  if (existing) return NextResponse.json({ error: "Slug already used" }, { status: 409 });

  const tool = await prisma.aITool.create({
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
      pricing: pricing ?? "freemium",
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
    },
  });

  return NextResponse.json(tool, { status: 201 });
}
