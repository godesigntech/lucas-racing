import type { MetadataRoute } from "next"

import { siteConfig } from "@/config/site"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/account", "/checkout", "/basket", "/auth", "/racewear/go"] },
    sitemap: new URL("/sitemap.xml", siteConfig.url).toString(),
  }
}
