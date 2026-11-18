import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Las pruebas (Playwright) construyen en otra carpeta para no dañar la app abierta con pnpm dev.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  experimental: {
    // Las fotos llegan ya achicadas (~200 KB), pero se deja margen. Vercel acepta hasta 4,5 MB.
    serverActions: { bodySizeLimit: "4mb" },
  },
};

export default nextConfig;
