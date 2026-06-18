import Replicate from "replicate";
import { v2 as cloudinary } from "cloudinary";
import { PrismaClient } from "@prisma/client";
import { readFileSync } from "fs";

// Load .env.local
try {
  const env = readFileSync(".env.local", "utf8");
  env.split("\n").forEach((line) => {
    const m = line.match(/^([^#=\s][^=]*)=(.*)$/);
    if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
  });
} catch {}

const prisma = new PrismaClient();

const JOBS = [
  { slug: "what-is-claude-ai-anthropic-guide",              prompt: "Claude AI assistant Anthropic, glowing amber neural interface, dark background, futuristic digital art" },
  { slug: "what-is-microsoft-copilot-productivity-guide",   prompt: "Microsoft Copilot AI productivity, blue holographic interface, office workspace, cinematic lighting" },
  { slug: "what-is-midjourney-ai-image-guide",              prompt: "Midjourney AI image generation, colorful creative art bursting from screen, dark studio, dramatic lighting" },
  { slug: "canva-ai-design-guide",                          prompt: "Canva AI graphic design, colorful design elements floating, creative workspace, bright modern aesthetic" },
  { slug: "what-is-notebooklm-google-ai-guide",             prompt: "Google NotebookLM AI research, glowing document pages transforming into knowledge graph, dark background" },
  { slug: "runway-ai-video-generation-guide",               prompt: "Runway AI video generation, film strip transforming into neural art, cinematic dark atmosphere" },
  { slug: "what-is-elevenlabs-ai-voice-guide",              prompt: "ElevenLabs AI voice synthesis, glowing audio waveform spectrum, dark premium background" },
];

function configureCloudinary() {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

function extractOutputUrl(output) {
  if (Array.isArray(output) && output.length > 0) {
    const first = output[0];
    if (typeof first === "string") return first;
    if (first instanceof URL) return first.toString();
    if (first && typeof first.url === "function") {
      const v = first.url();
      return v instanceof URL ? v.toString() : String(v);
    }
    if (first != null) return String(first);
  }
  if (typeof output === "string") return output;
  if (output instanceof URL) return output.toString();
  return null;
}

async function generateImage(prompt) {
  const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });
  const output = await replicate.run("black-forest-labs/flux-schnell", {
    input: {
      prompt: `${prompt}, digital art, dark background, cinematic lighting, high quality, no text, no watermark`,
      num_outputs: 1,
      aspect_ratio: "16:9",
      output_format: "webp",
      output_quality: 80,
      go_fast: true,
    },
  });

  const replicateUrl = extractOutputUrl(output);
  if (!replicateUrl) return null;

  configureCloudinary();
  try {
    const uploaded = await cloudinary.uploader.upload(replicateUrl, {
      folder: "aiscope/reviews",
      resource_type: "image",
      format: "webp",
      quality: "auto:good",
    });
    return uploaded.secure_url;
  } catch {
    return replicateUrl;
  }
}

async function main() {
  for (const job of JOBS) {
    const review = await prisma.review.findUnique({
      where: { slug: job.slug },
      select: { id: true, imageUrl: true, titleAr: true },
    });

    if (!review) { console.log(`SKIP (not found): ${job.slug}`); continue; }
    if (review.imageUrl) { console.log(`SKIP (has image): ${job.slug}`); continue; }

    process.stdout.write(`Generating image for ${job.slug}... `);
    const imageUrl = await generateImage(job.prompt);
    if (!imageUrl) { console.log("FAILED"); continue; }

    await prisma.review.update({ where: { id: review.id }, data: { imageUrl } });
    console.log("OK →", imageUrl.slice(0, 70));

    // Rate limit: 6 req/min → wait 12s between requests
    await new Promise((r) => setTimeout(r, 12000));
  }

  await prisma.$disconnect();
  console.log("\nAll done.");
}

main().catch((e) => { console.error(e); process.exit(1); });
