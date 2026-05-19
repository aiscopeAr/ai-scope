import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const { title, slug, excerpt, content, category, difficulty, tags, readingTime, faq, published } = body;

  const guide = await prisma.guide.update({
    where: { id },
    data: {
      title,
      slug,
      excerpt,
      content,
      category,
      difficulty,
      tags: Array.isArray(tags) ? tags : [],
      readingTime: readingTime ? Number(readingTime) : null,
      faq: Array.isArray(faq) && faq.length > 0 ? faq : undefined,
      published: published ?? true,
    },
  });

  return NextResponse.json(guide);
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await prisma.guide.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
