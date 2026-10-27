import type { NextConfig } from "next";

const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname : undefined

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  experimental: {
    // Lets `next upgrade` point coding agents at security releases for this app.
    agentUpgrade: "security",
  },
  // Both bottom corners hold floating buttons (chat, design assistant); keep the dev-only badge clear of them.
  devIndicators: { position: "top-left" },
  // Dev logs would otherwise print Server Action arguments, including passwords from the login form.
  logging: { serverFunctions: false },
  // Designs open in the helmet builder with that template selected. Old product and
  // studio links land there too (Next.js keeps their query string, so shared builds survive).
  // Pages moved in the Lucas Racing restructure keep working from their old addresses.
  async redirects() {
    return [
      { source: "/products/:slug/customize", destination: "/helmet-builder?template=:slug", permanent: false },
      { source: "/products/:slug", destination: "/helmet-builder?template=:slug", permanent: false },
      { source: "/products", destination: "/customisation/helmets", permanent: true },
      // Filtered design lists moved from /customisation to /customisation/helmets.
      { source: "/customisation", has: [{ type: "query", key: "category" }], destination: "/customisation/helmets", permanent: true },
      { source: "/customisation", has: [{ type: "query", key: "helmet" }], destination: "/customisation/helmets", permanent: true },
      { source: "/kart-parts", destination: "/shop", permanent: true },
      { source: "/kart-customiser", destination: "/customisation/kart-parts", permanent: true },
    ]
  },
  images: {
    // All photos are the client's own: files in /public, or uploads (team photos) in the project's Supabase storage.
    qualities: [75, 85],
    remotePatterns: supabaseHost
      ? [{ protocol: "https", hostname: supabaseHost, pathname: "/storage/v1/object/public/**" }]
      : [],
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
