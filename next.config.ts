import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Reduce JS bundle — remove console logs in production
  compiler: {
    removeConsole: process.env.NODE_ENV === "production" ? { exclude: ["error"] } : false,
  },
  // Experimental optimizations
  experimental: {
    optimizePackageImports: ["lucide-react", "date-fns", "@prisma/client"],
    // Skip polyfills for modern browsers
    webVitalsAttribution: ["CLS", "LCP"],
  },
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "**.venturebeat.com" },
      { protocol: "https", hostname: "**.techcrunch.com" },
      { protocol: "https", hostname: "**.technologyreview.com" },
      { protocol: "https", hostname: "**.theverge.com" },
      { protocol: "https", hostname: "**.wired.com" },
      { protocol: "https", hostname: "**.reuters.com" },
      { protocol: "https", hostname: "**.bbc.com" },
      { protocol: "https", hostname: "**.cnn.com" },
      { protocol: "https", hostname: "cdn.vox-cdn.com" },
      { protocol: "https", hostname: "**.amazonaws.com" },
      { protocol: "https", hostname: "**.cloudfront.net" },
      { protocol: "https", hostname: "**.wp.com" },
      { protocol: "https", hostname: "i0.wp.com" },
      { protocol: "https", hostname: "i1.wp.com" },
      { protocol: "https", hostname: "i2.wp.com" },
      { protocol: "https", hostname: "images.ctfassets.net" },
      { protocol: "https", hostname: "**.ctfassets.net" },
      { protocol: "https", hostname: "replicate.delivery" },
      { protocol: "https", hostname: "**.replicate.delivery" },
      { protocol: "https", hostname: "pbxt.replicate.delivery" },
      { protocol: "https", hostname: "**.redd.it" },
      { protocol: "https", hostname: "**.medium.com" },
      { protocol: "https", hostname: "miro.medium.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "www.google.com", pathname: "/s2/favicons" },
    ],
  },
};

// Redirect non-www → www (canonical domain)
nextConfig.redirects = async () => [
  {
    source: "/:path*",
    has: [{ type: "host", value: "lumiq.news" }],
    destination: "https://www.lumiq.news/:path*",
    permanent: true, // 308 (replaces 301 in Next.js)
  },
];

// Security + performance headers
nextConfig.headers = async () => [
  {
    source: "/(.*)",
    headers: [
      { key: "X-Content-Type-Options",    value: "nosniff" },
      { key: "X-Frame-Options",           value: "DENY" },
      { key: "X-XSS-Protection",          value: "1; mode=block" },
      { key: "Referrer-Policy",           value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy",        value: "camera=(), microphone=(), geolocation=()" },
      {
        key: "Strict-Transport-Security",
        value: "max-age=63072000; includeSubDomains; preload",
      },
    ],
  },
  // Cache static assets aggressively
  {
    source: "/_next/static/(.*)",
    headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
  },
  // Cache images
  {
    source: "/images/(.*)",
    headers: [{ key: "Cache-Control", value: "public, max-age=2592000, stale-while-revalidate=86400" }],
  },
];

export default nextConfig;
