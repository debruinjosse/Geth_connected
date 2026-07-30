import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  devIndicators: false,
  turbopack: {
    root: process.cwd()
  },
  experimental: {
    serverActions: { bodySizeLimit: "105mb" },
    viewTransition: true
  },
  webpack(config, { dev }) {
    if (dev) {
      config.cache = false;
    }

    return config;
  }
};

export default withNextIntl(nextConfig);
