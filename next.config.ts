import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdfjs-dist uses dynamic worker imports that Turbopack's bundler can't
  // resolve server-side. Load it from node_modules at runtime instead.
  serverExternalPackages: ["pdfjs-dist"],
};

export default nextConfig;
