import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  await prisma.prompt.update({
    where: { slug },
    data: { copyCount: { increment: 1 } },
  });

  return NextResponse.json({ ok: true });
}
