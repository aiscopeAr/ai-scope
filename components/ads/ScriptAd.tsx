"use client";

import { useEffect, useRef, useState } from "react";
import { CONSENT_EVENT, consentAllows } from "@/lib/ads/consent";

/**
 * ScriptAd — renders an ad network snippet (AdSense, Taboola, Outbrain, …) so
 * that its <script> tags ACTUALLY EXECUTE.
 *
 * Why this exists: setting innerHTML (or React's dangerouslySetInnerHTML) does
 * NOT run injected <script> elements — the HTML parser inserts them inert per
 * the HTML spec. So a plain `<div dangerouslySetInnerHTML>` renders AdSense/
 * Taboola markup but never runs their loaders, and no ad appears.
 *
 * Fix: inject the non-script markup, then for every <script> create a fresh
 * element, copy its attributes/inline code, and append it — which the browser
 * executes. Runs once (guarded) and only in the browser.
 *
 * Consent: for consent-gated networks (adsense/taboola/outbrain) the snippet is
 * withheld until the visitor grants consent; it injects immediately once the
 * ConsentBanner fires a consent-change event. `direct` house ads never wait.
 */
export default function ScriptAd({ code, name, network = "direct" }: { code: string; name?: string; network?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const done = useRef(false);
  const [allowed, setAllowed] = useState(false);

  // Resolve consent on mount + whenever it changes. (Deferred out of the effect
  // body per the project's set-state-in-effect lint rule.)
  useEffect(() => {
    const check = () => setAllowed(consentAllows(network));
    const t = setTimeout(check, 0);
    window.addEventListener(CONSENT_EVENT, check);
    return () => { clearTimeout(t); window.removeEventListener(CONSENT_EVENT, check); };
  }, [network]);

  useEffect(() => {
    const host = ref.current;
    if (!host || done.current || !allowed) return;
    done.current = true;

    // Parse off-DOM so scripts don't auto-run on assignment.
    const tpl = document.createElement("template");
    tpl.innerHTML = code;
    host.appendChild(tpl.content.cloneNode(true));

    // Re-create every <script> so the browser executes it.
    host.querySelectorAll("script").forEach((old) => {
      const s = document.createElement("script");
      for (const { name: attr, value } of Array.from(old.attributes)) {
        s.setAttribute(attr, value);
      }
      if (old.textContent) s.textContent = old.textContent;
      old.replaceWith(s);
    });
  }, [code, allowed]);

  return <div ref={ref} className="w-full overflow-hidden" data-ad-name={name} />;
}
