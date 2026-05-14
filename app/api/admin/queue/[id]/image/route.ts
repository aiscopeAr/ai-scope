import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generateArticleImage } from "@/lib/replicate";

async function requireAdmin() {
  const session = await auth();
  if (!session || session.user?.role !== "admin") return null;
  return session;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await requireAdmin()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json() as { imageUrl?: string; generate?: boolean };

  const item = await prisma.articleQueue.findUnique({ where: { id } });
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let imageUrl: string | null = null;

  if (body.generate) {
    const prompt = item.featuredImagePrompt ?? item.titleAr ?? item.rawTitle ?? "AI technology";
    imageUrl = await generateArticleImage(prompt);
    if (!imageUrl) return NextResponse.json({ error: "فشل توليد الصورة" }, { status: 500 });
  } else if (body.imageUrl) {
    imageUrl = body.imageUrl;
  } else {
    return NextResponse.json({ error: "imageUrl or generate required" }, { status: 400 });
  }

  await prisma.articleQueue.update({
    where: { id },
    data: { imageUrl },
  });

  return NextResponse.json({ ok: true, imageUrl });
}
