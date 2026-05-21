import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  try {
    await prisma.review.update({
      where: { slug },
      data: { viewCount: { increment: 1 } },
    });
  } catch {
    // article not found — ignore silently
  }

  return NextResponse.json({ ok: true });
}
