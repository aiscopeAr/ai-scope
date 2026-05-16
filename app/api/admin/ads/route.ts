import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

export const dynamic = "force-dynamic";

const adSlotSchema = z.object({
  name: z.string().min(1),
  position: z.enum(["header", "article-top", "article-mid", "article-bottom", "sidebar", "homepage-top", "homepage-mid", "category-top"]),
  type: z.enum(["script", "image", "iframe"]).default("script"),
  code: z.string().min(1),
  enabled: z.boolean().default(true),
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
