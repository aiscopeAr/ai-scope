import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { fetchRssFeed } from "@/lib/rss";
import { enqueueNewsItem } from "@/lib/review-queue";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

async function requireAdmin() {
  const session = await auth();
  if (!session || session.user?.role !== "admin") return null;
  return session;
}

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  rssUrl: z.string().url().optional(),
  website: z.string().url().optional().or(z.literal("")).nullable(),
  enabled: z.boolean().optional(),
  priority: z.number().int().min(1).max(10).optional(),
});

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await requireAdmin())) return unauthorized();
  const { id } = await params;

  const source = await prisma.source.findUnique({
    where: { id },
    select: { id: true, name: true, rssUrl: true, website: true, enabled: true, priority: true, lastSyncedAt: true },
  });
  if (!source) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(source);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await requireAdmin())) return unauthorized();
  const { id } = await params;

  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const existing = await prisma.source.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { website, ...rest } = parsed.data;

  const source = await prisma.source.update({
    where: { id },
    data: {
      ...rest,
      ...(website !== undefined ? { website: website || null } : {}),
    },
    select: { id: true, name: true, rssUrl: true, website: true, enabled: true, priority: true, lastSyncedAt: true },
  });

  return NextResponse.json(source);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await requireAdmin())) return unauthorized();
  const { id } = await params;

  const existing = await prisma.source.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.source.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

/** POST /api/admin/sources/[id] with body { action: "sync" } triggers immediate RSS fetch */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await requireAdmin())) return unauthorized();
  const { id } = await params;

  let body: { action?: string } = {};
  try { body = await request.json(); } catch { /* empty body is fine */ }

  if (body.action !== "sync") {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }

  const source = await prisma.source.findUnique({ where: { id } });
  if (!source) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!source.enabled) return NextResponse.json({ error: "Source is disabled" }, { status: 400 });

  let items;
  try {
    items = await fetchRssFeed(source.rssUrl);
  } catch (err) {
    const message = err instanceof Error ? err.message : "RSS fetch failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  let added = 0;
  let skipped = 0;

  for (const item of items) {
    const queuedId = await enqueueNewsItem({
      sourceUrl: item.link,
      title: item.title,
      content: item.content ?? item.description,
      publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
      sourceName: source.name,
      sourceId: source.id,
      imageUrl: item.imageUrl ?? undefined,
    });
    if (queuedId) added++;
    else skipped++;
  }

  await prisma.source.update({
    where: { id },
    data: { lastSyncedAt: new Date() },
  });

  return NextResponse.json({ added, skipped, total: items.length });
}
