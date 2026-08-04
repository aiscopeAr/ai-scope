/**
 * lib/social/editorial-score.ts
 *
 * Internal editorial scoring for a Telegram message (Telegram Experience
 * Sprint 5, P2). Purely a diagnostic — never sent to Telegram, never part
 * of renderTelegramMessage() or the provider's payload. The only caller is
 * the admin preview endpoint, so an editor can see a quality signal before
 * approving a post; the score has zero effect on what actually gets sent.
 *
 * Deterministic and rule-based (no LLM) — every sub-score is computed from
 * fields already available on TelegramMessageParts plus the raw headline
 * text, matching the rest of this module's "derived from real data only"
 * discipline.
 */
import type { TelegramMessageParts } from "./telegram-templates";

export interface EditorialScoreBreakdown {
  headline: number;
  readability: number;
  visualQuality: number;
  ctrPotential: number;
  brandConsistency: number;
  overall: number;
}

// \b (word boundary) does not work reliably against Arabic script in JS
// regex — Arabic letters fall outside \w, so \b silently fails right after
// "هل". Matching an explicit boundary (space or end-of-string) instead.
const QUESTION_OPENERS = /^(هل|كيف)(\s|$)/;

/**
 * Headline score: penalizes the exact failure mode the Sprint 4 audit found
 * (94% of real headlines opening with "هل"/"كيف") and rewards a length that
 * renders cleanly on a phone screen without truncation.
 */
function scoreHeadline(headline: string): number {
  let score = 100;

  if (QUESTION_OPENERS.test(headline.trim())) score -= 30;
  if (headline.endsWith("…")) score -= 15; // was truncated — a Sprint 4 finding in itself
  if (headline.length > 90) score -= 10;
  if (headline.length < 15) score -= 20; // too thin to carry a real angle

  return Math.max(0, Math.min(100, score));
}

/**
 * Readability score: rewards the structural elements the premium layout
 * (Sprint 5) adds over the old flat paragraph — bulleted facts, a stated
 * reading time, a summary that wasn't hard-cut mid-sentence.
 */
function scoreReadability(parts: TelegramMessageParts): number {
  let score = 40; // baseline for having a summary at all

  if (parts.highlights.length > 0) score += 25;
  if (parts.highlights.length >= 2) score += 10;
  if (parts.readingMinutes && parts.readingMinutes > 0) score += 15;
  if (!parts.summary.endsWith("…")) score += 10; // clean sentence boundary, not a hard cut

  return Math.max(0, Math.min(100, score));
}

/**
 * Visual quality score: rewards having exactly one template identity
 * (icon + label), a bounded hashtag count, and a non-generic template
 * (i.e. not falling back to "general" for lack of a stronger signal).
 */
function scoreVisualQuality(parts: TelegramMessageParts): number {
  let score = 50;

  if (parts.template !== "general") score += 25;
  if (parts.hashtags.length > 0 && parts.hashtags.length <= 4) score += 15;
  if (parts.hashtags.length === 0) score -= 15;

  return Math.max(0, Math.min(100, score));
}

/**
 * CTR-potential score: a proxy for "will this make someone tap" — a
 * template-matched CTA (not the generic fallback phrase) and the presence
 * of concrete facts (highlights) both correlate with intent to click, per
 * the Sprint 4 audit's qualitative read of the strongest real examples.
 */
function scoreCtrPotential(parts: TelegramMessageParts): number {
  let score = 45;

  if (parts.highlights.length > 0) score += 20;
  if (parts.hashtags.length > 0) score += 10;
  if (parts.template !== "general") score += 15;
  if (!QUESTION_OPENERS.test(parts.headline.trim())) score += 10;

  return Math.max(0, Math.min(100, score));
}

/**
 * Brand-consistency score: checks the structural invariants the premium
 * layout guarantees when renderTelegramMessage() is actually used — one
 * template icon, no literal Markdown asterisks (the pre-Sprint-2 bug), no
 * multi-emoji spam in the body. A message that violates these wasn't built
 * by the current pipeline (e.g. a stale/legacy caption), which is exactly
 * the signal an editor needs surfaced.
 */
function scoreBrandConsistency(parts: TelegramMessageParts, renderedBody: string): number {
  let score = 100;

  if (/\*[^*]+\*/.test(renderedBody)) score -= 40; // legacy Markdown-asterisk format
  if (!renderedBody.includes(parts.templateIcon)) score -= 20;
  if (parts.hashtags.length > 4) score -= 20;

  return Math.max(0, Math.min(100, score));
}

/**
 * Computes the full breakdown for a built Telegram message. `renderedBody`
 * is the actual renderTelegramMessage() output for this same `parts` — the
 * caller passes both rather than this function re-rendering, so the score
 * always reflects exactly what would be sent.
 */
export function scoreTelegramMessage(parts: TelegramMessageParts, renderedBody: string): EditorialScoreBreakdown {
  const headline = scoreHeadline(parts.headline);
  const readability = scoreReadability(parts);
  const visualQuality = scoreVisualQuality(parts);
  const ctrPotential = scoreCtrPotential(parts);
  const brandConsistency = scoreBrandConsistency(parts, renderedBody);

  const overall = Math.round(
    (headline + readability + visualQuality + ctrPotential + brandConsistency) / 5,
  );

  return { headline, readability, visualQuality, ctrPotential, brandConsistency, overall };
}
