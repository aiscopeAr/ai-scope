import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json() as { status?: string; caption?: string };

  const data: Record<string, unknown> = {};
  if (body.status) data.status = body.status;
  if (body.caption) data.caption = body.caption;

  const post = await prisma.socialPost.update({
    where: { id },
    data,
    select: { id: true, status: true },
  });

  return NextResponse.json(post);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.socialPost.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
