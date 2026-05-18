import type { SocialProvider, SocialPostPayload } from "../types";

export const twitterProvider: SocialProvider = {
  platform: "twitter",

  async send(payload: SocialPostPayload, credentials: Record<string, string>) {
    const { apiKey, apiSecret, accessToken, accessTokenSecret } = credentials;

    if (!apiKey || !apiSecret || !accessToken || !accessTokenSecret) {
      throw new Error("Twitter: missing credentials");
    }

    // OAuth 1.0a signature
    const text = `${payload.caption}\n\n${payload.articleUrl}`.slice(0, 280);

    const oauthHeader = buildOAuthHeader("POST", "https://api.twitter.com/2/tweets", {
      apiKey,
      apiSecret,
      accessToken,
      accessTokenSecret,
    });

    const res = await fetch("https://api.twitter.com/2/tweets", {
      method: "POST",
      headers: {
        Authorization: oauthHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Twitter API error: ${err}`);
    }

    const data = await res.json() as { data: { id: string } };
    return { id: data.data.id };
  },
};

function buildOAuthHeader(
  method: string,
  url: string,
  creds: { apiKey: string; apiSecret: string; accessToken: string; accessTokenSecret: string }
): string {
  const nonce = Math.random().toString(36).slice(2) + Date.now().toString(36);
  const timestamp = Math.floor(Date.now() / 1000).toString();

  const oauthParams: Record<string, string> = {
    oauth_consumer_key: creds.apiKey,
    oauth_nonce: nonce,
    oauth_signature_method: "HMAC-SHA256",
    oauth_timestamp: timestamp,
    oauth_token: creds.accessToken,
    oauth_version: "1.0",
  };

  // Build base string
  const paramString = Object.entries(oauthParams)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join("&");

  const baseString = [
    method.toUpperCase(),
    encodeURIComponent(url),
    encodeURIComponent(paramString),
  ].join("&");

  const signingKey = `${encodeURIComponent(creds.apiSecret)}&${encodeURIComponent(creds.accessTokenSecret)}`;

  // HMAC-SHA256 via Web Crypto (available in Node 18+ / Edge runtime)
  const signature = signHmacSha256Sync(signingKey, baseString);
  oauthParams.oauth_signature = signature;

  const headerValue = Object.entries(oauthParams)
    .map(([k, v]) => `${encodeURIComponent(k)}="${encodeURIComponent(v)}"`)
    .join(", ");

  return `OAuth ${headerValue}`;
}

function signHmacSha256Sync(key: string, data: string): string {
  // Node.js crypto — synchronous fallback
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const crypto = require("crypto") as typeof import("crypto");
  return crypto.createHmac("sha256", key).update(data).digest("base64");
}
