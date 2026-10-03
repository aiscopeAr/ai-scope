/**
 * lib/editorial/writer-model.ts
 *
 * Multi-model writer routing. By design ONE author writes with an alternate
 * provider (Gemini) to add a genuinely different voice; everyone else stays on
 * the default OpenAI writer. Gated: a Gemini route is returned only when the
 * multi-model flag is on, the author is mapped, and a real GEMINI_API_KEY is
 * present. Otherwise the caller uses the existing OpenAI path unchanged.
 *
 * Gemini is reached through its OpenAI-compatible endpoint, so the same
 * `chat.completions.create` shape works — no new dependency.
 */

import OpenAI from "openai";
import type { AuthorSlug } from "@/lib/authors";

export const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/openai/";
export const GEMINI_WRITER_MODEL = "gemini-flash-latest";

/** Author → alternate provider. Intentionally a single author (one voice). */
export const MULTIMODEL_WRITER_BY_AUTHOR: Partial<Record<AuthorSlug, "gemini">> = {
  lina: "gemini",
};

export interface WriterRoute {
  provider: "openai" | "gemini";
  model: string;
}

/**
 * Resolve the alternate writer route for an author. Returns a Gemini route only
 * when ALL hold: multi-model enabled, the author is mapped to gemini, and a
 * plausible GEMINI_API_KEY exists. Otherwise null → use the default OpenAI
 * writer. Pure (env injectable for tests).
 */
export function resolveWriterRoute(
  authorSlug: AuthorSlug,
  enabled: boolean,
  env: Record<string, string | undefined> = process.env,
): WriterRoute | null {
  if (!enabled) return null;
  if (MULTIMODEL_WRITER_BY_AUTHOR[authorSlug] !== "gemini") return null;
  const key = env.GEMINI_API_KEY;
  if (!key || key.trim().length < 20) return null;
  return { provider: "gemini", model: GEMINI_WRITER_MODEL };
}

let _gemini: OpenAI | null = null;
/** Lazy Gemini client over the OpenAI-compatible endpoint. */
export function getGeminiClient(): OpenAI {
  if (!_gemini) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error("GEMINI_API_KEY is not set");
    _gemini = new OpenAI({ apiKey: key, baseURL: GEMINI_BASE_URL });
  }
  return _gemini;
}
