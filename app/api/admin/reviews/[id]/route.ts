import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { embedReview } from "@/lib/embeddings";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const review = await prisma.review.findUnique({
    where: { id },
    include: { category: true },
  });
  if (!review) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(review);
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json() as {
    titleAr?: string;
    summary?: string;
    content?: string;
    slug?: string;
    categoryId?: string;
    tags?: string[];
    keywords?: string[];
    imageUrl?: string;
    imageAlt?: string;
    seoTitle?: string;
    seoDescription?: string;
    published?: boolean;
  };

  const wasPublished = (
    await prisma.review.findUnique({ where: { id }, select: { published: true } })
  )?.published;

  const review = await prisma.review.update({
    where: { id },
    data: {
      ...body,
      publishedAt:
        body.published && !wasPublished ? new Date() : undefined,
    },
  });

  // Re-embed if content changed
  if (body.content || body.titleAr || body.summary) {
    embedReview(id).catch(() => {});
  }

  return NextResponse.json(review);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await prisma.review.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
