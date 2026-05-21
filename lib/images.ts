import Replicate from "replicate";

const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

export async function generateReviewImage(prompt: string): Promise<string | null> {
  try {
    const safePrompt = `${prompt}, digital art, dark background, cinematic lighting, high quality, no text, no watermark`;

    const output = await replicate.run("black-forest-labs/flux-schnell", {
      input: {
        prompt: safePrompt,
        num_outputs: 1,
        aspect_ratio: "16:9",
        output_format: "webp",
        output_quality: 80,
      },
    });

    const urls = output as string[];
    return urls?.[0] ?? null;
  } catch (err) {
    console.error("[images] Replicate error:", err);
    return null;
  }
}
