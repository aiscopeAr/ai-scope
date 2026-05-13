import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { articleSchema } from "@/lib/validations/article";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

async function requireAdmin() {
  const session = await auth();
  if (!session || session.user?.role !== "admin") return null;
  return session;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAdmin();
  if (!session) return unauthorized();

  const { id } = await params;

  const article = await prisma.article.findUnique({
    where: { id },
    include: { category: true },
  });

  if (!article) {
    return NextResponse.json({ error: "المقال غير موجود" }, { status: 404 });
  }

  return NextResponse.json(article);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAdmin();
  if (!session) return unauthorized();

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = articleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const existing = await prisma.article.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "المقال غير موجود" }, { status: 404 });
  }

  const slugConflict = await prisma.article.findFirst({
    where: { slug: parsed.data.slug, NOT: { id } },
  });
  if (slugConflict) {
    return NextResponse.json({ error: "الرابط المختصر مستخدم بالفعل" }, { status: 409 });
  }

  const { imageUrl, publishedAt, score, ...rest } = parsed.data;

  const article = await prisma.article.update({
    where: { id },
    data: {
      ...rest,
      imageUrl: imageUrl || null,
      score: score ?? existing.score,
      publishedAt: publishedAt
        ? new Date(publishedAt)
        : rest.published && !existing.publishedAt
          ? new Date()
          : existing.publishedAt,
    },
    include: { category: true },
  });

  return NextResponse.json(article);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAdmin();
  if (!session) return unauthorized();

  const { id } = await params;

  const existing = await prisma.article.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "المقال غير موجود" }, { status: 404 });
  }

  await prisma.article.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
