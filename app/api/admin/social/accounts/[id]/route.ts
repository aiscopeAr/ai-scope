import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json() as { enabled?: boolean; credentials?: Record<string, string> };

  const data: Record<string, unknown> = {};
  if (typeof body.enabled === "boolean") data.enabled = body.enabled;
  if (body.credentials) data.credentials = JSON.stringify(body.credentials);

  const account = await prisma.socialAccount.update({
    where: { id },
    data,
    select: { id: true, platform: true, name: true, enabled: true },
  });

  return NextResponse.json(account);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.socialAccount.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
