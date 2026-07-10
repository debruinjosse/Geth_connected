import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(process.cwd(), "..", ".."),
  experimental: { serverActions: { bodySizeLimit: "2mb" } },
  webpack(config, { dev }) {
    if (dev) {
      config.cache = false;
    }

    return config;
  }
};

export default nextConfig;
