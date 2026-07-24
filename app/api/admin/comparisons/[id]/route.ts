import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { validateComparisonSides } from "@/lib/comparison-helpers";

interface SideInput {
  toolId: string;
  score?: number | null;
  notes?: string | null;
  bestFor?: string | null;
  notRecommendedFor?: string | null;
  strengths?: string[];
  weaknesses?: string[];
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const comparison = await prisma.comparison.findUnique({
    where: { id },
    include: { sides: { include: { tool: { select: { id: true, name: true, tagline: true, logoUrl: true } } } } },
  });
  if (!comparison) return NextResponse.json({ error: "المقارنة غير موجودة" }, { status: 404 });

  return NextResponse.json({ comparison });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const existing = await prisma.comparison.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "المقارنة غير موجودة" }, { status: 404 });

    const body = await req.json();

    // Publish-toggle-only calls (from the admin list page) send just
    // { published }. Full-form edits (from the edit page) send the complete
    // set below. Both are handled by the same allowlisted path.
    const { title, slug, summaryAr, verdict, criteria, methodology, reviewedAt, published, sides } = body as {
      title?: string;
      slug?: string;
      summaryAr?: string;
      verdict?: string | null;
      criteria?: unknown;
      methodology?: string | null;
      reviewedAt?: string | null;
      published?: boolean;
      sides?: SideInput[];
    };

    if (slug !== undefined && slug !== existing.slug) {
      const slugTaken = await prisma.comparison.findUnique({ where: { slug } });
      if (slugTaken) {
        return NextResponse.json({ error: "هذا الـ slug مستخدم بالفعل، غيّره" }, { status: 400 });
      }
    }

    if (sides !== undefined) {
      if (!Array.isArray(sides)) {
        return NextResponse.json({ error: "يجب إضافة أداتين على الأقل" }, { status: 400 });
      }
      const tools = await prisma.aITool.findMany({
        where: { id: { in: sides.map((s) => s.toolId) } },
        select: { id: true, published: true },
      });
      const toolById = new Map(tools.map((t) => [t.id, t]));
      const issues = validateComparisonSides({
        slug: slug ?? existing.slug,
        sides: sides.map((s) => ({
          toolId: s.toolId,
          toolPublished: toolById.get(s.toolId)?.published ?? false,
          score: s.score ?? null,
        })),
      });
      if (issues.length > 0) {
        return NextResponse.json({ error: issues[0].message }, { status: 400 });
      }
    }

    // Only these scalar fields are ever written — the previous version of
    // this route passed the raw request body straight to `data`, which
    // would let any caller set arbitrary fields (including relation-shaped
    // ones Prisma happened to reject, but nothing enforced that safely).
    const data: Record<string, unknown> = {};
    if (title !== undefined) data.title = title;
    if (slug !== undefined) data.slug = slug;
    if (summaryAr !== undefined) data.summaryAr = summaryAr;
    if (verdict !== undefined) data.verdict = verdict || null;
    if (criteria !== undefined) data.criteria = criteria;
    if (methodology !== undefined) data.methodology = methodology || null;
    if (reviewedAt !== undefined) data.reviewedAt = reviewedAt ? new Date(reviewedAt) : null;
    if (published !== undefined) data.published = published;

    const comparison = await prisma.$transaction(async (tx) => {
      if (sides !== undefined) {
        // Replace the full side set atomically — same delete+recreate
        // pattern is safe here because ComparisonSide has no data other
        // than what the form owns (no independent view/click history).
        await tx.comparisonSide.deleteMany({ where: { comparisonId: id } });
        await tx.comparisonSide.createMany({
          data: sides.map((s) => ({
            comparisonId: id,
            toolId: s.toolId,
            score: s.score ?? null,
            notes: s.notes ?? null,
            bestFor: s.bestFor ?? null,
            notRecommendedFor: s.notRecommendedFor ?? null,
            strengths: s.strengths ?? [],
            weaknesses: s.weaknesses ?? [],
          })),
        });
      }

      return tx.comparison.update({
        where: { id },
        data,
        include: { sides: { include: { tool: { select: { id: true, name: true, logoUrl: true } } } } },
      });
    });

    return NextResponse.json({ comparison });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "خطأ غير متوقع";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const existing = await prisma.comparison.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "المقارنة غير موجودة" }, { status: 404 });

  await prisma.comparison.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
