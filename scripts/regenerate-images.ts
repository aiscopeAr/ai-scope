/**
 * Regenerate Replicate images for all published articles.
 * Run via: REPLICATE_API_TOKEN=... DATABASE_URL=... npx tsx scripts/regenerate-images.ts
 *
 * Or trigger via API: GET /api/admin/regenerate-images?secret=CRON_SECRET
 */
import { PrismaClient } from "@prisma/client";
import Replicate from "replicate";

const prisma = new PrismaClient();

async function generateImage(prompt: string): Promise<string | null> {
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) throw new Error("REPLICATE_API_TOKEN not set");

  const client = new Replicate({ auth: token });
  const output = await client.run("black-forest-labs/flux-schnell", {
    input: {
      prompt: `${prompt}, professional technology news illustration, high quality`,
      num_outputs: 1,
      aspect_ratio: "16:9",
      output_format: "webp",
      output_quality: 80,
      go_fast: true,
    },
  });

  if (Array.isArray(output) && output.length > 0) {
    const first = output[0];
    if (typeof first === "string") return first;
    if (first && typeof (first as { url?: () => string }).url === "function") {
      return (first as { url: () => string }).url();
    }
    return String(first);
  }
  if (typeof output === "string") return output;
  return null;
}

async function main() {
  // Get articles with non-Replicate images (from original RSS sources)
  const articles = await prisma.article.findMany({
    where: {
      published: true,
      OR: [
        { imageUrl: null },
        { imageUrl: { not: { contains: "replicate.delivery" } } },
        { imageUrl: { not: { contains: "pbxt.replicate.delivery" } } },
      ],
    },
    orderBy: { createdAt: "desc" },
    select: { id: true, titleAr: true, title: true, tags: true, imageUrl: true },
  });

  console.log(`Found ${articles.length} articles needing new images`);

  let success = 0;
  let failed = 0;

  for (const article of articles) {
    const prompt = `${article.title}, artificial intelligence technology news, futuristic digital concept`;
    console.log(`[${success + failed + 1}/${articles.length}] Generating for: ${article.titleAr?.slice(0, 50)}`);

    try {
      const imageUrl = await generateImage(prompt);
      if (imageUrl) {
        await prisma.article.update({
          where: { id: article.id },
          data: { imageUrl },
        });
        console.log(`  ✓ ${imageUrl.slice(0, 60)}...`);
        success++;
      } else {
        console.log(`  ✗ No URL returned`);
        failed++;
      }
    } catch (e) {
      console.error(`  ✗ Error: ${e instanceof Error ? e.message : e}`);
      failed++;
    }

    // Rate limit: Replicate Flux Schnell is fast but be respectful
    await new Promise((r) => setTimeout(r, 2000));
  }

  console.log(`\nDone: ${success} updated, ${failed} failed`);
  await prisma.$disconnect();
}

main().catch(console.error);
