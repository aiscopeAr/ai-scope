import { ImageResponse } from "next/og";
import { SITE_NAME, SITE_NAME_AR, SITE_DESCRIPTION_AR } from "@/lib/seo";

export const runtime = "edge";
export const alt = `${SITE_NAME} — ${SITE_NAME_AR}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)",
          fontFamily: "sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background grid pattern */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(99,102,241,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.08) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        {/* Glow blob */}
        <div
          style={{
            position: "absolute",
            top: "-100px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "600px",
            height: "400px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(99,102,241,0.25) 0%, transparent 70%)",
          }}
        />

        {/* Logo badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "72px",
            height: "72px",
            borderRadius: "18px",
            background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
            marginBottom: "24px",
            boxShadow: "0 0 40px rgba(99,102,241,0.5)",
          }}
        >
          <svg width="40" height="40" viewBox="0 0 32 32" fill="none">
            <rect x="9" y="8" width="3.5" height="16" rx="1.5" fill="white"/>
            <rect x="9" y="20.5" width="10" height="3.5" rx="1.5" fill="white"/>
            <circle cx="23" cy="10" r="2.5" fill="white" opacity="0.9"/>
          </svg>
        </div>

        {/* Site name */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "16px",
          }}
        >
          <span style={{ color: "white", fontSize: "52px", fontWeight: "900", letterSpacing: "-1px" }}>
            {SITE_NAME}
          </span>
          <span
            style={{
              background: "rgba(99,102,241,0.2)",
              border: "1px solid rgba(99,102,241,0.4)",
              borderRadius: "8px",
              padding: "4px 12px",
              color: "#a5b4fc",
              fontSize: "18px",
              fontWeight: "600",
            }}
          >
            AR
          </span>
        </div>

        {/* Arabic name */}
        <div style={{ color: "#a5b4fc", fontSize: "28px", fontWeight: "700", marginBottom: "20px" }}>
          {SITE_NAME_AR}
        </div>

        {/* Description */}
        <div
          style={{
            color: "#94a3b8",
            fontSize: "20px",
            textAlign: "center",
            maxWidth: "700px",
            lineHeight: "1.5",
          }}
        >
          {SITE_DESCRIPTION_AR}
        </div>

        {/* Bottom bar */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "4px",
            background: "linear-gradient(90deg, #4f46e5, #7c3aed, #4f46e5)",
          }}
        />
      </div>
    ),
    { ...size },
  );
}
