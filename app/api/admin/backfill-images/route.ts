import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generateReviewImage } from "@/lib/images";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Find all published reviews with broken/missing images.
  // "Stale" includes both the historical replicate.delivery CDN and the
  // newer signed R2/Cloudflare gateway Replicate switched to — either one
  // means a temporary Replicate URL got persisted instead of a permanent
  // Cloudinary one.
  const reviews = await prisma.review.findMany({
    where: {
      published: true,
      OR: [
        { imageUrl: null },
        { imageUrl: { startsWith: "https://replicate.delivery/" } },
        { imageUrl: { contains: ".replicate.delivery/" } },
        { imageUrl: { contains: ".r2.cloudflarestorage.com/" } },
      ],
    },
    select: { id: true, slug: true, titleAr: true, imageUrl: true },
    orderBy: { publishedAt: "desc" },
    take: 20,
  });

  if (reviews.length === 0) {
    return NextResponse.json({ ok: true, message: "No images to fix", fixed: 0 });
  }

  // Fallback prompts for old tutorial slugs that predate ReviewQueue's
  // featuredImagePrompt column. Anything with a real featuredImagePrompt
  // (the article's actual curated prompt, set at write time) always takes
  // priority — falling back to a generic prompt produced off-topic images
  // for reviews that already had a specific one available.
  const FALLBACK_PROMPTS: Record<string, string> = {
    "what-is-claude-ai-anthropic-guide":            "Claude AI assistant Anthropic, glowing amber neural interface, dark background, futuristic digital art",
    "what-is-microsoft-copilot-productivity-guide": "Microsoft Copilot AI productivity, blue holographic interface, office workspace, cinematic lighting",
    "what-is-midjourney-ai-image-guide":            "Midjourney AI image generation, colorful creative art bursting from screen, dark studio, dramatic lighting",
    "canva-ai-design-guide":                        "Canva AI graphic design, colorful design elements floating, creative workspace, bright modern aesthetic",
    "what-is-notebooklm-google-ai-guide":           "Google NotebookLM AI research, glowing document pages transforming into knowledge graph, dark background",
    "runway-ai-video-generation-guide":             "Runway AI video generation, film strip transforming into neural art, cinematic dark atmosphere",
    "what-is-elevenlabs-ai-voice-guide":            "ElevenLabs AI voice synthesis, glowing audio waveform spectrum, dark premium background",
    "what-is-perplexity-ai-search-guide":           "Perplexity AI search engine, futuristic search interface, glowing query text, dark background",
    "what-is-chatgpt-beginners-guide":              "ChatGPT OpenAI assistant, green glowing chat interface, neural network background, dark cinematic",
    "what-is-gemini-google-ai-guide":               "Google Gemini AI multimodal, colorful gemstone light refractions, dark futuristic background",
    "how-to-use-chatgpt-for-beginners":             "ChatGPT beginner guide, step by step interface on screen, friendly digital assistant, dark background",
  };

  const results: { slug: string; status: string; url?: string }[] = [];

  for (const review of reviews) {
    // ReviewQueue.slug has no uniqueness guarantee, so an empty/whitespace
    // slug can match multiple (or the wrong) queue rows via findFirst — a
    // Review's own slug must be a real value before we trust it as a lookup
    // key at all.
    const normalizedSlug = review.slug?.trim();
    const queueItem = normalizedSlug
      ? await prisma.reviewQueue.findFirst({
          where: { slug: normalizedSlug },
          select: { id: true, featuredImagePrompt: true },
        })
      : null;
    if (!normalizedSlug) {
      results.push({ slug: review.slug, status: "skipped_blank_slug" });
      continue;
    }

    const queuePrompt = queueItem?.featuredImagePrompt?.trim();
    const prompt =
      (queuePrompt ? queuePrompt : undefined) ??
      FALLBACK_PROMPTS[review.slug] ??
      `${review.titleAr}, artificial intelligence, futuristic dark background`;

    try {
      const imageUrl = await generateReviewImage(prompt);
      if (!imageUrl) {
        results.push({ slug: review.slug, status: "no_url" });
        continue;
      }
      await prisma.review.update({ where: { id: review.id }, data: { imageUrl } });
      if (queueItem) {
        await prisma.reviewQueue.update({ where: { id: queueItem.id }, data: { imageUrl } });
      }
      results.push({ slug: review.slug, status: "ok", url: imageUrl });
    } catch (e) {
      results.push({ slug: review.slug, status: "error: " + (e instanceof Error ? e.message : String(e)) });
    }

    // Respect Replicate rate limit
    await new Promise((r) => setTimeout(r, 12000));
  }

  const fixed = results.filter((r) => r.status === "ok").length;
  return NextResponse.json({ ok: true, fixed, total: reviews.length, results });
}
