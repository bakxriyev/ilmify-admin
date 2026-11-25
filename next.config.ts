import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,

  experimental: {
    // The persistent dev cache grew to 4.6 GB and crashed Turbopack when the disk filled up.
    turbopackFileSystemCacheForDev: false,
  },

  images: {
    remotePatterns: [
      { protocol: "http", hostname: "localhost" },
      { protocol: "https", hostname: "api.ilmify-edu.uz" },
    ],
  },

  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
