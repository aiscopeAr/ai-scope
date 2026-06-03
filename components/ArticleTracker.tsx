"use client";

import { useEffect, useRef } from "react";
import { track } from "@vercel/analytics";

interface Props {
  slug: string;
  category?: string;
}

export default function ArticleTracker({ slug, category }: Props) {
  const startTime = useRef(Date.now());
  const tracked = useRef({ s30: false, s60: false, s120: false, scroll25: false, scroll50: false, scroll75: false, scroll100: false });

  useEffect(() => {
    // ── Time on page ──────────────────────────────────────────
    const intervals = [
      setTimeout(() => {
        if (!tracked.current.s30) { tracked.current.s30 = true; track("time_on_page", { slug, category, seconds: 30 }); }
      }, 30_000),
      setTimeout(() => {
        if (!tracked.current.s60) { tracked.current.s60 = true; track("time_on_page", { slug, category, seconds: 60 }); }
      }, 60_000),
      setTimeout(() => {
        if (!tracked.current.s120) { tracked.current.s120 = true; track("time_on_page", { slug, category, seconds: 120 }); }
      }, 120_000),
    ];

    // ── Scroll depth ──────────────────────────────────────────
    function onScroll() {
      const scrolled = window.scrollY + window.innerHeight;
      const total = document.documentElement.scrollHeight;
      const pct = (scrolled / total) * 100;

      if (pct >= 25 && !tracked.current.scroll25) {
        tracked.current.scroll25 = true;
        track("scroll_depth", { slug, category, depth: 25 });
      }
      if (pct >= 50 && !tracked.current.scroll50) {
        tracked.current.scroll50 = true;
        track("scroll_depth", { slug, category, depth: 50 });
      }
      if (pct >= 75 && !tracked.current.scroll75) {
        tracked.current.scroll75 = true;
        track("scroll_depth", { slug, category, depth: 75 });
      }
      if (pct >= 95 && !tracked.current.scroll100) {
        tracked.current.scroll100 = true;
        track("scroll_depth", { slug, category, depth: 100 });
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true });

    // ── Exit: track total time ────────────────────────────────
    function onExit() {
      const sec = Math.round((Date.now() - startTime.current) / 1000);
      if (sec >= 5) track("exit_time", { slug, category, seconds: sec });
    }
    window.addEventListener("beforeunload", onExit);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") onExit();
    });

    return () => {
      intervals.forEach(clearTimeout);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("beforeunload", onExit);
    };
  }, [slug, category]);

  return null;
}
