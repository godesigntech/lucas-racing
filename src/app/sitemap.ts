import type { MetadataRoute } from "next"

import { siteConfig } from "@/config/site"
import { getNewsCategories, getNewsForFeeds } from "@/lib/data/news"
import { getShopSitemapEntries } from "@/lib/data/shop"

// Public pages for search engines. Account, checkout and admin pages are left out (see robots.ts).
const pages: { path: string; priority: number }[] = [
  { path: "/", priority: 1 },
  { path: "/about", priority: 0.8 },
  { path: "/about/racing-support", priority: 0.7 },
  { path: "/team", priority: 0.8 },
  { path: "/shop", priority: 0.9 },
  { path: "/customisation", priority: 0.8 },
  { path: "/customisation/helmets", priority: 0.8 },
  { path: "/helmet-builder", priority: 0.7 },
  { path: "/customisation/kart-parts", priority: 0.6 },
  { path: "/racewear", priority: 0.6 },
  { path: "/teamwear", priority: 0.6 },
  { path: "/news", priority: 0.7 },
  { path: "/gallery", priority: 0.5 },
  { path: "/contact", priority: 0.7 },
  { path: "/faq", priority: 0.4 },
  { path: "/privacy", priority: 0.2 },
  { path: "/terms", priority: 0.2 },
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [shop, posts, newsCategories] = await Promise.all([getShopSitemapEntries(), getNewsForFeeds(), getNewsCategories()])
  return [
    ...pages.map(({ path, priority }) => ({ url: new URL(path, siteConfig.url).toString(), priority })),
    ...shop.map(({ path, lastModified }) => ({ url: new URL(path, siteConfig.url).toString(), lastModified, priority: 0.7 })),
    ...newsCategories.map((category) => ({ url: new URL(`/news/category/${category.slug}`, siteConfig.url).toString(), priority: 0.5 })),
    ...posts.map((post) => ({ url: new URL(`/news/${post.slug}`, siteConfig.url).toString(), lastModified: post.updatedAt, priority: 0.6 })),
  ]
}
