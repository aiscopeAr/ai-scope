import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { AD_POSITIONS, AD_TYPES, AD_FORMATS, AD_NETWORKS } from "@/lib/ads/positions";

export const dynamic = "force-dynamic";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  position: z.enum(AD_POSITIONS).optional(),
  type: z.enum(AD_TYPES).optional(),
  code: z.string().min(1).optional(),
  enabled: z.boolean().optional(),
  format: z.enum(AD_FORMATS).optional(),
  network: z.enum(AD_NETWORKS).optional(),
  dismissible: z.boolean().optional(),
  frequencyHours: z.number().int().min(0).max(24 * 30).optional(),
  priority: z.number().int().min(0).max(1000).optional(),
  startAt: z.coerce.date().nullish(),
  endAt: z.coerce.date().nullish(),
  pages: z.array(z.string()).optional(),
});

async function requireAdmin() {
  const session = await auth();
  if (!session || session.user?.role !== "admin") return null;
  return session;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  try {
    const ad = await prisma.adSlot.update({ where: { id }, data: parsed.data });
    return NextResponse.json(ad);
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  try {
    await prisma.adSlot.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
