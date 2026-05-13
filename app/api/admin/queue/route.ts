import { NextResponse } from "next/server";

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

export async function GET(request: Request) {
  if (!(await requireAdmin())) return unauthorized();

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") ?? "";
  const search = searchParams.get("search") ?? "";
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") ?? "20")));

  const where = {
    ...(status ? { status } : {}),
    ...(search
      ? {
          OR: [
            { rawTitle: { contains: search, mode: "insensitive" as const } },
            { titleAr: { contains: search, mode: "insensitive" as const } },
            { sourceName: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [items, total, counts] = await Promise.all([
    prisma.articleQueue.findMany({
      where,
      include: { source: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.articleQueue.count({ where }),
    prisma.articleQueue.groupBy({
      by: ["status"],
      _count: true,
    }),
  ]);

  const statusCounts = Object.fromEntries(
    counts.map((c) => [c.status, c._count]),
  );

  return NextResponse.json({ items, total, page, limit, statusCounts });
}
