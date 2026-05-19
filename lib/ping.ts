import { SITE_URL } from "@/lib/seo";

const GOOGLE_PING = "https://www.google.com/ping";

/**
 * Notify Google of a new/updated sitemap entry.
 * Called after publishing an article — fire-and-forget, never throws.
 */
export async function pingGoogleNews(): Promise<void> {
  const sitemapUrl = `${SITE_URL}/news-sitemap.xml`;
  const url = `${GOOGLE_PING}?sitemap=${encodeURIComponent(sitemapUrl)}`;

  try {
    const res = await fetch(url, { method: "GET", signal: AbortSignal.timeout(5000) });
    if (!res.ok) {
      console.warn(`[ping] Google responded ${res.status} for ${sitemapUrl}`);
    }
  } catch (err) {
    console.warn("[ping] Google ping failed (non-fatal):", err instanceof Error ? err.message : err);
  }
}

export async function pingGoogleSitemap(): Promise<void> {
  const sitemapUrl = `${SITE_URL}/sitemap.xml`;
  const url = `${GOOGLE_PING}?sitemap=${encodeURIComponent(sitemapUrl)}`;

  try {
    const res = await fetch(url, { method: "GET", signal: AbortSignal.timeout(5000) });
    if (!res.ok) {
      console.warn(`[ping] Google sitemap responded ${res.status}`);
    }
  } catch (err) {
    console.warn("[ping] Google sitemap ping failed (non-fatal):", err instanceof Error ? err.message : err);
  }
}
