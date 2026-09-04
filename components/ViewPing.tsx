"use client";

import { useEffect } from "react";

/**
 * Fire-and-forget view ping — the same client-side tracking architecture as
 * components/ViewTracker.tsx (reviews), but with the endpoint passed in so the
 * AI-tool and prompt pages can increment their own viewCount from the browser.
 *
 * Keeping the increment OFF the Server Component render path is what lets those
 * pages be cached/ISR instead of writing to Neon on every request/crawl. A
 * crawler that does not execute client effects does not increment the count.
 */
export default function ViewPing({ endpoint }: { endpoint: string }) {
  useEffect(() => {
    fetch(endpoint, { method: "POST" });
  }, [endpoint]);

  return null;
}
