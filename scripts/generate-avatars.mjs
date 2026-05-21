/**
 * Generate avatar images for Zayd and Lina via Replicate Flux-dev
 * Run: node scripts/generate-avatars.mjs
 */
import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;
if (!REPLICATE_API_TOKEN) {
  console.error("❌  Set REPLICATE_API_TOKEN env var first");
  process.exit(1);
}

const AVATARS = [
  {
    slug: "zayd",
    prompt:
      "Portrait of a male AI entity named Zayd, abstract digital being, " +
      "glowing indigo and violet neural network patterns forming a face, " +
      "dark background with soft light, futuristic, editorial style, " +
      "professional headshot composition, high quality, 4k",
    negativePrompt: "human, realistic face, photo, skin, hair, ugly, blurry",
  },
  {
    slug: "lina",
    prompt:
      "Portrait of a female AI entity named Lina, abstract digital being, " +
      "glowing pink and rose neural network patterns forming a face, " +
      "dark background with soft warm light, futuristic, editorial style, " +
      "professional headshot composition, high quality, 4k",
    negativePrompt: "human, realistic face, photo, skin, hair, ugly, blurry",
  },
];

async function runPrediction(prompt, negativePrompt) {
  // Create prediction
  const createRes = await fetch("https://api.replicate.com/v1/models/black-forest-labs/flux-dev/predictions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${REPLICATE_API_TOKEN}`,
      "Content-Type": "application/json",
      Prefer: "wait",
    },
    body: JSON.stringify({
      input: {
        prompt,
        negative_prompt: negativePrompt,
        num_outputs: 1,
        aspect_ratio: "1:1",
        output_format: "webp",
        output_quality: 90,
        guidance: 3.5,
        num_inference_steps: 28,
      },
    }),
  });

  if (!createRes.ok) {
    const err = await createRes.text();
    throw new Error(`Replicate API error: ${err}`);
  }

  const prediction = await createRes.json();

  // Poll if not done yet
  let result = prediction;
  while (result.status !== "succeeded" && result.status !== "failed") {
    await new Promise((r) => setTimeout(r, 2000));
    const pollRes = await fetch(`https://api.replicate.com/v1/predictions/${result.id}`, {
      headers: { Authorization: `Bearer ${REPLICATE_API_TOKEN}` },
    });
    result = await pollRes.json();
    console.log(`  polling... status: ${result.status}`);
  }

  if (result.status === "failed") throw new Error(`Prediction failed: ${result.error}`);

  const outputUrl = Array.isArray(result.output) ? result.output[0] : result.output;
  return outputUrl;
}

async function downloadImage(url, outputPath) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download image: ${res.status}`);
  const buffer = await res.arrayBuffer();
  writeFileSync(outputPath, Buffer.from(buffer));
}

async function main() {
  for (const avatar of AVATARS) {
    console.log(`\n🎨 Generating avatar for ${avatar.slug}...`);
    try {
      const imageUrl = await runPrediction(avatar.prompt, avatar.negativePrompt);
      console.log(`  ✅ Got URL: ${imageUrl}`);

      const outputPath = join(__dirname, "..", "public", "images", "authors", `${avatar.slug}.webp`);
      await downloadImage(imageUrl, outputPath);
      console.log(`  💾 Saved to public/images/authors/${avatar.slug}.webp`);
    } catch (err) {
      console.error(`  ❌ Failed for ${avatar.slug}:`, err.message);
    }
  }
  console.log("\n✅ Done! Images saved to public/images/authors/");
}

main();
