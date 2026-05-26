import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AUTHORS, type AuthorSlug, type Author } from "@/lib/authors";
import { prisma } from "@/lib/db";

// GET — return all authors + their review counts
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

// POST — create a new author (runtime only, also persisted to overrides file)
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as {
    slug: string;
    nameAr: string;
    titleAr: string;
    bioAr: string;
    specialtyAr: string;
    avatarUrl?: string;
    accentColor?: string;
    systemPrompt?: string;
    voiceTraits?: string[];
    socialTwitter?: string;
    categories?: string[];
  };

  if (!body.slug || !body.nameAr) {
    return NextResponse.json({ error: "slug and nameAr are required" }, { status: 400 });
  }

  const slug = body.slug.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

  if (AUTHORS[slug as AuthorSlug]) {
    return NextResponse.json({ error: "Author with this slug already exists" }, { status: 409 });
  }

  const newAuthor: Author = {
    slug: slug as AuthorSlug,
    nameAr: body.nameAr,
    titleAr: body.titleAr || body.nameAr,
    bioAr: body.bioAr || "",
    specialty: body.specialtyAr || "AI",
    specialtyAr: body.specialtyAr || "ذكاء اصطناعي",
    categories: body.categories ?? ["ai-models"],
    avatarUrl: body.avatarUrl || `/images/authors/${slug}.svg`,
    accentColor: body.accentColor || "#6366f1",
    systemPrompt: body.systemPrompt || `أنت ${body.nameAr}، كاتب ذكاء اصطناعي متخصص في ${body.specialtyAr || "الذكاء الاصطناعي"} لموقع AIScope.\n\nأعد المحتوى بتنسيق JSON فقط، بدون أي نص خارج JSON.`,
    voiceTraits: body.voiceTraits ?? ["يكتب بوضوح وعمق", "يستند إلى المصادر", "يقدم تحليلاً أصيلاً"],
    socialTwitter: body.socialTwitter,
  };

  // Add to in-memory AUTHORS
  (AUTHORS as Record<string, Author>)[slug] = newAuthor;

  // Persist to overrides file
  try {
    const fs = await import("fs");
    const path = await import("path");
    const overridesPath = path.join(process.cwd(), "data", "author-overrides.json");
    let overrides: Record<string, unknown> = {};
    try {
      if (fs.existsSync(overridesPath)) {
        overrides = JSON.parse(fs.readFileSync(overridesPath, "utf8"));
      }
    } catch { /* ignore */ }
    overrides[slug] = newAuthor;
    fs.mkdirSync(path.dirname(overridesPath), { recursive: true });
    fs.writeFileSync(overridesPath, JSON.stringify(overrides, null, 2), "utf8");
  } catch { /* Vercel read-only FS */ }

  return NextResponse.json({ ok: true, author: { ...newAuthor, reviewCount: 0 } }, { status: 201 });
}
