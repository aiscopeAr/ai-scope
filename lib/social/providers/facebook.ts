import type { SocialProvider, SocialPostPayload } from "../types";

export const facebookProvider: SocialProvider = {
  platform: "facebook",

  async send(payload: SocialPostPayload, credentials: Record<string, string>) {
    const { pageId, accessToken } = credentials;

    if (!pageId || !accessToken) {
      throw new Error("Facebook: missing pageId or accessToken");
    }

    const message = `${payload.caption}\n\n${payload.articleUrl}`;

    const res = await fetch(`https://graph.facebook.com/v19.0/${pageId}/feed`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, access_token: accessToken }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Facebook API error: ${err}`);
    }

    const data = await res.json() as { id: string };
    return { id: data.id };
  },
};
