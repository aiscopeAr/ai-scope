import { describe, it, expect } from "vitest";
import { TELEGRAM_CHANNEL_URL, TELEGRAM_CTA_CLICK_EVENT } from "./telegram-cta";

describe("Telegram channel CTA — URL and click-tracking event", () => {
  it("points to the real, existing Lumiq Telegram channel", () => {
    expect(TELEGRAM_CHANNEL_URL).toBe("https://t.me/lumiq_news");
  });

  it("uses a stable, non-empty click event name shared by every CTA placement", () => {
    expect(TELEGRAM_CTA_CLICK_EVENT.length).toBeGreaterThan(0);
    expect(TELEGRAM_CTA_CLICK_EVENT).toBe("telegram_cta_click");
  });
});
