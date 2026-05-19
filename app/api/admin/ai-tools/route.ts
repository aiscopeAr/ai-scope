import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tools = await prisma.aITool.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(tools);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { name, slug, tagline, descriptionAr, website, logoUrl, category, pricing, pros, cons, useCases, published } = body;

  if (!name || !slug || !descriptionAr) {
    return NextResponse.json({ error: "name, slug, descriptionAr مطلوبة" }, { status: 400 });
  }

  const existing = await prisma.aITool.findUnique({ where: { slug } });
  if (existing) return NextResponse.json({ error: "slug مستخدم بالفعل" }, { status: 409 });

  const tool = await prisma.aITool.create({
    data: {
      name,
      slug,
      tagline: tagline ?? null,
      descriptionAr,
      website: website ?? null,
      logoUrl: logoUrl ?? null,
      category: category ?? "other",
      pricing: pricing ?? "freemium",
      pros: Array.isArray(pros) ? pros : [],
      cons: Array.isArray(cons) ? cons : [],
      useCases: Array.isArray(useCases) ? useCases : [],
      published: published ?? true,
    },
  });

  return NextResponse.json(tool, { status: 201 });
}
