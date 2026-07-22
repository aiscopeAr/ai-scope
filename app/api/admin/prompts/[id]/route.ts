import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { CACHE_TAGS, revalidateNow } from "@/lib/cache";

export const dynamic = "force-dynamic";

async function requireAdmin() {
  const session = await auth();
  if (!session) return null;
  return session;
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const { title, titleAr, body: promptBody, description, category, toolId, tags, slug, featured, published } = body;

  const prompt = await prisma.prompt.update({
    where: { id },
    data: {
      ...(title !== undefined && { title }),
      ...(titleAr !== undefined && { titleAr }),
      ...(promptBody !== undefined && { body: promptBody }),
      ...(description !== undefined && { description }),
      ...(category !== undefined && { category }),
      ...(toolId !== undefined && { toolId: toolId ?? null }),
      ...(tags !== undefined && { tags: Array.isArray(tags) ? tags : [] }),
      ...(slug !== undefined && { slug }),
      ...(featured !== undefined && { featured }),
      ...(published !== undefined && { published }),
    },
  });

  revalidateNow(CACHE_TAGS.prompts);

  return NextResponse.json(prompt);
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await prisma.prompt.delete({ where: { id } });
  revalidateNow(CACHE_TAGS.prompts);
  return NextResponse.json({ ok: true });
}
