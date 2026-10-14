/**
 * lib/ads/consent.ts
 *
 * Lightweight consent state for ad personalization/storage, shared by the
 * ConsentBanner and the ScriptAd gate. Stored in localStorage (fast client
 * read) and mirrored to a cookie (so it can be read server-side later if
 * needed). This is a CMP-lite for MENA traffic; for EEA/UK a Google-certified
 * CMP should be layered on when the AdSense account is live — the same
 * `granted`/`denied` signal drives Google Consent Mode v2 either way.
 */

export type ConsentValue = "granted" | "denied";

export const CONSENT_KEY = "lumiq_ad_consent";
export const CONSENT_EVENT = "lumiq-consent-change";

/** Networks whose scripts must not load before consent. Kept in sync with
 *  CONSENT_REQUIRED_NETWORKS in positions.ts (duplicated to avoid importing a
 *  server-tinged module into tiny client gates). */
export const CONSENT_REQUIRED = ["adsense", "taboola", "outbrain"];

export function readConsent(): ConsentValue | null {
  try {
    const v = localStorage.getItem(CONSENT_KEY);
    return v === "granted" || v === "denied" ? v : null;
  } catch {
    return null;
  }
}

export function writeConsent(value: ConsentValue): void {
  try {
    localStorage.setItem(CONSENT_KEY, value);
    // 180-day cookie mirror.
    document.cookie = `${CONSENT_KEY}=${value}; path=/; max-age=${60 * 60 * 24 * 180}; SameSite=Lax`;
  } catch {
    /* storage blocked — consent simply re-prompts next visit */
  }
  // Notify gates (ScriptAd) listening for live changes.
  try {
    window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: value }));
  } catch {
    /* no-op */
  }
  // Google Consent Mode v2 update, if gtag is present.
  try {
    const w = window as unknown as { gtag?: (...a: unknown[]) => void };
    w.gtag?.("consent", "update", {
      ad_storage: value,
      ad_user_data: value,
      ad_personalization: value,
      analytics_storage: value,
    });
  } catch {
    /* no gtag — fine */
  }
}

/** True when a consent-gated network may load its script right now. */
export function consentAllows(network: string): boolean {
  if (!CONSENT_REQUIRED.includes(network)) return true; // direct/house ads
  return readConsent() === "granted";
}
