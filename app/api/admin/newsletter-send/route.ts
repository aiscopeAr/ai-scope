import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Resend } from "resend";
import { buildNewsletterHtml, type NewsletterData } from "@/lib/newsletter-template";

export const dynamic = "force-dynamic";

function getWeekLabel(): string {
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - 7);
  const fmt = (d: Date) =>
    d.toLocaleDateString("ar-EG", { day: "numeric", month: "long" });
  return `${fmt(start)} – ${fmt(now)} ${now.getFullYear()}`;
}

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const since = new Date();
  since.setDate(since.getDate() - 7);

  const [articles, tools] = await Promise.all([
    prisma.review.findMany({
      where: { published: true, publishedAt: { gte: since } },
      orderBy: { viewCount: "desc" },
      take: 6,
      select: {
        titleAr: true, summary: true, slug: true, imageUrl: true,
        category: { select: { nameAr: true } },
      },
    }),
    prisma.aITool.findMany({
      where: { published: true, createdAt: { gte: since } },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { name: true, slug: true, tagline: true, logoUrl: true, category: true },
    }),
  ]);

  const data: NewsletterData = {
    weekLabel: getWeekLabel(),
    articles: articles.map((a) => ({
      titleAr: a.titleAr,
      summary: a.summary,
      slug: a.slug,
      imageUrl: a.imageUrl,
      category: a.category.nameAr,
    })),
    tools: tools.map((t) => ({
      name: t.name,
      slug: t.slug,
      tagline: t.tagline,
      logoUrl: t.logoUrl,
      category: t.category,
    })),
  };

  const html = buildNewsletterHtml(data);
  return NextResponse.json({ data, html });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as { to: string; html: string; subject?: string };
  const { to, html, subject } = body;

  if (!to || !html) {
    return NextResponse.json({ error: "Missing to or html" }, { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "RESEND_API_KEY not set" }, { status: 500 });
  }

  const resend = new Resend(apiKey);

  const { data, error } = await resend.emails.send({
    from: process.env.RESEND_FROM ?? "Lumiq <newsletter@lumiq.news>",
    to,
    subject: subject ?? `نشرة لوميك الأسبوعية — أبرز أخبار الذكاء الاصطناعي`,
    html,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, id: data?.id });
}
