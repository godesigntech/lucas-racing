import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // Both bottom corners hold floating buttons (chat, design assistant); keep the dev-only badge clear of them.
  devIndicators: { position: "top-left" },
  // Dev logs would otherwise print Server Action arguments, including passwords from the login form.
  logging: { serverFunctions: false },
  // Designs open in the helmet builder with that template selected. Old product and
  // studio links land there too (Next.js keeps their query string, so shared builds survive).
  async redirects() {
    return [
      { source: "/products/:slug/customize", destination: "/helmet-builder?template=:slug", permanent: false },
      { source: "/products/:slug", destination: "/helmet-builder?template=:slug", permanent: false },
    ]
  },
  images: {
    qualities: [75, 85],
    // Object form so Unsplash's sizing query string (?w=…&fit=…) is allowed.
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com", pathname: "/**" }],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
