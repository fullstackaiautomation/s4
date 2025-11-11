import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: process.env.NODE_ENV === "production" ? "/s4dashboard" : "",
  trailingSlash: true,
};

export default nextConfig;
