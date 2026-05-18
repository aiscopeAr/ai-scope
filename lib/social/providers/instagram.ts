import type { SocialProvider, SocialPostPayload } from "../types";

export const instagramProvider: SocialProvider = {
  platform: "instagram",

  async send(payload: SocialPostPayload, credentials: Record<string, string>) {
    const { igUserId, accessToken } = credentials;

    if (!igUserId || !accessToken) {
      throw new Error("Instagram: missing igUserId or accessToken");
    }

    if (!payload.imageUrl) {
      throw new Error("Instagram: imageUrl is required");
    }

    // Step 1: Create media container
    const createRes = await fetch(
      `https://graph.facebook.com/v19.0/${igUserId}/media`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_url: payload.imageUrl,
          caption: `${payload.caption}\n\n${payload.articleUrl}`,
          access_token: accessToken,
        }),
      }
    );

    if (!createRes.ok) {
      const err = await createRes.text();
      throw new Error(`Instagram create container error: ${err}`);
    }

    const { id: containerId } = await createRes.json() as { id: string };

    // Step 2: Publish
    const publishRes = await fetch(
      `https://graph.facebook.com/v19.0/${igUserId}/media_publish`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ creation_id: containerId, access_token: accessToken }),
      }
    );

    if (!publishRes.ok) {
      const err = await publishRes.text();
      throw new Error(`Instagram publish error: ${err}`);
    }

    const data = await publishRes.json() as { id: string };
    return { id: data.id };
  },
};
