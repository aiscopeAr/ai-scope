import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json() as { status?: string; caption?: string };

  // Admin retry action for a terminal "failed" post: resets it back to
  // "approved" with retry state cleared so the existing cron re-claims it
  // on its next run — this reuses the same row rather than creating a new
  // SocialPost, so it cannot produce a duplicate post for the same review.
  if (body.status === "approved") {
    const existing = await prisma.socialPost.findUnique({ where: { id }, select: { status: true } });
    if (existing?.status === "failed") {
      const post = await prisma.socialPost.update({
        where: { id },
        data: {
          status: "approved",
          errorMsg: null,
          attemptCount: 0,
          nextAttemptAt: null,
          sendingAt: null,
        },
        select: { id: true, status: true },
      });
      return NextResponse.json(post);
    }
  }

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
