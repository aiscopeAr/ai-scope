import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

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
    return NextResponse.json({ error: "No ids" }, { status: 400 });

  if (!["publish", "unpublish", "delete"].includes(action))
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  if (action === "delete") {
    const { count } = await prisma.article.deleteMany({ where: { id: { in: ids } } });
    return NextResponse.json({ count });
  }

  const publish = action === "publish";
  const { count } = await prisma.article.updateMany({
    where: { id: { in: ids } },
    data: {
      published: publish,
      publishedAt: publish ? new Date() : null,
    },
  });

  return NextResponse.json({ count });
}
