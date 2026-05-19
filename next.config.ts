import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
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
    ],
  },
};

export default nextConfig;
