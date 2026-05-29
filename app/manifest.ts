import type { MetadataRoute } from "next";
import { SITE_URL, SITE_NAME, SITE_NAME_AR, SITE_DESCRIPTION_AR } from "@/lib/seo";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE_NAME} — ${SITE_NAME_AR}`,
    short_name: SITE_NAME,
    description: SITE_DESCRIPTION_AR,
    start_url: "/",
    display: "standalone",
    background_color: "#0f172a",
    theme_color: "#6366f1",
    lang: "ar",
    dir: "rtl",
    icons: [
      { src: "/icon.png",         sizes: "any",    type: "image/png" },
      { src: "/icon-192.png",     sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png",     sizes: "512x512", type: "image/png" },
      { src: "/icon-maskable.png",sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    categories: ["news", "technology"],
    screenshots: [
      {
        src: `${SITE_URL}/og-default.png`,
        sizes: "1200x630",
        type: "image/png",
      },
    ],
  };
}
