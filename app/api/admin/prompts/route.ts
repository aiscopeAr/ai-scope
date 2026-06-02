import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

async function requireAdmin() {
  const session = await auth();
  if (!session) return null;
  return session;
}

export async function GET(request: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const toolId = searchParams.get("toolId");
  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const limit = 50;

  const where = {
    ...(category ? { category } : {}),
    ...(toolId ? { toolId } : {}),
  };

  const [prompts, total] = await Promise.all([
    prisma.prompt.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: { tool: { select: { id: true, name: true, slug: true, logoUrl: true } } },
    }),
    prisma.prompt.count({ where }),
  ]);

  return NextResponse.json({ prompts, total, page, pages: Math.ceil(total / limit) });
}

export async function POST(request: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { title, titleAr, body: promptBody, description, category, toolId, tags, slug, featured, published } = body;

  if (!title || !titleAr || !promptBody || !category || !slug)
    return NextResponse.json({ error: "title, titleAr, body, category, slug required" }, { status: 400 });

  const existing = await prisma.prompt.findUnique({ where: { slug } });
  if (existing) return NextResponse.json({ error: "Slug already used" }, { status: 409 });

  const prompt = await prisma.prompt.create({
    data: {
      title,
      titleAr,
      body: promptBody,
      description: description ?? null,
      category,
      toolId: toolId ?? null,
      tags: Array.isArray(tags) ? tags : [],
      slug,
      featured: featured ?? false,
      published: published ?? true,
    },
  });

  return NextResponse.json(prompt, { status: 201 });
}
