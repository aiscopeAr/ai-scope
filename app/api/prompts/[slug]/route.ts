import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const prompt = await prisma.prompt.findUnique({
    where: { slug },
    include: { category: true, aiModel: true },
  });

  if (!prompt || !prompt.published) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.prompt.update({
    where: { id: prompt.id },
    data: { viewCount: { increment: 1 } },
  });

  return NextResponse.json(prompt);
}
