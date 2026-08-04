import type { SocialProvider, SocialPostPayload } from "../types";
import { ProviderError } from "../retry";

/** One Telegram request must never consume the whole cron execution window
 *  (maxDuration=60s on the caller) — 15s leaves room for up to 4 attempts
 *  worth of headroom across a batch even in the worst case. */
const REQUEST_TIMEOUT_MS = 15_000;

/** Telegram Bot API caption limits — sendPhoto's caption is capped at 1024
 *  chars, well under sendMessage's 4096. Both are enforced client-side so a
 *  too-long caption never reaches Telegram as a 400 (which the retry
 *  classifier would otherwise treat as a permanent failure and never
 *  re-attempt with a photo again). */
const SEND_PHOTO_CAPTION_LIMIT = 1024;
const SEND_MESSAGE_TEXT_LIMIT = 4096;

interface TelegramApiResponse {
  ok: boolean;
  description?: string;
  error_code?: number;
  parameters?: { retry_after?: number };
  result?: { message_id: number };
}

/** Trims a caption to fit `limit`, cutting on the last line break within
 *  budget so the visible message never ends mid-word — the article link is
 *  appended after this, outside the counted body, so the link itself is
 *  never at risk of being cut. */
function fitCaption(text: string, limit: number): string {
  if (text.length <= limit) return text;
  const slice = text.slice(0, limit - 1);
  const lastBreak = slice.lastIndexOf("\n");
  const cut = lastBreak > limit * 0.5 ? slice.slice(0, lastBreak) : slice;
  return cut.trimEnd() + "…";
}

async function callTelegramApi(
  botToken: string,
  method: "sendPhoto" | "sendMessage",
  body: Record<string, unknown>,
): Promise<TelegramApiResponse> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(`https://api.telegram.org/bot${botToken}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (err) {
    // fetch() throws on network failure, DNS failure, and AbortController timeouts —
    // all of these are transient from the caller's point of view.
    const isAbort = err instanceof Error && err.name === "AbortError";
    throw new ProviderError(
      isAbort ? "Telegram: request timed out" : `Telegram: network error — ${err instanceof Error ? err.message : String(err)}`,
      { isNetworkError: true },
    );
  } finally {
    clearTimeout(timeout);
  }

  // Telegram returns a JSON body with `ok`/`description`/`error_code` on both
  // success and failure — parse it regardless of res.ok so a 429's
  // parameters.retry_after is available to the retry classifier.
  let data: TelegramApiResponse | null = null;
  try {
    data = (await res.json()) as TelegramApiResponse;
  } catch {
    // Non-JSON body (rare, e.g. an upstream proxy error page) — fall back
    // to the raw HTTP status with no retry_after.
    throw new ProviderError(`Telegram API error: HTTP ${res.status}`, { httpStatus: res.status });
  }

  if (!res.ok || !data.ok) {
    throw new ProviderError(
      `Telegram API error: ${data.error_code ?? res.status} ${data.description ?? "unknown error"}`,
      { httpStatus: data.error_code ?? res.status, retryAfterSeconds: data.parameters?.retry_after },
    );
  }

  return data;
}

export const telegramProvider: SocialProvider = {
  platform: "telegram",

  async send(payload: SocialPostPayload, credentials: Record<string, string>) {
    const { botToken, chatId } = credentials;

    if (!botToken || !chatId) {
      throw new ProviderError("Telegram: missing botToken or chatId");
    }

    // Strip any URLs the AI may have embedded in the caption — we append the tracked URL ourselves.
    const cleanCaption = payload.caption.replace(/https?:\/\/\S+/g, "").replace(/\n{3,}/g, "\n\n").trim();
    const fullText = `${cleanCaption}\n\n${payload.articleUrl}`;

    // Telegram Experience Sprint 5 — send the article's image as a real
    // sendPhoto so the reader always sees a large, premium image immediately,
    // instead of depending on Telegram's own (smaller, sometimes-suppressed)
    // link-preview crawler. Falls back to the previous sendMessage behavior
    // whenever no image exists — never a hard dependency for delivery.
    let data: TelegramApiResponse;
    if (payload.imageUrl) {
      const text = fitCaption(fullText, SEND_PHOTO_CAPTION_LIMIT);
      data = await callTelegramApi(botToken, "sendPhoto", {
        chat_id: chatId,
        photo: payload.imageUrl,
        caption: text,
        parse_mode: "HTML",
      });
    } else {
      const text = fitCaption(fullText, SEND_MESSAGE_TEXT_LIMIT);
      data = await callTelegramApi(botToken, "sendMessage", {
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: false,
      });
    }

    if (!data.result) {
      throw new ProviderError("Telegram API returned ok but no result.message_id", {});
    }

    return { id: String(data.result.message_id) };
  },
};
