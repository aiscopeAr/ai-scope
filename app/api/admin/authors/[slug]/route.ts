/**
 * PATCH /api/admin/authors/[slug]
 * Updates mutable author fields in-memory (runtime only) + writes to a
 * persisted JSON override file at data/author-overrides.json so changes
 * survive redeploys when the file is committed.
 *
 * Fields that CAN be updated: nameAr, titleAr, bioAr, specialtyAr,
 * avatarUrl, accentColor, systemPrompt, voiceTraits, socialTwitter
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AUTHORS, type AuthorSlug } from "@/lib/authors";
import fs from "fs";
import path from "path";

const OVERRIDES_PATH = path.join(process.cwd(), "data", "author-overrides.json");

function loadOverrides(): Record<string, Partial<(typeof AUTHORS)[AuthorSlug]>> {
  try {
    if (fs.existsSync(OVERRIDES_PATH)) {
      return JSON.parse(fs.readFileSync(OVERRIDES_PATH, "utf8"));
    }
  } catch { /* ignore */ }
  return {};
}

function saveOverrides(overrides: Record<string, unknown>) {
  try {
    fs.mkdirSync(path.dirname(OVERRIDES_PATH), { recursive: true });
    fs.writeFileSync(OVERRIDES_PATH, JSON.stringify(overrides, null, 2), "utf8");
  } catch { /* Vercel read-only FS — changes are runtime-only */ }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { slug } = await params;
  if (!AUTHORS[slug as AuthorSlug]) {
    return NextResponse.json({ error: "Author not found" }, { status: 404 });
  }

  const body = await req.json() as Partial<{
    nameAr: string;
    titleAr: string;
    bioAr: string;
    specialtyAr: string;
    avatarUrl: string;
    accentColor: string;
    systemPrompt: string;
    voiceTraits: string[];
    socialTwitter: string;
  }>;

  // Apply to in-memory AUTHORS object (affects current process)
  const author = AUTHORS[slug as AuthorSlug];
  if (body.nameAr       !== undefined) author.nameAr       = body.nameAr;
  if (body.titleAr      !== undefined) author.titleAr      = body.titleAr;
  if (body.bioAr        !== undefined) author.bioAr        = body.bioAr;
  if (body.specialtyAr  !== undefined) author.specialtyAr  = body.specialtyAr;
  if (body.avatarUrl    !== undefined) author.avatarUrl    = body.avatarUrl;
  if (body.accentColor  !== undefined) author.accentColor  = body.accentColor;
  if (body.systemPrompt !== undefined) author.systemPrompt = body.systemPrompt;
  if (body.voiceTraits  !== undefined) author.voiceTraits  = body.voiceTraits;
  if (body.socialTwitter !== undefined) author.socialTwitter = body.socialTwitter;

  // Persist to file (committed to repo = survives redeploy)
  const overrides = loadOverrides();
  overrides[slug] = { ...overrides[slug], ...body };
  saveOverrides(overrides);

  return NextResponse.json({ ok: true, author });
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { slug } = await params;
  const author = AUTHORS[slug as AuthorSlug];
  if (!author) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(author);
}
