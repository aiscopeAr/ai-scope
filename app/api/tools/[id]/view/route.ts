import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Client-triggered (components/ViewPing.tsx) AI-tool view increment. Mirrors
// the sibling like route so the viewCount write happens here, off the page's
// Server Component render path — the ai-tools/[slug] page can then be cached
// instead of writing to Neon on every crawl.
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  await prisma.aITool.update({
    where: { id },
    data: { viewCount: { increment: 1 } },
  }).catch(() => null);

  return NextResponse.json({ ok: true });
}
