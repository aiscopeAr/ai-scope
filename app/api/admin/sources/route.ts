import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

async function requireAdmin() {
  const session = await auth();
  if (!session || session.user?.role !== "admin") return null;
  return session;
}

const sourceSchema = z.object({
  name: z.string().min(1, "الاسم مطلوب"),
  rssUrl: z.string().url("رابط RSS غير صالح"),
  website: z.string().url("رابط الموقع غير صالح").optional().or(z.literal("")),
  enabled: z.boolean().default(true),
  priority: z.number().int().min(1).max(10).default(5),
  categoryId: z.string().optional().nullable(),
});

export async function GET() {
  if (!(await requireAdmin())) return unauthorized();

  const sources = await prisma.source.findMany({
    include: {
      category: true,
      _count: { select: { queueItems: true } },
    },
    orderBy: [{ enabled: "desc" }, { priority: "desc" }, { name: "asc" }],
  });

  return NextResponse.json(sources);
}

export async function POST(request: Request) {
  if (!(await requireAdmin())) return unauthorized();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = sourceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const { website, categoryId, ...rest } = parsed.data;

  const source = await prisma.source.create({
    data: {
      ...rest,
      website: website || null,
      categoryId: categoryId || null,
    },
    include: { category: true },
  });

  return NextResponse.json(source, { status: 201 });
}
