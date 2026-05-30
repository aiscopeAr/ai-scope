import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { SITE_NAME } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug") ?? "";

  if (!slug) {
    return NextResponse.json({ title: SITE_NAME, category: "ذكاء اصطناعي", summary: "", imageUrl: null });
  }

  try {
    const review = await prisma.review.findUnique({
      where: { slug },
      select: {
        titleAr: true,
        summary: true,
        imageUrl: true,
        category: { select: { nameAr: true } },
      },
    });

    if (!review) {
      return NextResponse.json({ title: SITE_NAME, category: "ذكاء اصطناعي", summary: "", imageUrl: null });
    }

    return NextResponse.json({
      title: review.titleAr,
      category: review.category?.nameAr ?? "ذكاء اصطناعي",
      summary: review.summary?.slice(0, 130) ?? "",
      imageUrl: review.imageUrl ?? null,
    });
  } catch {
    return NextResponse.json({ title: SITE_NAME, category: "ذكاء اصطناعي", summary: "", imageUrl: null });
  }
}
