import { ImageResponse } from "next/og";
import { prisma } from "@/lib/db";
import { SITE_NAME, SITE_URL } from "@/lib/seo";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const revalidate = 3600;

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

  try {
    const review = await prisma.review.findUnique({
      where: { slug },
      select: {
        titleAr: true,
        summary: true,
        imageUrl: true,
        category: { select: { nameAr: true } },
      },
    });

    if (review) {
      title = review.titleAr;
      category = review.category?.nameAr ?? "ذكاء اصطناعي";
      summary = review.summary?.slice(0, 120) ?? "";
      imageUrl = review.imageUrl ?? null;
    }
  } catch {
    // fallback to defaults
  }

  const titleSize = title.length > 60 ? "38px" : "46px";

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

          {/* Title + summary */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              flex: 1,
              justifyContent: "center",
              padding: "24px 0",
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
              {title.length > 80 ? title.slice(0, 80) + "…" : title}
            </div>
            {summary && (
              <div
                style={{
                  color: "#94a3b8",
                  fontSize: "20px",
                  lineHeight: 1.55,
                }}
              >
                {summary.length > 110 ? summary.slice(0, 110) + "…" : summary}
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
