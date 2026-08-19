import Replicate from "replicate";
import { uploadImageFromUrl, type ImagePipelineContext } from "@/lib/cloudinary";

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

function logStage(
  stage: string,
  status: "start" | "success" | "failed",
  ctx: ImagePipelineContext,
  extra?: string,
) {
  const parts = [
    `stage=${stage}`,
    `status=${status}`,
    `correlation_id=${ctx.correlationId ?? "-"}`,
    `review_id=${ctx.reviewId ?? "-"}`,
  ];
  if (extra) parts.push(extra);
  console.error(`[image-pipeline] ${parts.join(" ")}`);
}

export async function generateReviewImage(
  prompt: string,
  ctx: ImagePipelineContext = {},
): Promise<string | null> {
  let replicateUrl: string | null;
  logStage("replicate_generation", "start", ctx);
  try {
    const replicate = getClient();
    const safePrompt = `${prompt}, digital art, dark background, cinematic lighting, high quality, no text, no watermark`;

    // Poll for a true terminal state instead of the default blocking mode:
    // block mode's server-side synchronous wait can return early while the
    // prediction is still "processing" (output still null) if generation
    // takes longer than its hold window, which run() otherwise mistakes for
    // completion.
    const output = await replicate.run("black-forest-labs/flux-schnell", {
      input: {
        prompt: safePrompt,
        num_outputs: 1,
        aspect_ratio: "16:9",
        output_format: "webp",
        output_quality: 80,
        go_fast: true,
      },
      wait: { mode: "poll", interval: 500 },
    });

    replicateUrl = extractOutputUrl(output);
    if (!replicateUrl) {
      logStage("replicate_generation", "failed", ctx, "error=no output URL in response");
      return null;
    }
    logStage("replicate_generation", "success", ctx);
  } catch (err) {
    logStage(
      "replicate_generation",
      "failed",
      ctx,
      `error=${err instanceof Error ? err.message : "generation failed"}`,
    );
    return null;
  }

  // uploadImageFromUrl fetches the bytes itself and only ever returns a
  // permanent res.cloudinary.com URL or null — never the temporary/signed
  // Replicate URL, which can expire or reject probing (e.g. HEAD 403).
  // It emits its own replicate_output_fetch/cloudinary_upload stage logs.
  logStage("image_persist", "start", ctx);
  const cloudinaryUrl = await uploadImageFromUrl(replicateUrl, "aiscope/reviews", ctx);
  if (!cloudinaryUrl) {
    logStage("image_persist", "failed", ctx, "error=no permanent URL produced");
    return null;
  }
  logStage("image_persist", "success", ctx, `host=${new URL(cloudinaryUrl).hostname}`);
  return cloudinaryUrl;
}
