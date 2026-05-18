import type { SocialProvider, SocialPostPayload } from "../types";

// TikTok Content Posting API v2 — requires video, stub for future use
export const tiktokProvider: SocialProvider = {
  platform: "tiktok",

  async send(_payload: SocialPostPayload, _credentials: Record<string, string>) {
    // TikTok API requires video content — not yet supported for text/image posts
    // Implement when video generation is added to the pipeline
    throw new Error("TikTok provider: video content required — not yet implemented");
  },
};
