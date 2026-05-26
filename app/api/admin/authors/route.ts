import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AUTHORS, type AuthorSlug } from "@/lib/authors";
import { prisma } from "@/lib/db";

// GET — return both authors + their review counts
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const counts = await prisma.review.groupBy({
    by: ["authorSlug"],
    where: { published: true },
    _count: { id: true },
  });

  const countMap: Record<string, number> = {};
  for (const c of counts) countMap[c.authorSlug] = c._count.id;

  const result = Object.values(AUTHORS).map((a) => ({
    ...a,
    reviewCount: countMap[a.slug] ?? 0,
  }));

  return NextResponse.json(result);
}
