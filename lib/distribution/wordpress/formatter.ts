/**
 * lib/distribution/wordpress/formatter.ts
 *
 * The WordPress Formatter — implements the Distribution Engine's Formatter
 * contract (lib/distribution/formatter.ts). Pure content transform: no I/O,
 * no network, no persistence. Turns a DistributableContent into the exact
 * fields a WordPress REST post creation call needs; the WordPress
 * Transport (transport.ts) is responsible for actually sending them.
 */

import type { DistributableContent, Formatter, FormattedContent } from "../formatter";
import type { DistributionTargetConfig } from "../types";
import { buildWordPressBodyHtml } from "./html";
import { validateWordPressConfig, type WordPressTargetConfig } from "./config";

export const WORDPRESS_TARGET_TYPE = "wordpress";

/** The WordPress-specific payload a Formatter produces. `kind` lets a
 *  Transport (or a future dispatcher) discriminate this from another
 *  target's FormattedContent before casting `body`. */
export interface WordPressFormattedBody {
  title: string;
  contentHtml: string;
  excerpt: string;
  slug: string;
  sourceUrl: string;
  imageUrl?: string;
  categoryIds: number[];
  status: "draft" | "publish";
  authorId?: number;
}

export type WordPressFormattedContent = FormattedContent & { kind: "wordpress-post"; body: WordPressFormattedBody };

/** Derives a WordPress-safe slug from a title when no explicit slug is
 *  available on the content. WordPress itself will also normalize/dedupe
 *  slugs server-side; this is only a best-effort default so a post is
 *  never created with an empty slug field.
 *
 *  The allowed Arabic range (U+0621–U+064A, U+0660–U+0669) covers letters
 *  and digits only — deliberately narrower than the full Arabic Unicode
 *  block (U+0600–U+06FF), which also contains punctuation like ؟ (U+061F)
 *  and ، (U+060C) that has no place in a URL slug. */
function slugify(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9ء-ي٠-٩\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function readExtra(config: DistributionTargetConfig): Record<string, unknown> {
  return config.extra ?? {};
}

/**
 * Extracts and validates the WordPress-specific settings a Formatter needs
 * from a generic DistributionTargetConfig's `extra` bag. Throws (rather
 * than silently formatting with defaults) if the config is not a valid
 * WordPressTargetConfig — a malformed target configuration must never
 * produce a plausible-looking but wrong payload.
 */
export function readWordPressTargetConfig(config: DistributionTargetConfig): WordPressTargetConfig {
  const extra = readExtra(config);
  const result = validateWordPressConfig(extra);
  if (!result.valid) {
    throw new Error(`Invalid WordPress target config: ${result.errors.join("; ")}`);
  }
  return extra as unknown as WordPressTargetConfig;
}

export const wordPressFormatter: Formatter = {
  targetType: WORDPRESS_TARGET_TYPE,

  format(content: DistributableContent, config: DistributionTargetConfig): WordPressFormattedContent {
    const wpConfig = readWordPressTargetConfig(config);

    if (!content.canonicalUrl) {
      throw new Error("DistributableContent.canonicalUrl is required to build the WordPress attribution footer");
    }

    const contentHtml = buildWordPressBodyHtml(content.body, content.canonicalUrl);

    return {
      kind: "wordpress-post",
      body: {
        title: content.title,
        contentHtml,
        excerpt: content.summary ?? "",
        slug: slugify(content.title),
        sourceUrl: content.canonicalUrl,
        imageUrl: content.imageUrl,
        categoryIds: wpConfig.categoryIds,
        status: wpConfig.defaultStatus,
        authorId: wpConfig.authorId,
      },
    };
  },
};
