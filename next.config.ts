import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export: works on Vercel AND as plain static files.
  output: "export",
  images: { unoptimized: true },
  // PREVIEW=1 → relative asset paths (for hosting the build inside a sub-path)
  ...(process.env.PREVIEW ? { assetPrefix: "." } : {}),
};

export default nextConfig;
