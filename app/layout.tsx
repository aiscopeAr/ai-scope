import type { Metadata, Viewport } from "next";
import { Amiri, Cairo } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

import {
  SITE_URL,
  SITE_NAME,
  SITE_NAME_AR,
  SITE_DESCRIPTION_AR,
} from "@/lib/seo";

const amiri = Amiri({
  subsets: ["arabic", "latin"],
  weight: ["400", "700"],
  variable: "--font-serif",
  display: "swap",
});

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600"],
  variable: "--font-sans",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)",  color: "#0f172a" },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} | أخبار الذكاء الاصطناعي بالعربية`,
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
    images: [
      {
        url: `${SITE_URL}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} — ${SITE_NAME_AR}`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@lumiq_news",
    creator: "@lumiq_news",
    images: [`${SITE_URL}/opengraph-image`],
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GSC_VERIFICATION ?? undefined,
  },
  alternates: {
    canonical: SITE_URL,
    languages: { ar: SITE_URL },
    types: {
      "application/rss+xml": `${SITE_URL}/rss.xml`,
      "application/xml": `${SITE_URL}/sitemap.xml`,
    },
  },
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={`${amiri.variable} ${cairo.variable}`}>
      <head>
        {/* Prevent dark-mode flash on load */}
        <script dangerouslySetInnerHTML={{ __html: `(function(){var t=localStorage.getItem('theme');var d=window.matchMedia('(prefers-color-scheme: dark)').matches;if(t==='dark'||(t===null&&d))document.documentElement.classList.add('dark')})()` }} />
        {/* Preconnect to image CDNs for faster LCP */}
        <link rel="preconnect" href="https://replicate.delivery" />
        <link rel="preconnect" href="https://pbxt.replicate.delivery" />
        <link rel="preconnect" href="https://res.cloudinary.com" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
      </head>
      <body className="font-sans">
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
