import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const companies = await prisma.company.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(companies);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { name, slug, descriptionAr, website, logoUrl, country, founded, specialties, notableModels, published } = body;

  if (!name || !slug || !descriptionAr) {
    return NextResponse.json({ error: "name, slug, descriptionAr مطلوبة" }, { status: 400 });
  }

  const existing = await prisma.company.findUnique({ where: { slug } });
  if (existing) return NextResponse.json({ error: "slug مستخدم بالفعل" }, { status: 409 });

  const company = await prisma.company.create({
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
      published: published ?? true,
    },
  });

  return NextResponse.json(company, { status: 201 });
}
