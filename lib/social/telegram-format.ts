/**
 * lib/social/telegram-format.ts
 *
 * Builds the Telegram message body as valid Telegram HTML (the provider
 * sends with parse_mode: "HTML"). Previously the caption used Markdown-style
 * `*asterisks*` for bold while the API call requested HTML parsing — those
 * two never agreed, so titles rendered with literal asterisk characters
 * instead of bold text. This module is the single place that produces
 * Telegram-bound text, so the tag and the parse_mode can never drift apart
 * again.
 *
 * Telegram's HTML parse mode only recognizes a small allowlist of tags
 * (https://core.telegram.org/bots/api#html-style) — anything else, including
 * a raw `<`, `>`, or `&` from an editor/AI-generated title or summary, must
 * be escaped or Telegram rejects the whole message (400 Bad Request:
 * can't parse entities). escapeTelegramHtml() is the only thing allowed to
 * introduce a literal `<b>`/`</b>` tag; every other piece of dynamic text
 * passed through it first.
 */

/** Escapes the 3 characters Telegram's HTML parser treats as markup. */
export function escapeTelegramHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

const MAX_SUMMARY_CHARS = 200;

/** Sentence-aware truncation: cuts at the last sentence boundary (.!?؟) within
 *  the limit; falls back to a hard cut only if no boundary exists — preserves
 *  the previous hard-truncation behavior as a safe fallback rather than a
 *  regression. */
export function truncateSummary(text: string, maxChars = MAX_SUMMARY_CHARS): string {
  if (text.length <= maxChars) return text;

  const slice = text.slice(0, maxChars);
  const lastBoundary = Math.max(
    slice.lastIndexOf(". "),
    slice.lastIndexOf("! "),
    slice.lastIndexOf("? "),
    slice.lastIndexOf("؟ "),
    slice.lastIndexOf(". \n"),
  );

  // Only trust the boundary if it doesn't throw away most of the excerpt.
  if (lastBoundary > maxChars * 0.4) {
    return slice.slice(0, lastBoundary + 1).trim();
  }
  return slice.trim();
}

/**
 * Builds the Telegram caption body (title + summary), safely escaped, with
 * the title bold via a real HTML tag. The tracked article URL and any
 * remaining caption assembly (stripping stray URLs, appending the link) stay
 * in the provider — this function only owns the part that must match
 * parse_mode: "HTML".
 */
export function buildTelegramCaption(title: string, summary: string): string {
  const safeTitle = escapeTelegramHtml(title);
  const safeSummary = escapeTelegramHtml(truncateSummary(summary));
  return `📰 <b>${safeTitle}</b>\n\n${safeSummary}`;
}
