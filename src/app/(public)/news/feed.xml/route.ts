import { siteConfig } from "@/config/site"
import { getNewsForFeeds } from "@/lib/data/news"
import { summaryOf } from "@/lib/news/text"

const escape = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;")

/** RSS 2.0 feed of the latest posts, for feed readers and search engines. */
export async function GET() {
  const posts = await getNewsForFeeds(30)
  const site = siteConfig.url
  const items = posts
    .map((post) => {
      const link = `${site}/news/${post.slug}`
      return `    <item>
      <title>${escape(post.title)}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <pubDate>${new Date(post.publishedAt ?? post.updatedAt).toUTCString()}</pubDate>
      <description>${escape(summaryOf(post.excerpt, post.body, 300))}</description>${post.category ? `\n      <category>${escape(post.category.name)}</category>` : ""}${post.coverUrl ? `\n      <enclosure url="${escape(post.coverUrl)}" type="image/webp" length="0" />` : ""}
    </item>`
    })
    .join("\n")

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escape(`${siteConfig.name} news and results`)}</title>
    <link>${site}/news</link>
    <atom:link href="${site}/news/feed.xml" rel="self" type="application/rss+xml" />
    <description>Race reports, results and team news from Lucas Racing.</description>
    <language>en-gb</language>
${items}
  </channel>
</rss>`

  return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8" } })
}
