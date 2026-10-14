"use client";

import ScriptAd from "./ScriptAd";

/** Renders an ad's creative by type, client-side. Mirrors the inline AdSlot
 *  switch but usable inside overlay components (popup/sticky/interstitial). */
export default function AdBody({ type, code, name, network = "direct" }: { type: string; code: string; name: string; network?: string }) {
  if (type === "script") return <ScriptAd code={code} name={name} network={network} />;
  if (type === "iframe") {
    return (
      <iframe src={code} title={name} loading="lazy" className="w-full border-0" style={{ minHeight: 90 }} />
    );
  }
  // image
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={code} alt={name} className="mx-auto max-w-full" loading="lazy" />;
}
