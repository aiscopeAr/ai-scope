import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const { name, slug, descriptionAr, website, logoUrl, country, founded, specialties, notableModels, published } = body;

  const company = await prisma.company.update({
    where: { id },
    data: {
      name,
      slug,
      descriptionAr,
      website: website ?? null,
      logoUrl: logoUrl ?? null,
      country: country ?? null,
      founded: founded ? Number(founded) : null,
      specialties: Array.isArray(specialties) ? specialties : [],
      notableModels: Array.isArray(notableModels) ? notableModels : [],
      published,
    },
  });

  return NextResponse.json(company);
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await prisma.company.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
