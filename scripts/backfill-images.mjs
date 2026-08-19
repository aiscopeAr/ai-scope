import Replicate from "replicate";
import { v2 as cloudinary } from "cloudinary";
import { PrismaClient } from "@prisma/client";

process.loadEnvFile?.(".env");

const prisma = new PrismaClient();

function createReplicateClient() {
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) {
    throw new Error("REPLICATE_API_TOKEN is not set");
  }
  return new Replicate({ auth: token });
}

function configureCloudinary() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    return false;
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });

  return true;
}

function extractOutputUrl(output) {
  if (Array.isArray(output) && output.length > 0) {
    const first = output[0];
    if (typeof first === "string") return first;
    if (first instanceof URL) return first.toString();
    if (first && typeof first.url === "function") {
      const value = first.url();
      return value instanceof URL ? value.toString() : String(value);
    }
    if (first !== null && first !== undefined) return String(first);
  }

  if (typeof output === "string") return output;
  if (output instanceof URL) return output.toString();

  return null;
}

async function generateImage(prompt) {
  const replicate = createReplicateClient();
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
  if (!replicateUrl) {
    return null;
  }

  if (!configureCloudinary()) {
    return null;
  }

  // Fetch the bytes ourselves rather than handing Cloudinary the remote URL:
  // some Replicate output URLs (signed R2/Cloudflare gateway) reject the
  // HEAD/probe request Cloudinary's remote-fetch uploader makes, even though
  // GET succeeds.
  const response = await fetch(replicateUrl, { method: "GET" });
  if (!response.ok) {
    console.error(`Replicate output fetch failed: status=${response.status}`);
    return null;
  }
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.startsWith("image/")) {
    console.error(`Replicate output fetch failed: unexpected content-type "${contentType}"`);
    return null;
  }
  const buffer = Buffer.from(await response.arrayBuffer());

  try {
    const uploaded = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "aiscope/reviews",
          resource_type: "image",
          overwrite: true,
          format: "webp",
          quality: "auto:good",
        },
        (error, result) => {
          if (error || !result) {
            reject(error ?? new Error("Cloudinary upload returned no result"));
            return;
          }
          resolve(result);
        },
      );
      uploadStream.end(buffer);
    });
    return uploaded.secure_url;
  } catch (err) {
    console.error("Cloudinary upload failed:", err.message);
    return null;
  }
}

async function main() {
  const rows = await prisma.review.findMany({
    where: {
      published: true,
      OR: [
        { imageUrl: null },
        { imageUrl: { startsWith: "https://replicate.delivery/" } },
        { imageUrl: { contains: ".replicate.delivery/" } },
        { imageUrl: { contains: ".r2.cloudflarestorage.com/" } },
      ],
    },
    orderBy: { publishedAt: "desc" },
    select: {
      id: true,
      slug: true,
      titleAr: true,
      imageUrl: true,
    },
  });

  if (rows.length === 0) {
    console.log("No published reviews need image backfill.");
    return;
  }

  console.log(`Found ${rows.length} published reviews that need image backfill.`);

  for (const review of rows) {
    const queueItem = await prisma.reviewQueue.findFirst({
      where: { slug: review.slug },
      select: { id: true, featuredImagePrompt: true },
    });

    if (!queueItem?.featuredImagePrompt) {
      console.log(`Skipping ${review.slug}: no featuredImagePrompt found.`);
      continue;
    }

    console.log(`Generating image for ${review.slug}...`);
    const imageUrl = await generateImage(queueItem.featuredImagePrompt);

    if (!imageUrl) {
      console.log(`Failed for ${review.slug}: generator returned null.`);
      continue;
    }

    await prisma.review.update({
      where: { id: review.id },
      data: { imageUrl },
    });

    await prisma.reviewQueue.update({
      where: { id: queueItem.id },
      data: { imageUrl },
    });

    console.log(`Updated ${review.slug}`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
