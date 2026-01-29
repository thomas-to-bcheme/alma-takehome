import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Server external packages - native Node.js modules that shouldn't be bundled
  serverExternalPackages: ['@napi-rs/canvas', 'pdfjs-dist'],

  // Turbopack configuration (required for Next.js 16+)
  turbopack: {},
};

export default nextConfig;
