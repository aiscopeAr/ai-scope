import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const comparison = await prisma.comparison.findUnique({
    where: { id },
    include: { sides: { include: { tool: { select: { id: true, name: true, slug: true } } } } },
  });
  if (!comparison) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(comparison);
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const { slug, title, summaryAr, verdict, published, toolAId, toolBId, scoreA, scoreB, notesA, notesB } = body;

  await prisma.comparisonSide.deleteMany({ where: { comparisonId: id } });

  const comparison = await prisma.comparison.update({
    where: { id },
    data: {
      slug,
      title,
      summaryAr,
      verdict: verdict || null,
      published,
      sides: {
        create: [
          { toolId: toolAId, score: scoreA ? Number(scoreA) : null, notes: notesA || null },
          { toolId: toolBId, score: scoreB ? Number(scoreB) : null, notes: notesB || null },
        ],
      },
    },
    include: { sides: { include: { tool: true } } },
  });

  return NextResponse.json(comparison);
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await prisma.comparison.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
