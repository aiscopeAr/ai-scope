import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const { name, slug, tagline, descriptionAr, website, logoUrl, category, pricing, pros, cons, useCases, published } = body;

  const tool = await prisma.aITool.update({
    where: { id },
    data: {
      name,
      slug,
      tagline: tagline ?? null,
      descriptionAr,
      website: website ?? null,
      logoUrl: logoUrl ?? null,
      category,
      pricing,
      pros: Array.isArray(pros) ? pros : [],
      cons: Array.isArray(cons) ? cons : [],
      useCases: Array.isArray(useCases) ? useCases : [],
      published,
    },
  });

  return NextResponse.json(tool);
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await prisma.aITool.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
