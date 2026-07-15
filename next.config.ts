import path from "path";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(process.cwd(), "..", ".."),
  devIndicators: false,
  experimental: {
    serverActions: { bodySizeLimit: "2mb" }
  },
  webpack(config, { dev }) {
    if (dev) {
      config.cache = false;
    }

    return config;
  }
};

export default withNextIntl(nextConfig);
