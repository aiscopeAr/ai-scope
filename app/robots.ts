import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // Block bad/scraper bots
      { userAgent: "GPTBot",          disallow: ["/"] },
      { userAgent: "ChatGPT-User",    disallow: ["/"] },
      { userAgent: "CCBot",           disallow: ["/"] },
      { userAgent: "anthropic-ai",    disallow: ["/"] },
      { userAgent: "Claude-Web",      disallow: ["/"] },
      { userAgent: "Omgilibot",       disallow: ["/"] },
      // Allow search engines + good crawlers
      { userAgent: "OAI-SearchBot",   allow: ["/"] },
      { userAgent: "Googlebot",       allow: ["/"], disallow: ["/admin/", "/api/"] },
      { userAgent: "Bingbot",         allow: ["/"], disallow: ["/admin/", "/api/"] },
      // Default for everyone else
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/api/admin/", "/api/cron/"],
      },
    ],
    sitemap: [
      `${SITE_URL}/sitemap.xml`,
      `${SITE_URL}/news-sitemap.xml`,
      `${SITE_URL}/rss.xml`,
    ],
  };
}
