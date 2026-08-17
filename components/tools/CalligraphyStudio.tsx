"use client";

import { useRef, useState, useTransition } from "react";
import {
  CALLIGRAPHY_STYLES,
  TEXT_COLORS,
  BACKGROUNDS,
  DEFAULT_STYLE_ID,
  DEFAULT_TEXT_COLOR_ID,
  DEFAULT_BACKGROUND_ID,
  DEFAULT_ALIGNMENT,
  DEFAULT_TEXT,
  DEFAULT_FONT_SIZE,
  MIN_FONT_SIZE,
  MAX_FONT_SIZE,
  MAX_INPUT_LENGTH,
  getStyleById,
  type AlignmentId,
} from "@/lib/tools/calligraphy-styles";
import { buildCalligraphyExportFilename } from "@/lib/tools/export-filename";
import {
  trackToolStyleChange,
  trackToolExport,
  trackToolShare,
} from "@/lib/tools/analytics";

const TOOL_SLUG = "arabic-calligraphy";

type ExportState = "idle" | "exporting" | "done" | "error";

export default function CalligraphyStudio() {
  const [text, setText] = useState(DEFAULT_TEXT);
  const [styleId, setStyleId] = useState(DEFAULT_STYLE_ID);
  const [fontSize, setFontSize] = useState(DEFAULT_FONT_SIZE);
  const [colorId, setColorId] = useState(DEFAULT_TEXT_COLOR_ID);
  const [backgroundId, setBackgroundId] = useState(DEFAULT_BACKGROUND_ID);
  const [alignment, setAlignment] = useState<AlignmentId>(DEFAULT_ALIGNMENT);
  const [exportState, setExportState] = useState<ExportState>("idle");
  const [showSharePrompt, setShowSharePrompt] = useState(false);
  const [isPending, startTransition] = useTransition();

  const previewRef = useRef<HTMLDivElement>(null);

  const style = getStyleById(styleId);
  const color = TEXT_COLORS.find((c) => c.id === colorId) ?? TEXT_COLORS[0];
  const background = BACKGROUNDS.find((b) => b.id === backgroundId) ?? BACKGROUNDS[0];

  function handleStyleChange(id: typeof styleId) {
    startTransition(() => setStyleId(id));
    trackToolStyleChange(TOOL_SLUG, id);
  }

  async function handleExport() {
    if (!previewRef.current || !text.trim()) return;
    setExportState("exporting");
    try {
      const { exportNodeToPng, downloadDataUrl } = await import("@/lib/tools/export-image");
      const dataUrl = await exportNodeToPng(previewRef.current);
      downloadDataUrl(dataUrl, buildCalligraphyExportFilename());
      setExportState("done");
      setShowSharePrompt(true);
      trackToolExport(TOOL_SLUG, "png");
    } catch {
      setExportState("error");
    }
  }

  async function handleShare() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: "استوديو الخط العربي — Lumiq", url });
        trackToolShare(TOOL_SLUG, "web_share");
        return;
      } catch {
        // user cancelled the native share sheet — fall through silently, no error UI needed
      }
    }
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(url);
        trackToolShare(TOOL_SLUG, "copy_link");
      } catch {
        // clipboard denied — non-critical, share prompt stays visible either way
      }
    }
  }

  // Fixed light/dark-neutral squares (not a theme-relative opacity over
  // --bg-surface) so the "transparent" checkerboard stays visibly a
  // checkerboard in both themes — an opacity-based checker over the dark
  // surface color was nearly invisible in dark mode, which also made the
  // default black text swatch unreadable against it.
  const checkerboardBg =
    background.value === null
      ? {
          backgroundColor: "#e8e8e8",
          backgroundImage:
            "linear-gradient(45deg, #ffffff 25%, transparent 25%), linear-gradient(-45deg, #ffffff 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ffffff 75%), linear-gradient(-45deg, transparent 75%, #ffffff 75%)",
          backgroundSize: "20px 20px",
          backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px",
        }
      : { backgroundColor: background.value ?? undefined };

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]" dir="rtl">
      {/* Controls */}
      <div className="order-2 flex flex-col gap-6 lg:order-1">
        <div>
          <label htmlFor="calligraphy-text" className="mb-2 block text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            النص
          </label>
          <textarea
            id="calligraphy-text"
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, MAX_INPUT_LENGTH))}
            dir="rtl"
            rows={3}
            maxLength={MAX_INPUT_LENGTH}
            placeholder="اكتب اسمًا أو عبارة..."
            className="w-full resize-none rounded-[6px] border px-4 py-3 text-lg outline-none transition focus:ring-2"
            style={{
              borderColor: "var(--border-medium)",
              backgroundColor: "var(--bg-surface)",
              color: "var(--text-primary)",
              fontFamily: "var(--font-sans)",
            }}
          />
          {/* dir="ltr" + isolate: without it, the RTL context reorders
              "14 / 200" into "200 / 14" via the browser's bidi algorithm */}
          <p className="mt-1 text-xs" dir="ltr" style={{ color: "var(--text-muted)", unicodeBidi: "isolate" }}>
            {text.length} / {MAX_INPUT_LENGTH}
          </p>
        </div>

        <fieldset>
          <legend className="mb-2 text-sm font-semibold" style={{ color: "var(--text-primary)" }}>النمط</legend>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {CALLIGRAPHY_STYLES.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => handleStyleChange(s.id)}
                aria-pressed={s.id === styleId}
                className="rounded-[6px] border px-3 py-3 text-center transition"
                style={{
                  borderColor: s.id === styleId ? "var(--accent)" : "var(--border-subtle)",
                  backgroundColor: s.id === styleId ? "var(--accent-bg)" : "var(--bg-surface)",
                  color: "var(--text-primary)",
                }}
              >
                <span
                  className="block truncate text-xl leading-none"
                  style={{ fontFamily: `var(${s.cssVar})` }}
                >
                  {text.trim() || "أبجد"}
                </span>
                <span className="mt-1.5 block text-[11px] font-medium" style={{ color: "var(--text-muted)" }}>
                  {s.labelAr}
                </span>
              </button>
            ))}
          </div>
        </fieldset>

        <div>
          <label htmlFor="calligraphy-size" className="mb-2 block text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            الحجم
          </label>
          <input
            id="calligraphy-size"
            type="range"
            min={MIN_FONT_SIZE}
            max={MAX_FONT_SIZE}
            value={fontSize}
            onChange={(e) => setFontSize(Number(e.target.value))}
            className="w-full accent-[var(--accent)]"
          />
        </div>

        <fieldset>
          <legend className="mb-2 text-sm font-semibold" style={{ color: "var(--text-primary)" }}>لون النص</legend>
          <div className="flex flex-wrap gap-2">
            {TEXT_COLORS.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setColorId(c.id)}
                aria-label={c.labelAr}
                aria-pressed={c.id === colorId}
                title={c.labelAr}
                className="h-9 w-9 rounded-full border-2 transition"
                style={{
                  backgroundColor: c.value,
                  borderColor: c.id === colorId ? "var(--accent)" : "var(--border-medium)",
                }}
              />
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-2 text-sm font-semibold" style={{ color: "var(--text-primary)" }}>الخلفية</legend>
          <div className="flex gap-2">
            {BACKGROUNDS.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => setBackgroundId(b.id)}
                aria-pressed={b.id === backgroundId}
                className="rounded-[6px] border px-4 py-2 text-sm font-medium transition"
                style={{
                  borderColor: b.id === backgroundId ? "var(--accent)" : "var(--border-subtle)",
                  backgroundColor: b.id === backgroundId ? "var(--accent-bg)" : "var(--bg-surface)",
                  color: "var(--text-primary)",
                }}
              >
                {b.labelAr}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-2 text-sm font-semibold" style={{ color: "var(--text-primary)" }}>المحاذاة</legend>
          <div className="flex gap-2">
            {([
              { id: "right" as const, labelAr: "يمين" },
              { id: "center" as const, labelAr: "وسط" },
              { id: "left" as const, labelAr: "يسار" },
            ]).map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => setAlignment(a.id)}
                aria-pressed={alignment === a.id}
                className="rounded-[6px] border px-4 py-2 text-sm font-medium transition"
                style={{
                  borderColor: alignment === a.id ? "var(--accent)" : "var(--border-subtle)",
                  backgroundColor: alignment === a.id ? "var(--accent-bg)" : "var(--bg-surface)",
                  color: "var(--text-primary)",
                }}
              >
                {a.labelAr}
              </button>
            ))}
          </div>
        </fieldset>

        <button
          type="button"
          onClick={handleExport}
          disabled={!text.trim() || exportState === "exporting"}
          className="mt-2 rounded-[6px] px-6 py-3.5 text-base font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-50"
          style={{ backgroundColor: "var(--accent)" }}
        >
          {exportState === "exporting" ? "جارٍ التحميل..." : "تحميل PNG"}
        </button>

        {exportState === "error" && (
          <p role="alert" className="text-sm" style={{ color: "var(--accent)" }}>
            تعذّر إنشاء الصورة. جرّب مرة أخرى، أو أعد تحميل الصفحة إذا استمرت المشكلة.
          </p>
        )}

        {showSharePrompt && exportState === "done" && (
          <div className="rounded-[6px] border p-4" style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-subtle)" }}>
            <p className="mb-2 text-sm font-medium" style={{ color: "var(--text-primary)" }}>
              أعجبك التصميم؟
            </p>
            <p className="mb-3 text-sm" style={{ color: "var(--text-secondary)" }}>
              شارك استوديو الخط العربي مع شخص قد يحتاجه.
            </p>
            <button
              type="button"
              onClick={handleShare}
              className="rounded-[6px] border px-4 py-2 text-sm font-semibold transition"
              style={{ borderColor: "var(--accent)", color: "var(--accent)" }}
            >
              مشاركة
            </button>
          </div>
        )}

        <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
          خصوصيتك محفوظة — النص والتصميم يتمان مباشرة على جهازك، ولا يُرفعان إلى أي خادم.
        </p>
      </div>

      {/* Preview */}
      <div className="order-1 lg:order-2">
        <div
          className="flex min-h-[320px] items-center justify-center overflow-hidden rounded-[6px] border p-8 sm:min-h-[420px]"
          style={{ borderColor: "var(--border-subtle)", ...checkerboardBg }}
        >
          <div
            ref={previewRef}
            dir="rtl"
            className="flex w-full items-center justify-center px-6 py-10"
            style={
              background.value === null
                ? undefined
                : { backgroundColor: background.value }
            }
          >
            <p
              className="w-full whitespace-pre-wrap break-words"
              style={{
                fontFamily: `var(${style.cssVar})`,
                fontSize: `${fontSize}px`,
                lineHeight: style.lineHeight,
                color: color.value,
                textAlign: alignment,
                opacity: isPending ? 0.6 : 1,
                transition: "opacity 0.15s ease",
              }}
            >
              {text.trim() || "اكتب نصًا لمعاينته هنا"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
