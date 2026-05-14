import Replicate from "replicate";

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

    const output = await client.run(
      "black-forest-labs/flux-schnell",
      {
        input: {
          prompt: `${prompt}, professional technology news illustration, high quality`,
          num_outputs: 1,
          aspect_ratio: "16:9",
          output_format: "webp",
          output_quality: 80,
          go_fast: true,
        },
      }
    );

    // Flux Schnell returns a FileOutput array or string array
    if (Array.isArray(output) && output.length > 0) {
      const first = output[0];
      // FileOutput object has a url() method or toString()
      if (typeof first === "string") return first;
      if (first && typeof (first as { url?: () => string }).url === "function") {
        return (first as { url: () => string }).url();
      }
      return String(first);
    }

    // Single string
    if (typeof output === "string") return output;

    return null;
  } catch (err) {
    console.error("[replicate] Image generation failed:", err instanceof Error ? err.message : err);
    return null;
  }
}
