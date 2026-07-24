import type { SocialProvider, SocialPostPayload } from "../types";
import { ProviderError } from "../retry";

/** One Telegram request must never consume the whole cron execution window
 *  (maxDuration=60s on the caller) — 15s leaves room for up to 4 attempts
 *  worth of headroom across a batch even in the worst case. */
const REQUEST_TIMEOUT_MS = 15_000;

interface TelegramApiResponse {
  ok: boolean;
  description?: string;
  error_code?: number;
  parameters?: { retry_after?: number };
  result?: { message_id: number };
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
    const text = `${cleanCaption}\n\n${payload.articleUrl}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    let res: Response;
    try {
      res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: "HTML",
          disable_web_page_preview: false,
        }),
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

    if (!data.result) {
      throw new ProviderError("Telegram API returned ok but no result.message_id", { httpStatus: res.status });
    }

    return { id: String(data.result.message_id) };
  },
};
