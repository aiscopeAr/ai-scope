import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const comparisons = await prisma.comparison.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      sides: { include: { tool: { select: { id: true, name: true, slug: true } } } },
    },
  });
  return NextResponse.json(comparisons);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { slug, title, summaryAr, verdict, published, toolAId, toolBId, scoreA, scoreB, notesA, notesB } = body;

  if (!slug || !title || !summaryAr) {
    return NextResponse.json({ error: "slug, title, summaryAr مطلوبة" }, { status: 400 });
  }
  if (!toolAId || !toolBId) {
    return NextResponse.json({ error: "يجب اختيار أداتين للمقارنة" }, { status: 400 });
  }

  const existing = await prisma.comparison.findUnique({ where: { slug } });
  if (existing) return NextResponse.json({ error: "slug مستخدم بالفعل" }, { status: 409 });

  const comparison = await prisma.comparison.create({
    data: {
      slug,
      title,
      summaryAr,
      verdict: verdict || null,
      published: published ?? true,
      sides: {
        create: [
          { toolId: toolAId, score: scoreA ? Number(scoreA) : null, notes: notesA || null },
          { toolId: toolBId, score: scoreB ? Number(scoreB) : null, notes: notesB || null },
        ],
      },
    },
    include: { sides: { include: { tool: true } } },
  });

  return NextResponse.json(comparison, { status: 201 });
}
