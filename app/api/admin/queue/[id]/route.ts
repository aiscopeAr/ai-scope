import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { approveQueueItem, rejectQueueItem, resetForRetry } from "@/lib/queue";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

async function requireAdmin() {
  const session = await auth();
  if (!session || session.user?.role !== "admin") return null;
  return session;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await requireAdmin())) return unauthorized();
  const { id } = await params;

  const item = await prisma.articleQueue.findUnique({
    where: { id },
    include: { source: true },
  });
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(item);
}

const actionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("approve"),
    categoryId: z.string().min(1, "التصنيف مطلوب"),
    title: z.string().min(1),
    slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
    published: z.boolean().default(true),
  }),
  z.object({ action: z.literal("reject") }),
  z.object({ action: z.literal("retry") }),
]);

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await requireAdmin())) return unauthorized();
  const { id } = await params;

  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = actionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const existing = await prisma.articleQueue.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (parsed.data.action === "approve") {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { action: _action, ...overrides } = parsed.data;
    try {
      const articleId = await approveQueueItem(id, overrides);
      return NextResponse.json({ success: true, articleId });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Approval failed";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  if (parsed.data.action === "reject") {
    await rejectQueueItem(id);
    return NextResponse.json({ success: true });
  }

  if (parsed.data.action === "retry") {
    await resetForRetry(id);
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
