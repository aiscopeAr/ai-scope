import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { approveReview, rejectReview, resetReviewForRetry } from "@/lib/review-queue";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const item = await prisma.reviewQueue.findUnique({
    where: { id },
    include: { newsItems: true },
  });
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(item);
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json() as {
    action: "approve" | "reject" | "retry" | "update";
    categoryId?: string;
    slug?: string;
    published?: boolean;
    imageUrl?: string;
    // editable fields
    titleAr?: string;
    contentAr?: string;
    summaryAr?: string;
    tags?: string[];
    seoTitle?: string;
    seoDescription?: string;
  };

  if (body.action === "approve") {
    if (!body.categoryId || !body.slug) {
      return NextResponse.json({ error: "categoryId and slug required" }, { status: 400 });
    }
    const reviewId = await approveReview(id, {
      categoryId: body.categoryId,
      slug: body.slug,
      published: body.published ?? false,
      imageUrl: body.imageUrl,
    });
    return NextResponse.json({ ok: true, reviewId });
  }

  if (body.action === "reject") {
    await rejectReview(id);
    return NextResponse.json({ ok: true });
  }

  if (body.action === "retry") {
    await resetReviewForRetry(id);
    return NextResponse.json({ ok: true });
  }

  if (body.action === "update") {
    await prisma.reviewQueue.update({
      where: { id },
      data: {
        titleAr: body.titleAr,
        contentAr: body.contentAr,
        summaryAr: body.summaryAr,
        tags: body.tags,
        seoTitle: body.seoTitle,
        seoDescription: body.seoDescription,
      },
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await prisma.reviewQueue.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
