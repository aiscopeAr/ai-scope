import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { AD_POSITIONS, AD_TYPES, AD_FORMATS, AD_NETWORKS } from "@/lib/ads/positions";

export const dynamic = "force-dynamic";

const adSlotSchema = z.object({
  name: z.string().min(1),
  position: z.enum(AD_POSITIONS),
  type: z.enum(AD_TYPES).default("script"),
  code: z.string().min(1),
  enabled: z.boolean().default(true),
  format: z.enum(AD_FORMATS).default("inline"),
  network: z.enum(AD_NETWORKS).default("direct"),
  dismissible: z.boolean().default(false),
  frequencyHours: z.number().int().min(0).max(24 * 30).default(0),
  priority: z.number().int().min(0).max(1000).default(0),
  startAt: z.coerce.date().nullish(),
  endAt: z.coerce.date().nullish(),
  pages: z.array(z.string()).default([]),
});

async function requireAdmin() {
  const session = await auth();
  if (!session || session.user?.role !== "admin") return null;
  return session;
}

export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ads = await prisma.adSlot.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(ads);
}

export async function POST(request: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = adSlotSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const ad = await prisma.adSlot.create({ data: parsed.data });
  return NextResponse.json(ad, { status: 201 });
}
