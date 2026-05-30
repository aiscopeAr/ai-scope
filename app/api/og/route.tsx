/**
 * Dynamic OG Image API — no internal fetch, data passed as query params
 * GET /api/og?title=...&category=...&summary=...&imageUrl=...
 * GET /api/og?title=...&format=square  → 1080×1080 (Instagram)
 */
import { ImageResponse } from "next/og";
import { SITE_NAME } from "@/lib/seo";

export const runtime = "edge";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const format   = searchParams.get("format") ?? "wide";
  const isSquare = format === "square";
  const W        = isSquare ? 1080 : 1200;
  const H        = isSquare ? 1080 : 630;

  const title     = searchParams.get("title")    ?? SITE_NAME;
  const category  = searchParams.get("category") ?? "ذكاء اصطناعي";
  const summary   = searchParams.get("summary")  ?? "";
  const imageUrl  = searchParams.get("imageUrl") || null;

  const titleSize = isSquare
    ? title.length > 50 ? "42px" : "52px"
    : title.length > 60 ? "36px" : "44px";

  return new ImageResponse(
    (
      <div
        style={{
          width: `${W}px`,
          height: `${H}px`,
          display: "flex",
          fontFamily: "sans-serif",
          position: "relative",
          overflow: "hidden",
          background: "#0f172a",
        }}
      >
        {/* BG image faded */}
        {imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            style={{ position: "absolute", inset: "0", width: "100%", height: "100%", objectFit: "cover", opacity: 0.2 }}
            alt=""
          />
        )}

        {/* Gradient overlay */}
        <div style={{ position: "absolute", inset: "0", display: "flex", background: "linear-gradient(135deg, rgba(15,23,42,0.97) 0%, rgba(30,27,75,0.90) 60%, rgba(15,23,42,0.85) 100%)" }} />

        {/* Grid pattern */}
        <div style={{ position: "absolute", inset: "0", display: "flex", backgroundImage: "linear-gradient(rgba(99,102,241,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.07) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />

        {/* Right image strip (wide only) */}
        {imageUrl && !isSquare && (
          <div style={{ position: "absolute", right: "0", top: "0", width: "340px", height: "630px", display: "flex", overflow: "hidden" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageUrl} style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.55 }} alt="" />
            <div style={{ position: "absolute", inset: "0", background: "linear-gradient(to left, transparent 30%, #0f172a 100%)", display: "flex" }} />
          </div>
        )}

        {/* Content */}
        <div style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: isSquare ? "60px" : "48px 56px",
          width: imageUrl && !isSquare ? "860px" : "100%",
          direction: "rtl",
        }}>
          {/* Top — logo + site name + category badge */}
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              width: isSquare ? "60px" : "48px", height: isSquare ? "60px" : "48px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              boxShadow: "0 0 20px rgba(99,102,241,0.5)",
            }}>
              <svg width={isSquare ? "34" : "28"} height={isSquare ? "34" : "28"} viewBox="0 0 32 32" fill="none">
                <rect x="9" y="8"    width="3.5" height="16" rx="1.5" fill="white" />
                <rect x="9" y="20.5" width="10"  height="3.5" rx="1.5" fill="white" />
                <circle cx="23" cy="10" r="2.5" fill="white" opacity="0.9" />
              </svg>
            </div>
            <span style={{ color: "white", fontSize: isSquare ? "32px" : "26px", fontWeight: "800" }}>{SITE_NAME}</span>
            <div style={{
              display: "flex", marginRight: "auto",
              background: "rgba(99,102,241,0.2)", border: "1px solid rgba(99,102,241,0.4)",
              borderRadius: "20px", padding: isSquare ? "6px 20px" : "4px 16px",
              color: "#a5b4fc", fontSize: isSquare ? "18px" : "15px", fontWeight: "600",
            }}>
              {category}
            </div>
          </div>

          {/* Title + summary */}
          <div style={{ display: "flex", flexDirection: "column", gap: "18px", flex: 1, justifyContent: "center", padding: "28px 0" }}>
            <div style={{ color: "white", fontSize: titleSize, fontWeight: "900", lineHeight: 1.3, textShadow: "0 2px 20px rgba(0,0,0,0.6)" }}>
              {title.length > (isSquare ? 90 : 80) ? title.slice(0, isSquare ? 90 : 80) + "…" : title}
            </div>
            {summary && (
              <div style={{ color: "#94a3b8", fontSize: isSquare ? "22px" : "19px", lineHeight: 1.6 }}>
                {summary.length > (isSquare ? 130 : 100) ? summary.slice(0, isSquare ? 130 : 100) + "…" : summary}
              </div>
            )}
          </div>

          {/* Bottom bar */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#6366f1" }} />
              <span style={{ color: "#64748b", fontSize: isSquare ? "18px" : "15px" }}>لوميك — أخبار الذكاء الاصطناعي</span>
            </div>
            <span style={{ color: "#475569", fontSize: isSquare ? "17px" : "14px" }}>lumiq.news</span>
          </div>
        </div>

        {/* Bottom accent stripe */}
        <div style={{ position: "absolute", bottom: "0", left: "0", right: "0", height: isSquare ? "6px" : "4px", background: "linear-gradient(90deg, #4f46e5, #7c3aed, #ec4899, #7c3aed, #4f46e5)", display: "flex" }} />
      </div>
    ),
    { width: W, height: H }
  );
}
