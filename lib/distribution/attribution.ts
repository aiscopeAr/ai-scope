/**
 * lib/distribution/attribution.ts
 *
 * Deterministic GA4 UTM-tagged attribution URLs for outbound backlinks the
 * Distribution Engine places on partner sites (WordPress today, any future
 * target type tomorrow). Generic on purpose — nothing here references
 * "wordpress" or any specific partner name; every Formatter for every
 * targetType builds its backlinks by calling these two functions with a
 * `partnerId` read from the target's own DistributionTargetConfig.partnerId
 * (see lib/distribution/types.ts), never a hardcoded string.
 *
 * UTM parameter contract (fixed, not configurable per call — the mission
 * this module implements is explicit that naming must be deterministic,
 * not invented per partner):
 *   utm_source   = partnerId
 *   utm_medium   = "referral"
 *   utm_campaign = "partner_distribution"
 *   utm_content  = the review slug (article link) or "homepage" (homepage link)
 */

import { SITE_URL } from "@/lib/seo";

const UTM_MEDIUM = "referral";
const UTM_CAMPAIGN = "partner_distribution";

/** Lowercases and strips anything that isn't a lowercase ASCII letter,
 *  digit, or underscore — the same "safe to place in a URL query string
 *  unencoded, deterministic" guarantee DistributionTargetConfig.partnerId
 *  documents. Applied defensively here too (not just at config-write time)
 *  so a malformed partnerId can never produce a malformed UTM parameter —
 *  it produces an empty one instead, which callers should treat as "no
 *  valid partnerId configured" rather than silently emitting bad tracking. */
export function normalizePartnerId(partnerId: string): string {
  return partnerId.trim().toLowerCase().replace(/[^a-z0-9_]/g, "_").replace(/_+/g, "_").replace(/^_|_$/g, "");
}

/** Builds the UTM-tagged original-article backlink:
 *  https://www.lumiq.news/reviews/<slug>?utm_source=<partner>&utm_medium=referral&utm_campaign=partner_distribution&utm_content=<slug>
 *
 *  `slug` is used both in the path and as utm_content, per the mission's
 *  explicit standard — not re-derived independently, so the two can never
 *  drift apart. */
export function buildArticleAttributionUrl(partnerId: string, slug: string): string {
  const partner = normalizePartnerId(partnerId);
  const url = new URL(`${SITE_URL}/reviews/${slug}`);
  url.searchParams.set("utm_source", partner);
  url.searchParams.set("utm_medium", UTM_MEDIUM);
  url.searchParams.set("utm_campaign", UTM_CAMPAIGN);
  url.searchParams.set("utm_content", slug);
  return url.toString();
}

/** Builds the UTM-tagged homepage backlink:
 *  https://www.lumiq.news/?utm_source=<partner>&utm_medium=referral&utm_campaign=partner_distribution&utm_content=homepage */
export function buildHomepageAttributionUrl(partnerId: string): string {
  const partner = normalizePartnerId(partnerId);
  const url = new URL(`${SITE_URL}/`);
  url.searchParams.set("utm_source", partner);
  url.searchParams.set("utm_medium", UTM_MEDIUM);
  url.searchParams.set("utm_campaign", UTM_CAMPAIGN);
  url.searchParams.set("utm_content", "homepage");
  return url.toString();
}
