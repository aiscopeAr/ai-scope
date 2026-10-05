"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { trackToolExport } from "@/lib/tools/analytics";

const TOOL_SLUG = "qr-code-generator";
const MAX_INPUT_LENGTH = 1200;

const SURFACE = { borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-surface)" };

const SIZES = [
  { id: "small", label: "صغير", px: 256 },
  { id: "medium", label: "متوسط", px: 512 },
  { id: "large", label: "كبير", px: 1024 },
] as const;

type SizeId = (typeof SIZES)[number]["id"];

export default function QrGenerator() {
  const [text, setText] = useState("https://www.lumiq.news");
  const [sizeId, setSizeId] = useState<SizeId>("medium");
  const [dataUrl, setDataUrl] = useState<string>("");
  const [error, setError] = useState(false);

  const sizePx = SIZES.find((s) => s.id === sizeId)?.px ?? 512;
  const trimmed = text.trim();

  useEffect(() => {
    let cancelled = false;
    // Nothing to encode — render falls back to the placeholder (it gates on
    // `trimmed`), so we deliberately avoid a synchronous setState here.
    if (!trimmed) return;
    QRCode.toDataURL(trimmed, {
      width: sizePx,
      margin: 2,
      errorCorrectionLevel: "M",
      color: { dark: "#000000", light: "#ffffff" },
    })
      .then((url) => {
        if (!cancelled) {
          setDataUrl(url);
          setError(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setDataUrl("");
          setError(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [trimmed, sizePx]);

  function handleDownload() {
    if (!dataUrl || !trimmed) return;
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = "lumiq-qr-code.png";
    document.body.appendChild(a);
    a.click();
    a.remove();
    trackToolExport(TOOL_SLUG, "png");
  }

  const inputStyle = { ...SURFACE, color: "var(--text-primary)" };

  return (
    <div className="mx-auto grid max-w-3xl gap-6 md:grid-cols-2" dir="rtl">
      {/* Controls */}
      <div className="rounded-[8px] border p-5" style={SURFACE}>
        <label className="block">
          <span className="mb-2 block text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
            الرابط أو النص
          </span>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, MAX_INPUT_LENGTH))}
            rows={4}
            dir="auto"
            placeholder="https://example.com أو أي نص"
            className="w-full resize-none rounded-[6px] border px-3 py-2.5 text-base outline-none"
            style={inputStyle}
            aria-label="الرابط أو النص"
          />
          <span className="mt-1 block text-left text-xs" style={{ color: "var(--text-muted)" }}>
            {trimmed.length} / {MAX_INPUT_LENGTH}
          </span>
        </label>

        <fieldset className="mt-4">
          <legend className="mb-2 text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
            حجم الصورة
          </legend>
          <div className="grid grid-cols-3 gap-2">
            {SIZES.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSizeId(s.id)}
                className="rounded-[6px] border px-3 py-2 text-sm font-medium transition"
                style={
                  sizeId === s.id
                    ? { borderColor: "var(--accent)", backgroundColor: "var(--accent-bg)", color: "var(--accent)" }
                    : { ...SURFACE, color: "var(--text-secondary)" }
                }
                aria-pressed={sizeId === s.id}
              >
                {s.label}
              </button>
            ))}
          </div>
        </fieldset>

        <button
          type="button"
          onClick={handleDownload}
          disabled={!dataUrl || !trimmed}
          className="mt-5 w-full rounded-[6px] px-4 py-3 text-sm font-semibold transition disabled:opacity-40"
          style={{ backgroundColor: "var(--accent)", color: "var(--accent-contrast, #fff)" }}
        >
          تحميل PNG
        </button>
      </div>

      {/* Preview */}
      <div
        className="flex min-h-[260px] items-center justify-center rounded-[8px] border p-6"
        style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-subtle)" }}
        aria-live="polite"
      >
        {trimmed && dataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={dataUrl}
            alt="رمز QR الناتج"
            width={240}
            height={240}
            className="h-auto w-full max-w-[240px] rounded-[6px]"
            style={{ backgroundColor: "#ffffff" }}
          />
        ) : trimmed && error ? (
          <p className="text-center text-sm" style={{ color: "var(--text-muted)" }}>
            النص طويل جدًا لإنشاء رمز QR — جرّب نصًا أقصر.
          </p>
        ) : (
          <p className="text-center text-sm" style={{ color: "var(--text-muted)" }}>
            أدخل رابطًا أو نصًا لإنشاء رمز QR.
          </p>
        )}
      </div>

      <p className="md:col-span-2 text-center text-xs" style={{ color: "var(--text-muted)" }}>
        يتم إنشاء الرمز بالكامل داخل متصفحك — لا يُرفع النص أو الرابط إلى أي خادم.
      </p>
    </div>
  );
}
