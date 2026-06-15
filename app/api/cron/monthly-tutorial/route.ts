/**
 * Monthly tutorial generator — runs once/month via Vercel Cron.
 * Creates Evergreen "how to use AI tool" articles authored by طاقم لوميك (team).
 * Topics rotate through a curated list; already-written topics are skipped.
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { writeTutorial } from "@/lib/tutorial-openai";
import { generateReviewImage } from "@/lib/images";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

function verifyCronSecret(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

// ─── Evergreen tutorial topics ─────────────────────────────────────────────
// Add new topics here to expand coverage. Already-published slugs are skipped.
const TUTORIAL_TOPICS = [
  // ChatGPT
  "كيف تستخدم ChatGPT للمبتدئين — دليل شامل خطوة بخطوة",
  "كيف تكتب برومبتس احترافية لـ ChatGPT",
  "ChatGPT للطلاب: كيف تستخدمه في الدراسة والبحث",
  "كيف تستخدم ChatGPT في العمل والإنتاجية",
  // Gemini
  "كيف تستخدم Gemini بالعربي — دليل كامل",
  "Gemini مقابل ChatGPT: أيهما تختار وكيف تستخدم كل واحد؟",
  // Image tools
  "كيف تستخدم Canva AI لتصميم صور احترافية مجاناً",
  "كيف تستخدم Midjourney لتوليد صور احترافية",
  "كيف تستخدم Magnific AI لرفع جودة الصور",
  "كيف تستخدم Adobe Firefly لتصميم الصور بالذكاء الاصطناعي",
  // Productivity
  "كيف تستخدم Notion AI لتنظيم عملك",
  "كيف تستخدم Zapier لأتمتة مهامك اليومية بالذكاء الاصطناعي",
  "كيف تستخدم Perplexity AI للبحث الذكي",
  // Code
  "كيف تستخدم Cursor AI للبرمجة بالذكاء الاصطناعي",
  "كيف تستخدم GitHub Copilot لكتابة الكود",
  // Video & audio
  "كيف تستخدم ElevenLabs لتحويل النص إلى صوت عربي",
  "كيف تستخدم Sora لتوليد فيديو بالذكاء الاصطناعي",
  "كيف تستخدم Runway ML لتحرير الفيديو بالذكاء الاصطناعي",
  // Writing
  "كيف تستخدم Claude AI بالعربي — دليل شامل",
  "كيف تستخدم Jasper AI لكتابة المحتوى التسويقي",
];

export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Find the tutorials category
  const tutorialsCategory = await prisma.category.findUnique({
    where: { slug: "tutorials" },
  });
  if (!tutorialsCategory) {
    return NextResponse.json({ error: "tutorials category not found" }, { status: 500 });
  }

  // Get already-published tutorial slugs to avoid duplicates
  const existing = await prisma.review.findMany({
    where: { categoryId: tutorialsCategory.id, published: true },
    select: { slug: true, titleAr: true },
  });
  const existingSlugs = new Set(existing.map((r) => r.slug));

  // Pick first topic not yet covered
  const topic = TUTORIAL_TOPICS.find((t) => {
    const candidateSlug = slugify(t.replace(/[^\w\s]/g, ""));
    return !existingSlugs.has(candidateSlug);
  });

  if (!topic) {
    return NextResponse.json({ ok: true, message: "All tutorial topics already published" });
  }

  // Generate tutorial content
  const draft = await writeTutorial(topic);

  const finalSlug = draft.slug || slugify(topic.replace(/[^\w\s]/g, ""));

  // Check slug collision
  const slugExists = await prisma.review.findUnique({ where: { slug: finalSlug } });
  if (slugExists) {
    return NextResponse.json({ ok: true, message: `Slug already exists: ${finalSlug}` });
  }

  // Generate featured image
  let imageUrl: string | null = null;
  try {
    if (draft.featuredImagePrompt) {
      imageUrl = await generateReviewImage(draft.featuredImagePrompt, draft.imageAlt);
    }
  } catch {
    // image generation is best-effort
  }

  // Publish directly (tutorials are pre-approved evergreen content)
  await prisma.review.create({
    data: {
      slug: finalSlug,
      titleAr: draft.titleAr,
      summary: draft.summaryAr,
      contentAr: draft.contentAr,
      seoTitle: draft.seoTitle,
      seoDescription: draft.seoDescription,
      imageUrl,
      imageAlt: draft.imageAlt,
      tags: [...draft.tags, "__author:team"],
      keywords: draft.keywords,
      faq: draft.faq as object[],
      published: true,
      publishedAt: new Date(),
      authorSlug: "team",
      categoryId: tutorialsCategory.id,
    },
  });

  return NextResponse.json({
    ok: true,
    topic,
    slug: finalSlug,
    title: draft.titleAr,
    relatedPrompts: draft.relatedPrompts.length,
    imageUrl,
  });
}
