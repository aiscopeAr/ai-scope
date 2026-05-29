import type { SocialProvider, SocialPostPayload } from "../types";

export const telegramProvider: SocialProvider = {
  platform: "telegram",

  async send(payload: SocialPostPayload, credentials: Record<string, string>) {
    const { botToken, chatId } = credentials;

    if (!botToken || !chatId) {
      throw new Error("Telegram: missing botToken or chatId");
    }

    // Strip any URLs the AI may have embedded in the caption — we append the tracked URL ourselves
    const cleanCaption = payload.caption.replace(/https?:\/\/\S+/g, "").replace(/\n{3,}/g, "\n\n").trim();
    const text = `${cleanCaption}\n\n${payload.articleUrl}`;

    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: false,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Telegram API error: ${err}`);
    }

    const data = await res.json() as { result: { message_id: number } };
    return { id: String(data.result.message_id) };
  },
};
