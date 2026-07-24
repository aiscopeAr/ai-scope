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

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
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

    if (!title || !slug || !summaryAr) {
      return NextResponse.json({ error: "العنوان والـ slug والملخص مطلوبة" }, { status: 400 });
    }
    if (!Array.isArray(sides)) {
      return NextResponse.json({ error: "يجب إضافة أداتين على الأقل" }, { status: 400 });
    }

    const tools = await prisma.aITool.findMany({
      where: { id: { in: sides.map((s) => s.toolId) } },
      select: { id: true, published: true },
    });
    const toolById = new Map(tools.map((t) => [t.id, t]));

    const issues = validateComparisonSides({
      slug,
      sides: sides.map((s) => ({
        toolId: s.toolId,
        toolPublished: toolById.get(s.toolId)?.published ?? false,
        score: s.score ?? null,
      })),
    });
    if (issues.length > 0) {
      return NextResponse.json({ error: issues[0].message }, { status: 400 });
    }

    // Check slug uniqueness
    const existing = await prisma.comparison.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json({ error: "هذا الـ slug مستخدم بالفعل، غيّره" }, { status: 400 });
    }

    // Check for an existing comparison covering the exact same set of tools
    // (regardless of side order) — prevents two separate "X vs Y" pages.
    const toolIds = sides.map((s) => s.toolId);
    const candidates = await prisma.comparison.findMany({
      where: { sides: { some: { toolId: { in: toolIds } } } },
      select: { id: true, slug: true, sides: { select: { toolId: true } } },
    });
    const duplicate = candidates.find((c) => {
      const existingIds = c.sides.map((s) => s.toolId).sort();
      return existingIds.length === toolIds.length &&
        existingIds.every((tid, i) => tid === [...toolIds].sort()[i]);
    });
    if (duplicate) {
      return NextResponse.json({ error: `توجد مقارنة بنفس الأدوات بالفعل: ${duplicate.slug}` }, { status: 400 });
    }

    const comparison = await prisma.comparison.create({
      data: {
        title,
        slug,
        summaryAr,
        verdict: verdict || null,
        criteria: criteria ?? [],
        methodology: methodology || null,
        reviewedAt: reviewedAt ? new Date(reviewedAt) : null,
        published: published ?? false,
        sides: {
          create: sides.map((s) => ({
            toolId: s.toolId,
            score: s.score ?? null,
            notes: s.notes ?? null,
            bestFor: s.bestFor ?? null,
            notRecommendedFor: s.notRecommendedFor ?? null,
            strengths: s.strengths ?? [],
            weaknesses: s.weaknesses ?? [],
          })),
        },
      },
      include: { sides: true },
    });

    return NextResponse.json({ comparison });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "خطأ غير متوقع";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
