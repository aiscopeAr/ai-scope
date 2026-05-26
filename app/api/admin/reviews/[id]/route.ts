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
    authorSlug?: string;
    tags?: string[];
    keywords?: string[];
    faq?: Array<{ question: string; answer: string }> | null;
    imageUrl?: string | null;
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
      ...(body.titleAr      !== undefined && { titleAr: body.titleAr }),
      ...(body.summary      !== undefined && { summary: body.summary }),
      ...(body.content      !== undefined && { content: body.content }),
      ...(body.slug         !== undefined && { slug: body.slug }),
      ...(body.authorSlug   !== undefined && { authorSlug: body.authorSlug }),
      ...(body.categoryId   !== undefined && { categoryId: body.categoryId }),
      ...(body.tags         !== undefined && { tags: body.tags }),
      ...(body.keywords     !== undefined && { keywords: body.keywords }),
      ...(body.faq          !== undefined && { faq: body.faq ?? undefined }),
      ...(body.imageUrl     !== undefined && { imageUrl: body.imageUrl }),
      ...(body.imageAlt     !== undefined && { imageAlt: body.imageAlt }),
      ...(body.seoTitle     !== undefined && { seoTitle: body.seoTitle }),
      ...(body.seoDescription !== undefined && { seoDescription: body.seoDescription }),
      ...(body.published    !== undefined && { published: body.published }),
      ...(body.published && !wasPublished  && { publishedAt: new Date() }),
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
