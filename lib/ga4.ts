import { BetaAnalyticsDataClient } from "@google-analytics/data";

let _client: BetaAnalyticsDataClient | null = null;

export function getGAClient(): BetaAnalyticsDataClient {
  if (_client) return _client;

  const clientEmail = process.env.GA_CLIENT_EMAIL;
  const privateKey   = process.env.GA_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!clientEmail || !privateKey) {
    throw new Error("GA4 credentials not configured (GA_CLIENT_EMAIL / GA_PRIVATE_KEY missing)");
  }

  _client = new BetaAnalyticsDataClient({
    credentials: { client_email: clientEmail, private_key: privateKey },
  });

  return _client;
}

export const GA_PROPERTY_ID = process.env.GA_PROPERTY_ID ?? "";
