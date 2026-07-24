"use client";

import { track } from "@vercel/analytics";
import { TELEGRAM_CHANNEL_URL, TELEGRAM_CTA_CLICK_EVENT, type TelegramCtaPlacement } from "@/lib/telegram-cta";

interface Props {
  placement: TelegramCtaPlacement;
}

/**
 * The on-site "join our Telegram channel" banner — extracted as its own
 * client component (matching the existing ShareButtons pattern) so the
 * click-tracking onClick handler can live here instead of in the server
 * component that renders it. Same visual markup as before this sprint;
 * this only adds instrumentation, not a redesign.
 */
export default function TelegramChannelCta({ placement }: Props) {
  return (
    <div
      className="mb-8 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-[8px] px-6 py-5"
      style={{ background: "linear-gradient(135deg, #0088cc15, #0088cc08)", border: "1px solid #0088cc30" }}
    >
      <div className="flex items-center gap-3">
        <svg viewBox="0 0 24 24" className="h-9 w-9 shrink-0" fill="#0088cc">
          <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L8.32 14.617l-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.828.942z" />
        </svg>
        <div>
          <p className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>تابع لوميك على تيليغرام</p>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>أخبار الذكاء الاصطناعي أولاً بأول</p>
        </div>
      </div>
      <a
        href={TELEGRAM_CHANNEL_URL}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => track(TELEGRAM_CTA_CLICK_EVENT, { placement })}
        className="shrink-0 rounded-[6px] px-5 py-2.5 text-sm font-bold text-white transition hover:opacity-90"
        style={{ backgroundColor: "#0088cc" }}
      >
        انضم إلى القناة
      </a>
    </div>
  );
}
