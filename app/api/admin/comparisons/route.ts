import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const comparisons = await prisma.comparison.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      sides: {
        include: { tool: { select: { name: true, logoUrl: true } } },
      },
    },
  });

  return NextResponse.json({ comparisons });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { title, slug, summaryAr, verdict, criteria, published } = body;

  const comparison = await prisma.comparison.create({
    data: { title, slug, summaryAr, verdict, criteria: criteria ?? [], published: published ?? false },
  });

  return NextResponse.json({ comparison });
}
