"use client";

import { useEffect, useRef } from "react";

/**
 * ScriptAd — renders an ad network snippet (AdSense, Taboola, Outbrain, …) so
 * that its <script> tags ACTUALLY EXECUTE.
 *
 * Why this exists: setting innerHTML (or React's dangerouslySetInnerHTML) does
 * NOT run injected <script> elements — the HTML parser inserts them inert per
 * the HTML spec. So the previous `<div dangerouslySetInnerHTML>` path rendered
 * AdSense/Taboola markup but never ran their loaders, and no ad appeared.
 *
 * Fix: inject the non-script markup, then for every <script> create a fresh
 * element, copy its attributes/inline code, and append it — which the browser
 * executes. Runs once per mount (guarded) and only in the browser.
 */
export default function ScriptAd({ code, name }: { code: string; name?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const done = useRef(false);

  useEffect(() => {
    const host = ref.current;
    if (!host || done.current) return;
    done.current = true;

    // Parse the snippet off-DOM so scripts don't auto-run on assignment.
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
  }, [code]);

  return <div ref={ref} className="w-full overflow-hidden" data-ad-name={name} />;
}
