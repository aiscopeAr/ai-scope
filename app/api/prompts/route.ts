import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const model = searchParams.get("model");
  const search = searchParams.get("q");
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.min(24, parseInt(searchParams.get("limit") ?? "12"));

  type WhereClause = {
    published: boolean;
    category?: { slug: string };
    aiModel?: { slug: string };
    OR?: Array<{ titleAr?: { contains: string; mode: "insensitive" }; descriptionAr?: { contains: string; mode: "insensitive" }; tags?: { has: string } }>;
  };
  const where: WhereClause = { published: true };
  if (category) where.category = { slug: category };
  if (model) where.aiModel = { slug: model };
  if (search) {
    where.OR = [
      { titleAr: { contains: search, mode: "insensitive" } },
      { descriptionAr: { contains: search, mode: "insensitive" } },
      { tags: { has: search } },
    ];
  }

  const [prompts, total] = await Promise.all([
    prisma.prompt.findMany({
      where,
      include: { category: true, aiModel: true },
      orderBy: [{ featured: "desc" }, { publishedAt: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.prompt.count({ where }),
  ]);

  return NextResponse.json({
    prompts,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
}
