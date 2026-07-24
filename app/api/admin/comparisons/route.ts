import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

// Comparison creation always goes through POST /api/admin/comparisons/create,
// which validates required fields, enforces >=2 sides, and checks slug
// uniqueness. This route only lists — it intentionally has no POST, so
// there is exactly one code path that can create a Comparison.
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
