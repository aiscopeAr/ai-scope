import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const toolId = searchParams.get("toolId");
  const q = searchParams.get("q");
  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const limit = 24;

  const where = {
    published: true,
    ...(category && category !== "all" ? { category } : {}),
    ...(toolId ? { toolId } : {}),
    ...(q ? {
      OR: [
        { title: { contains: q, mode: "insensitive" as const } },
        { titleAr: { contains: q, mode: "insensitive" as const } },
        { description: { contains: q, mode: "insensitive" as const } },
        { tags: { has: q } },
      ],
    } : {}),
  };

  const [prompts, total] = await Promise.all([
    prisma.prompt.findMany({
      where,
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        title: true,
        titleAr: true,
        description: true,
        category: true,
        tags: true,
        slug: true,
        featured: true,
        viewCount: true,
        createdAt: true,
        tool: { select: { name: true, slug: true, logoUrl: true } },
      },
    }),
    prisma.prompt.count({ where }),
  ]);

  return NextResponse.json({ prompts, total, page, pages: Math.ceil(total / limit) });
}
