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
          prompt: `${prompt}, professional news photo, high quality, realistic, technology`,
          num_outputs: 1,
          aspect_ratio: "16:9",
          output_format: "webp",
          output_quality: 80,
        },
      }
    );

    const urls = output as string[];
    return urls?.[0] ?? null;
  } catch (err) {
    console.error("[replicate] Image generation failed:", err instanceof Error ? err.message : err);
    return null;
  }
}
