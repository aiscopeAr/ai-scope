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

type StageStatus = "start" | "prediction_created" | "processing" | "success" | "failed";

function logStage(
  stage: string,
  status: StageStatus,
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

const POLL_INTERVAL_MS = 500;
const POLL_TIMEOUT_MS = 120_000;

const TERMINAL_STATUSES = new Set(["succeeded", "failed", "canceled", "aborted"]);

/**
 * Create a prediction and poll replicate.predictions.get() directly until a
 * genuine terminal status is reached, instead of relying on replicate.run()'s
 * timing behavior. run() proved unreliable in production twice: its
 * server-side blocking wait can mistake "processing" for done (fixed by
 * requesting poll mode), and even in poll mode it returned before the
 * prediction had actually reached "succeeded" — a race inside run() itself
 * that isn't visible or controllable from the outside. Owning the create/get
 * loop directly removes that dependency entirely: output is read only after
 * this code has observed status === "succeeded" with its own eyes.
 */
async function pollUntilTerminal(
  replicate: Replicate,
  predictionId: string,
  ctx: ImagePipelineContext,
): Promise<{ status: string; output: unknown; error: unknown }> {
  const deadline = Date.now() + POLL_TIMEOUT_MS;
  let lastStatus: string | null = null;

  for (;;) {
    const prediction = await replicate.predictions.get(predictionId);

    // Log status transitions only — never one line per 500ms poll.
    if (prediction.status !== lastStatus) {
      lastStatus = prediction.status;
      if (prediction.status === "succeeded") {
        logStage("replicate_generation", "success", ctx, `prediction_id=${predictionId}`);
      } else if (prediction.status === "processing") {
        logStage("replicate_generation", "processing", ctx, `prediction_id=${predictionId}`);
      } else if (prediction.status === "failed" || prediction.status === "canceled" || prediction.status === "aborted") {
        logStage(
          "replicate_generation",
          "failed",
          ctx,
          `prediction_id=${predictionId} status=${prediction.status}`,
        );
      }
    }

    if (TERMINAL_STATUSES.has(prediction.status)) {
      return { status: prediction.status, output: prediction.output, error: prediction.error };
    }

    if (Date.now() >= deadline) {
      logStage(
        "replicate_generation",
        "failed",
        ctx,
        `prediction_id=${predictionId} reason=timeout`,
      );
      return { status: "timeout", output: null, error: "polling timed out" };
    }

    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }
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

    const prediction = await replicate.predictions.create({
      model: "black-forest-labs/flux-schnell",
      input: {
        prompt: safePrompt,
        num_outputs: 1,
        aspect_ratio: "16:9",
        output_format: "webp",
        output_quality: 80,
        go_fast: true,
      },
      wait: false,
    });
    logStage("replicate_generation", "prediction_created", ctx, `prediction_id=${prediction.id}`);

    // pollUntilTerminal only returns once it has directly observed a terminal
    // status via predictions.get() — output is never read before that.
    const result = await pollUntilTerminal(replicate, prediction.id, ctx);

    if (result.status === "timeout") {
      return null;
    }
    if (result.status !== "succeeded") {
      // pollUntilTerminal already logged the failed/canceled/aborted transition.
      return null;
    }

    replicateUrl = extractOutputUrl(result.output);
    if (!replicateUrl) {
      logStage(
        "replicate_generation",
        "failed",
        ctx,
        `prediction_id=${prediction.id} error=succeeded with no output URL`,
      );
      return null;
    }
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
