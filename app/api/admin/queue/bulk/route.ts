import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { rejectQueueItem, resetForRetry } from "@/lib/queue";

async function requireAdmin() {
  const session = await auth();
  if (!session || session.user?.role !== "admin") return null;
  return session;
}

export async function POST(req: Request) {
  if (!(await requireAdmin()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { action, ids } = body as { action: string; ids: string[] };

  if (!Array.isArray(ids) || ids.length === 0)
    return NextResponse.json({ error: "No ids provided" }, { status: 400 });

  if (!["reject", "retry"].includes(action))
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  const items = await prisma.articleQueue.findMany({
    where: { id: { in: ids } },
  });

  let count = 0;
  for (const item of items) {
    try {
      if (action === "reject") {
        await rejectQueueItem(item.id);
      } else if (action === "retry") {
        await resetForRetry(item.id);
      }
      count++;
    } catch {
      // continue — best-effort bulk
    }
  }

  return NextResponse.json({ count });
}
