import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Garante que a fonte usada pelo watermark server-side (canvas) entra no
  // bundle da função serverless — não está em public/, não é auto-traceada.
  outputFileTracingIncludes: {
    "/api/photos/*/og-image": ["./assets/fonts/**/*"],
    "/api/photos/*/preview": ["./assets/fonts/**/*"],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "via.placeholder.com",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
  },
};

export default nextConfig;
