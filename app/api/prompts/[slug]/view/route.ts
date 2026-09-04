import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Client-triggered (components/ViewPing.tsx) prompt view increment, keyed by
// slug to match the prompt page. Moves the viewCount write off the
// prompts/[slug] Server Component render path so that page can be ISR-cached
// instead of writing to Neon on every crawl.
export async function POST(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  await prisma.prompt.update({
    where: { slug },
    data: { viewCount: { increment: 1 } },
  }).catch(() => null);

  return NextResponse.json({ ok: true });
}
