import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // Both bottom corners hold floating buttons (chat, design assistant); keep the dev-only badge clear of them.
  devIndicators: { position: "top-left" },
  // Dev logs would otherwise print Server Action arguments, including passwords from the login form.
  logging: { serverFunctions: false },
  // The builder now lives on each product page; old studio links (and their shared builds) land there.
  async redirects() {
    return [{ source: "/products/:slug/customize", destination: "/products/:slug", permanent: true }]
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
