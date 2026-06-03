import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [reports, daily] = await Promise.all([
    prisma.weeklyReport.findMany({
      orderBy: { weekStart: "desc" },
      take: 10,
    }),
    prisma.dailyStats.findMany({
      where: { date: { gte: thirtyDaysAgo } },
      orderBy: { date: "asc" },
    }),
  ]);

  return NextResponse.json({ reports, daily });
}
