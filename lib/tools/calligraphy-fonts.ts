/**
 * lib/tools/calligraphy-fonts.ts
 *
 * next/font/google calls must be evaluated at module scope (Next.js's
 * compiler statically extracts them), so this file is imported once by
 * the arabic-calligraphy page — not by CalligraphyStudio.tsx itself, which
 * is a client component. All five fonts load with display: "swap" and are
 * scoped to this tool via distinct CSS variable names (--font-calligraphy-*),
 * so they never collide with or affect the site-wide --font-serif/--font-sans
 * variables app/layout.tsx already defines for Amiri/Cairo.
 *
 * Loaded only on /tools/arabic-calligraphy — no other route imports this
 * file, so these five extra font families never ship on any other page.
 */

import { Amiri, Scheherazade_New, Reem_Kufi, Aref_Ruqaa, Rakkas } from "next/font/google";

const amiri = Amiri({
  subsets: ["arabic"],
  weight: ["400", "700"],
  variable: "--font-calligraphy-amiri",
  display: "swap",
});

const scheherazade = Scheherazade_New({
  subsets: ["arabic"],
  weight: ["400", "700"],
  variable: "--font-calligraphy-scheherazade",
  display: "swap",
});

const reemKufi = Reem_Kufi({
  subsets: ["arabic"],
  weight: ["400", "700"],
  variable: "--font-calligraphy-reem-kufi",
  display: "swap",
});

const arefRuqaa = Aref_Ruqaa({
  subsets: ["arabic"],
  weight: ["400", "700"],
  variable: "--font-calligraphy-aref-ruqaa",
  display: "swap",
});

const rakkas = Rakkas({
  subsets: ["arabic"],
  weight: ["400"],
  variable: "--font-calligraphy-rakkas",
  display: "swap",
});

export const CALLIGRAPHY_FONT_VARIABLES = [
  amiri.variable,
  scheherazade.variable,
  reemKufi.variable,
  arefRuqaa.variable,
  rakkas.variable,
].join(" ");
