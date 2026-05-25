import Replicate from "replicate";
import { uploadImageFromUrl } from "@/lib/cloudinary";

let client: Replicate | null = null;

function getClient(): Replicate {
  if (client) return client;

  const apiToken = process.env.REPLICATE_API_TOKEN;
  if (!apiToken) {
    throw new Error("REPLICATE_API_TOKEN is not set");
  }

  client = new Replicate({ auth: apiToken });
  return client;
}

function extractOutputUrl(output: unknown): string | null {
  if (Array.isArray(output) && output.length > 0) {
    const first = output[0];
    if (typeof first === "string") return first;
    if (first instanceof URL) return first.toString();
    if (first && typeof (first as { url?: () => unknown }).url === "function") {
      const value = (first as { url: () => unknown }).url();
      return value instanceof URL ? value.toString() : String(value);
    }
    if (first !== null && first !== undefined) return String(first);
  }

  if (typeof output === "string") return output;
  if (output instanceof URL) return output.toString();

  return null;
}

export async function generateReviewImage(prompt: string): Promise<string | null> {
  try {
    const replicate = getClient();
    const safePrompt = `${prompt}, digital art, dark background, cinematic lighting, high quality, no text, no watermark`;

    const output = await replicate.run("black-forest-labs/flux-schnell", {
      input: {
        prompt: safePrompt,
        num_outputs: 1,
        aspect_ratio: "16:9",
        output_format: "webp",
        output_quality: 80,
        go_fast: true,
      },
    });

    const replicateUrl = extractOutputUrl(output);
    if (!replicateUrl) {
      console.error("[images] Replicate returned no output URL");
      return null;
    }

    try {
      const cloudinaryUrl = await uploadImageFromUrl(replicateUrl, "aiscope/reviews");
      if (cloudinaryUrl) return cloudinaryUrl;
    } catch (cloudErr) {
      console.error(
        "[images] Cloudinary upload failed, falling back to Replicate URL:",
        cloudErr instanceof Error ? cloudErr.message : cloudErr,
      );
    }

    // Fallback to the Replicate URL instead of losing the image entirely.
    return replicateUrl;
  } catch (err) {
    console.error("[images] Review image generation failed:", err instanceof Error ? err.message : err);
    return null;
  }
}
