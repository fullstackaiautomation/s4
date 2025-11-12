import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "", // No base path needed - deployed at root domain
  assetPrefix: "", // Assets served from root
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
