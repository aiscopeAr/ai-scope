import Replicate from "replicate";
import { uploadImageFromUrl } from "@/lib/cloudinary";

let _client: Replicate | null = null;

function getClient(): Replicate {
  if (!_client) {
    const apiToken = process.env.REPLICATE_API_TOKEN;
    if (!apiToken) throw new Error("REPLICATE_API_TOKEN is not set");
    _client = new Replicate({ auth: apiToken });
  }
  return _client;
}

export async function generateArticleImage(prompt: string): Promise<string | null> {
  try {
    const client = getClient();

    const output = await client.run("black-forest-labs/flux-schnell", {
      input: {
        prompt: `${prompt}, professional technology news illustration, high quality`,
        num_outputs: 1,
        aspect_ratio: "16:9",
        output_format: "webp",
        output_quality: 85,
        go_fast: true,
      },
    });

    // Extract temporary Replicate URL
    let replicateUrl: string | null = null;
    if (Array.isArray(output) && output.length > 0) {
      const first = output[0];
      if (typeof first === "string") {
        replicateUrl = first;
      } else if (first && typeof (first as { url?: () => string }).url === "function") {
        replicateUrl = (first as { url: () => string }).url();
      } else {
        replicateUrl = String(first);
      }
    } else if (typeof output === "string") {
      replicateUrl = output;
    }

    if (!replicateUrl) {
      console.error("[replicate] No URL in output");
      return null;
    }

    // Upload to Cloudinary for permanent storage
    try {
      const cloudinaryUrl = await uploadImageFromUrl(replicateUrl);
      if (cloudinaryUrl) return cloudinaryUrl;
    } catch (cloudErr) {
      console.error("[cloudinary] Upload failed:", cloudErr instanceof Error ? cloudErr.message : cloudErr);
    }

    // If Cloudinary fails, return null — don't store expiring Replicate URLs
    return null;
  } catch (err) {
    console.error("[replicate] Generation failed:", err instanceof Error ? err.message : err);
    return null;
  }
}
