import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

async function requireAdmin() {
  const session = await auth();
  if (!session || session.user?.role !== "admin") return null;
  return session;
}

export async function DELETE() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [deletedArticles, deletedQueue] = await Promise.all([
    prisma.article.deleteMany({}),
    prisma.articleQueue.deleteMany({}),
  ]);

  return NextResponse.json({
    ok: true,
    deletedArticles: deletedArticles.count,
    deletedQueue: deletedQueue.count,
  });
}
