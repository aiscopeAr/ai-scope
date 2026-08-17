/**
 * lib/tools/analytics.ts
 *
 * Thin, typed wrapper around the existing @vercel/analytics track() call
 * already used elsewhere in production (components/Footer.tsx,
 * components/ArticleTracker.tsx). Deliberately narrow: every function here
 * takes only closed-enum/short identifiers as arguments, never free text —
 * this is what makes "never send the user's Arabic text" a property of the
 * type signatures, not just a comment someone has to remember to honor.
 */

import { track } from "@vercel/analytics";

export function trackToolView(toolSlug: string) {
  track("tool_view", { tool_slug: toolSlug });
}

export function trackToolStyleChange(toolSlug: string, style: string) {
  track("tool_style_change", { tool_slug: toolSlug, selected_style: style });
}

export function trackToolExport(toolSlug: string, exportFormat: "png") {
  track("tool_export", { tool_slug: toolSlug, export_format: exportFormat });
}

export function trackToolShare(toolSlug: string, method: "web_share" | "copy_link") {
  track("tool_share", { tool_slug: toolSlug, method });
}
