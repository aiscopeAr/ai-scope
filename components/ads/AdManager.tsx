"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import OverlayAd, { type OverlayAdData } from "./OverlayAd";

interface ActiveAd extends OverlayAdData {
  frequencyHours: number;
  priority: number;
  startAt: string | null;
  endAt: string | null;
  pages: string[];
}

const SEEN_PREFIX = "lumiq_ad_seen_";

function lastSeen(id: string): number {
  try {
    const v = localStorage.getItem(SEEN_PREFIX + id);
    return v ? parseInt(v, 10) || 0 : 0;
  } catch {
    return 0;
  }
}

function markSeen(id: string) {
  try {
    localStorage.setItem(SEEN_PREFIX + id, String(Date.now()));
  } catch {
    /* private mode / blocked storage — ad simply shows again next time */
  }
}

/**
 * Mounted once in the root layout. Fetches active overlay ads, applies schedule
 * window + page targeting + per-visitor frequency cap, and shows at most one
 * blocking modal (popup/interstitial) and one anchored unit
 * (sticky-bottom/sidebar-sticky) — the highest priority of each.
 */
export default function AdManager() {
  const pathname = usePathname();
  const [ads, setAds] = useState<ActiveAd[]>([]);
  const [closed, setClosed] = useState<Set<string>>(new Set());
  // Captured once at mount (lazy init) — keeps render pure and gives a stable
  // reference time for the schedule window & frequency-cap checks below.
  const [now] = useState(() => Date.now());

  useEffect(() => {
    let alive = true;
    fetch("/api/ads/active")
      .then((r) => (r.ok ? r.json() : []))
      .then((data: ActiveAd[]) => { if (alive) setAds(Array.isArray(data) ? data : []); })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  // Never overlay the admin area.
  if (pathname?.startsWith("/admin")) return null;

  const eligible = ads.filter((ad) => {
    if (closed.has(ad.id)) return false;
    if (ad.startAt && new Date(ad.startAt).getTime() > now) return false;
    if (ad.endAt && new Date(ad.endAt).getTime() < now) return false;
    if (ad.pages.length > 0 && !ad.pages.some((p) => pathname?.startsWith(p))) return false;
    if (ad.frequencyHours > 0 && now - lastSeen(ad.id) < ad.frequencyHours * 3_600_000) return false;
    return true;
  });

  // ads arrive priority-desc from the API; pick the first of each group.
  const modal = eligible.find((a) => a.format === "popup" || a.format === "interstitial");
  const anchor = eligible.find((a) => a.format === "sticky-bottom" || a.format === "sidebar-sticky");

  const chosen = [modal, anchor].filter(Boolean) as ActiveAd[];
  if (chosen.length === 0) return null;

  return (
    <>
      {chosen.map((ad) => (
        <OverlayShown key={ad.id} ad={ad} onClose={() => setClosed((s) => new Set(s).add(ad.id))} />
      ))}
    </>
  );
}

/** Records the showing for frequency capping on first paint, then renders. */
function OverlayShown({ ad, onClose }: { ad: ActiveAd; onClose: () => void }) {
  useEffect(() => { markSeen(ad.id); }, [ad.id]);
  return <OverlayAd ad={ad} onClose={onClose} />;
}
