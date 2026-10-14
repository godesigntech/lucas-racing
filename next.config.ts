import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // The live chat button lives bottom left; keep the dev-only badge out of its way.
  devIndicators: { position: "bottom-right" },
  // Dev logs would otherwise print Server Action arguments, including passwords from the login form.
  logging: { serverFunctions: false },
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
