import { ImageResponse } from "next/og";
import { prisma } from "@/lib/db";
import { SITE_NAME, SITE_URL } from "@/lib/seo";
import { truncateSummary } from "@/lib/social/telegram-format";
import { estimateReadingMinutes } from "@/lib/social/telegram-message";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const revalidate = 3600;

/** Sprint 5 OG image refinements: sentence-aware title/summary truncation
 *  (reuses the same truncateSummary() the Telegram caption uses, instead of
 *  a raw mid-word .slice()), a reading-time chip computed from real content
 *  (estimateReadingMinutes(), shared with the Telegram message so both
 *  surfaces agree), and a 3rd title-size tier so very long headlines still
 *  fit without an aggressive 80-char hard cut. */
const TITLE_MAX_CHARS = 100;

export default async function OgImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let title = SITE_NAME;
  let category = "ذكاء اصطناعي";
  let summary = "";
  let imageUrl: string | null = null;
  let readingMinutes = 0;

  try {
    const review = await prisma.review.findUnique({
      where: { slug },
      select: {
        titleAr: true,
        summary: true,
        content: true,
        imageUrl: true,
        category: { select: { nameAr: true } },
      },
    });

    if (review) {
      title = review.titleAr;
      category = review.category?.nameAr ?? "ذكاء اصطناعي";
      summary = truncateSummary(review.summary ?? "", 120);
      imageUrl = review.imageUrl ?? null;
      readingMinutes = estimateReadingMinutes(review.content ?? "");
    }
  } catch {
    // fallback to defaults
  }

  const displayTitle = title.length > TITLE_MAX_CHARS ? title.slice(0, TITLE_MAX_CHARS - 1).trimEnd() + "…" : title;
  const titleSize = displayTitle.length > 80 ? "32px" : displayTitle.length > 60 ? "38px" : "46px";

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          fontFamily: "sans-serif",
          position: "relative",
          overflow: "hidden",
          background: "#0f172a",
        }}
      >
        {/* Background image */}
        {imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            style={{
              position: "absolute",
              inset: "0",
              width: "100%",
              height: "100%",
              objectFit: "cover",
              opacity: 0.2,
            }}
            alt=""
          />
        )}

        {/* Dark overlay */}
        <div
          style={{
            position: "absolute",
            inset: "0",
            background: "linear-gradient(135deg, rgba(15,23,42,0.97) 0%, rgba(30,27,75,0.88) 60%, rgba(15,23,42,0.80) 100%)",
            display: "flex",
          }}
        />

        {/* Grid */}
        <div
          style={{
            position: "absolute",
            inset: "0",
            backgroundImage:
              "linear-gradient(rgba(99,102,241,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.07) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
            display: "flex",
          }}
        />

        {/* Right image strip */}
        {imageUrl && (
          <div
            style={{
              position: "absolute",
              right: "0",
              top: "0",
              width: "340px",
              height: "630px",
              display: "flex",
              overflow: "hidden",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.55 }}
              alt=""
            />
            <div
              style={{
                position: "absolute",
                inset: "0",
                background: "linear-gradient(to left, transparent 30%, #0f172a 100%)",
                display: "flex",
              }}
            />
          </div>
        )}

        {/* Content */}
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "48px 56px",
            width: imageUrl ? "860px" : "100%",
            direction: "rtl",
          }}
        >
          {/* Top — logo + site name + category */}
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "48px",
                height: "48px",
                borderRadius: "12px",
                background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                boxShadow: "0 0 20px rgba(99,102,241,0.5)",
              }}
            >
              <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
                <rect x="9" y="8" width="3.5" height="16" rx="1.5" fill="white" />
                <rect x="9" y="20.5" width="10" height="3.5" rx="1.5" fill="white" />
                <circle cx="23" cy="10" r="2.5" fill="white" opacity="0.9" />
              </svg>
            </div>
            <span style={{ color: "white", fontSize: "26px", fontWeight: "800" }}>
              {SITE_NAME}
            </span>
            <div
              style={{
                display: "flex",
                marginRight: "auto",
                gap: "8px",
              }}
            >
              {readingMinutes > 0 && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    background: "rgba(148,163,184,0.12)",
                    border: "1px solid rgba(148,163,184,0.3)",
                    borderRadius: "20px",
                    padding: "4px 14px",
                    color: "#cbd5e1",
                    fontSize: "15px",
                    fontWeight: "600",
                  }}
                >
                  {readingMinutes} د
                </div>
              )}
              <div
                style={{
                  display: "flex",
                  background: "rgba(99,102,241,0.2)",
                  border: "1px solid rgba(99,102,241,0.4)",
                  borderRadius: "20px",
                  padding: "4px 16px",
                  color: "#a5b4fc",
                  fontSize: "15px",
                  fontWeight: "600",
                }}
              >
                {category}
              </div>
            </div>
          </div>

          {/* Title + summary — capped to a width that stays inside the
              ~60% left zone Telegram/WhatsApp actually keep visible when
              they crop a link-preview thumbnail, so identity never depends
              on the right-hand image strip alone. */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              flex: 1,
              justifyContent: "center",
              padding: "24px 0",
              maxWidth: imageUrl ? "620px" : "1000px",
            }}
          >
            <div
              style={{
                color: "white",
                fontSize: titleSize,
                fontWeight: "900",
                lineHeight: 1.3,
                textShadow: "0 2px 20px rgba(0,0,0,0.5)",
              }}
            >
              {displayTitle}
            </div>
            {summary && (
              <div
                style={{
                  color: "#94a3b8",
                  fontSize: "20px",
                  lineHeight: 1.55,
                }}
              >
                {summary}
              </div>
            )}
          </div>

          {/* Bottom */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#6366f1" }} />
              <span style={{ color: "#64748b", fontSize: "15px" }}>لوميك — أخبار الذكاء الاصطناعي بالعربية</span>
            </div>
            <span style={{ color: "#475569", fontSize: "14px" }}>lumiq.news</span>
          </div>
        </div>

        {/* Bottom accent line */}
        <div
          style={{
            position: "absolute",
            bottom: "0",
            left: "0",
            right: "0",
            height: "4px",
            background: "linear-gradient(90deg, #4f46e5, #7c3aed, #ec4899, #7c3aed, #4f46e5)",
            display: "flex",
          }}
        />
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
