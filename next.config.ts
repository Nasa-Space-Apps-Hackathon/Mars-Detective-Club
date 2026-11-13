import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export: works on Vercel AND as plain static files.
  output: "export",
  images: { unoptimized: true },
};

export default nextConfig;
