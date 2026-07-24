/**
 * lib/social/url.ts
 *
 * Single source of truth for the canonical Lumiq base URL and UTM-tagged
 * article URLs used by social drafting (lib/review-queue.ts) and sending
 * (app/api/cron/social-queue/route.ts). Both previously rebuilt this
 * independently with three different hardcoded fallback domains — this
 * does not change any *public* article URL, only how the outbound social
 * link is constructed.
 */
import type { SocialPlatform } from "./types";

export const CANONICAL_SITE_URL = "https://www.lumiq.news";

export function getSiteBaseUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? CANONICAL_SITE_URL;
}

/** Stable default campaign value — shared across every Telegram post so
 *  acquisition reporting can group by a single, consistent utm_campaign
 *  rather than one that drifts per call site. */
export const TELEGRAM_CAMPAIGN = "daily_post";

/**
 * utm_content identifies the specific post within the campaign — the review
 * slug itself is already a stable, unique, human-readable identifier that
 * exists on every Review, so it's reused here rather than minting a new id.
 * Falls back to "homepage" only for the no-slug edge case (buildTrackedArticleUrl
 * links to the homepage when no slug is available).
 */
export function buildUtmContent(slug: string | null | undefined): string {
  return slug && slug.length > 0 ? slug : "homepage";
}

export function buildUtmParams(platform: SocialPlatform | string, slug?: string | null, campaign: string = TELEGRAM_CAMPAIGN): string {
  const params = new URLSearchParams({
    utm_source: platform,
    utm_medium: "social",
    utm_campaign: campaign,
    utm_content: buildUtmContent(slug),
  });
  return params.toString();
}

/** Builds the UTM-tagged article URL for a given review slug (or the homepage if no slug). */
export function buildTrackedArticleUrl(slug: string | null | undefined, platform: SocialPlatform | string, campaign?: string): string {
  const baseUrl = getSiteBaseUrl();
  const utm = buildUtmParams(platform, slug, campaign);
  return slug ? `${baseUrl}/reviews/${slug}?${utm}` : `${baseUrl}?${utm}`;
}
