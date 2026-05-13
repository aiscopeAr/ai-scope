import type { Metadata } from "next";
import "./globals.css";

import {
  SITE_URL,
  SITE_NAME,
  SITE_NAME_AR,
  SITE_DESCRIPTION_AR,
} from "@/lib/seo";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — ${SITE_NAME_AR}`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION_AR,
  keywords: [
    "ذكاء اصطناعي",
    "أخبار AI",
    "نماذج لغوية",
    "تعلم آلي",
    "ChatGPT",
    "OpenAI",
    "Google AI",
    "artificial intelligence",
    "AI news Arabic",
  ],
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  openGraph: {
    type: "website",
    locale: "ar_SA",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} — ${SITE_NAME_AR}`,
    description: SITE_DESCRIPTION_AR,
  },
  twitter: {
    card: "summary_large_image",
    site: "@AIScope_ar",
    creator: "@AIScope_ar",
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GSC_VERIFICATION ?? undefined,
  },
  alternates: {
    canonical: SITE_URL,
    types: { "application/rss+xml": `${SITE_URL}/rss.xml` },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
