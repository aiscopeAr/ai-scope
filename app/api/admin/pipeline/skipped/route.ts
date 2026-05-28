import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

// DELETE all skipped items
export async function DELETE() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { count } = await prisma.newsItem.deleteMany({ where: { status: "skipped" } });
  return NextResponse.json({ deleted: count });
}
