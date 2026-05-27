import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { title, slug, summaryAr, verdict, criteria, published, sides } = body;

    if (!title || !slug || !summaryAr) {
      return NextResponse.json({ error: "العنوان والـ slug والملخص مطلوبة" }, { status: 400 });
    }
    if (!Array.isArray(sides) || sides.length < 2) {
      return NextResponse.json({ error: "يجب إضافة أداتين على الأقل" }, { status: 400 });
    }

    // Check slug uniqueness
    const existing = await prisma.comparison.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json({ error: "هذا الـ slug مستخدم بالفعل، غيّره" }, { status: 400 });
    }

    const comparison = await prisma.comparison.create({
      data: {
        title,
        slug,
        summaryAr,
        verdict: verdict || null,
        criteria: criteria ?? [],
        published: published ?? false,
        sides: {
          create: sides.map((s: {
            toolId: string;
            score?: number | null;
            notes?: string | null;
            bestFor?: string | null;
            strengths?: string[];
            weaknesses?: string[];
          }) => ({
            toolId: s.toolId,
            score: s.score ?? null,
            notes: s.notes ?? null,
            bestFor: s.bestFor ?? null,
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
