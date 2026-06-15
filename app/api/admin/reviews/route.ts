import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const reviews = await prisma.review.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      titleAr: true,
      slug: true,
      authorSlug: true,
      published: true,
      publishedAt: true,
      viewCount: true,
      category: { select: { nameAr: true, slug: true } },
      createdAt: true,
    },
  });

  return NextResponse.json(reviews);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json() as {
    titleAr: string;
    summary: string;
    content: string;
    authorSlug: string;
    categoryId: string;
    slug: string;
    seoTitle?: string;
    seoDescription?: string;
    imageUrl?: string;
    imageAlt?: string;
    tags?: string[];
    keywords?: string[];
    published?: boolean;
  };

  if (!body.titleAr || !body.slug || !body.categoryId || !body.authorSlug) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const existing = await prisma.review.findUnique({ where: { slug: body.slug } });
  if (existing) return NextResponse.json({ error: "Slug already exists" }, { status: 409 });

  const review = await prisma.review.create({
    data: {
      title: body.titleAr,
      titleAr: body.titleAr,
      slug: body.slug,
      summary: body.summary || "",
      content: body.content || "",
      authorSlug: body.authorSlug,
      categoryId: body.categoryId,
      seoTitle: body.seoTitle || body.titleAr,
      seoDescription: body.seoDescription || body.summary || "",
      imageUrl: body.imageUrl || null,
      imageAlt: body.imageAlt || null,
      tags: body.tags ?? [],
      keywords: body.keywords ?? [],
      published: body.published ?? false,
      publishedAt: body.published ? new Date() : null,
    },
  });

  return NextResponse.json({ id: review.id, slug: review.slug });
}
