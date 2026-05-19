import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const guides = await prisma.guide.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(guides);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { title, slug, excerpt, content, category, difficulty, tags, readingTime, faq, published } = body;

  if (!title || !slug || !content || !excerpt) {
    return NextResponse.json({ error: "title, slug, excerpt, content مطلوبة" }, { status: 400 });
  }

  const existing = await prisma.guide.findUnique({ where: { slug } });
  if (existing) return NextResponse.json({ error: "slug مستخدم بالفعل" }, { status: 409 });

  const guide = await prisma.guide.create({
    data: {
      title,
      slug,
      excerpt,
      content,
      category: category ?? "beginner",
      difficulty: difficulty ?? "beginner",
      tags: Array.isArray(tags) ? tags : [],
      readingTime: readingTime ? Number(readingTime) : null,
      faq: Array.isArray(faq) && faq.length > 0 ? faq : undefined,
      published: published ?? true,
      publishedAt: new Date(),
    },
  });

  return NextResponse.json(guide, { status: 201 });
}
