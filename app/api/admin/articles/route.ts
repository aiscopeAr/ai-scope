import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { articleSchema } from "@/lib/validations/article";

export const dynamic = "force-dynamic";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

async function requireAdmin() {
  const session = await auth();
  if (!session || session.user?.role !== "admin") return null;
  return session;
}

export async function GET(request: Request) {
  const session = await requireAdmin();
  if (!session) return unauthorized();

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? "";
  const status = searchParams.get("status");
  const sortBy = searchParams.get("sortBy") ?? "createdAt";
  const sortOrder = (searchParams.get("sortOrder") ?? "desc") as "asc" | "desc";
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? "20")));

  const where = {
    ...(search
      ? {
          OR: [
            { title: { contains: search, mode: "insensitive" as const } },
            { titleAr: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
    ...(status === "published"
      ? { published: true }
      : status === "draft"
        ? { published: false }
        : {}),
  };

  const validSortFields = ["createdAt", "publishedAt", "title", "titleAr", "score"] as const;
  type SortField = (typeof validSortFields)[number];
  const orderField: SortField = validSortFields.includes(sortBy as SortField) ? (sortBy as SortField) : "createdAt";

  const [articles, total] = await Promise.all([
    prisma.article.findMany({
      where,
      include: { category: true },
      orderBy: { [orderField]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.article.count({ where }),
  ]);

  return NextResponse.json({ articles, total, page, limit });
}

export async function POST(request: Request) {
  const session = await requireAdmin();
  if (!session) return unauthorized();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = articleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const { imageUrl, publishedAt, score, ...rest } = parsed.data;

  const existing = await prisma.article.findUnique({ where: { slug: rest.slug } });
  if (existing) {
    return NextResponse.json({ error: "الرابط المختصر مستخدم بالفعل" }, { status: 409 });
  }

  const article = await prisma.article.create({
    data: {
      ...rest,
      imageUrl: imageUrl || null,
      score: score ?? 0,
      publishedAt: publishedAt ? new Date(publishedAt) : rest.published ? new Date() : null,
    },
    include: { category: true },
  });

  return NextResponse.json(article, { status: 201 });
}
