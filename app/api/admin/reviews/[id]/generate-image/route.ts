import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generateReviewImage } from "@/lib/images";

export const maxDuration = 120;

function newCorrelationId(): string {
  return `img_${randomBytes(6).toString("hex")}`;
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { prompt } = await req.json() as { prompt?: string };

  if (!prompt?.trim()) {
    return NextResponse.json({ error: "prompt is required" }, { status: 400 });
  }

  const correlationId = newCorrelationId();

  const imageUrl = await generateReviewImage(prompt, { correlationId, reviewId: id });
  if (!imageUrl) {
    return NextResponse.json(
      { error: "فشل في توليد الصورة. تم تسجيل رمز التتبع للتشخيص.", correlationId },
      { status: 500 },
    );
  }

  // Persist the new image URL on the review
  await prisma.review.update({
    where: { id },
    data: { imageUrl },
  });

  return NextResponse.json({ imageUrl, correlationId });
}
