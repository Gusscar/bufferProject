import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "gen.pollinations.ai" },
      { protocol: "https", hostname: "image.pollinations.ai" },
      { protocol: "https", hostname: "text.pollinations.ai" },
      { protocol: "https", hostname: "**.buffer.com" },
      { protocol: "https", hostname: "uploads.buffer.com" },
      { protocol: "https", hostname: "publish.buffer.com" },
    ],
  },
};

export default nextConfig;