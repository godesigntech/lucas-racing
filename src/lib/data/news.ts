import "server-only"

import { cacheLife, cacheTag } from "next/cache"
import { notFound } from "next/navigation"

import { requireFullAdmin } from "@/lib/auth/session"
import { ADMIN_PAGE_SIZE, type Paged } from "@/lib/data/admin"
import { isDemoMode } from "@/lib/demo/mode"
import { readingMinutes } from "@/lib/news/text"
import type { NewsCategoryRow, NewsPostRow } from "@/lib/supabase/database.types"
import { createClient, createPublicClient } from "@/lib/supabase/server"
import type { NewsCategory, NewsPost, NewsResult, NewsStatus } from "@/types/news"

import { cacheTags } from "./cache-tags"

/** Posts per archive page: 12 fills a three-column grid, with the lead post double size on page one. */
export const NEWS_PAGE_SIZE = 12

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const POST_SELECT = "*, news_categories(id, name, slug)"
type PostRow = NewsPostRow & { news_categories: Pick<NewsCategoryRow, "id" | "name" | "slug"> | null }

function toNewsPost(row: PostRow): NewsPost {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    body: row.body,
    coverUrl: row.cover_url,
    coverAlt: row.cover_alt,
    category: row.news_categories,
    status: row.status as NewsStatus,
    publishedAt: row.published_at,
    featured: row.featured,
    authorName: row.author_name,
    seoTitle: row.seo_title,
    seoDescription: row.seo_description,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    readingMinutes: readingMinutes(row.body),
    result: toResult(row.result),
  }
}

function toResult(value: unknown): NewsResult | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null
  const raw = value as Record<string, unknown>
  const text = (key: string) => (typeof raw[key] === "string" ? (raw[key] as string) : "")
  const result = { event: text("event"), circuit: text("circuit"), class: text("class"), driver: text("driver"), position: text("position") }
  return Object.values(result).some(Boolean) ? result : null
}

function toNewsCategory(row: NewsCategoryRow): NewsCategory {
  return { id: row.id, name: row.name, slug: row.slug, description: row.description, sortOrder: row.sort_order }
}

const empty = <T,>(): Paged<T> => ({ rows: [], total: 0, page: 1, pageCount: 1 })

// ---------------------------------------------------------------------------
// Public (published posts only: row level security also hides drafts and
// scheduled posts). Cached for a few minutes so scheduled posts appear on time.
// ---------------------------------------------------------------------------

/** A request for published posts, newest first. */
function publishedPosts(count?: "exact") {
  return createPublicClient()
    .from("news_posts")
    .select(POST_SELECT, count ? { count } : undefined)
    .eq("status", "published")
    .lte("published_at", new Date().toISOString())
    .order("published_at", { ascending: false })
}

export async function getNewsCategories(): Promise<NewsCategory[]> {
  "use cache"
  cacheTag(cacheTags.news)
  cacheLife("hours")
  if (isDemoMode()) return []
  const { data, error } = await createPublicClient().from("news_categories").select("*").order("sort_order").order("name")
  if (error) throw new Error(`Could not load news categories: ${error.message}`)
  return data.map(toNewsCategory)
}

/** One page of the archive, optionally for one category. */
export async function listNews(options: { categoryId?: string; page?: number }): Promise<Paged<NewsPost>> {
  "use cache"
  cacheTag(cacheTags.news)
  cacheLife("minutes")
  if (isDemoMode()) return empty()
  const page = Math.max(1, Math.floor(options.page ?? 1) || 1)
  const from = (page - 1) * NEWS_PAGE_SIZE
  let request = publishedPosts("exact").range(from, from + NEWS_PAGE_SIZE - 1)
  if (options.categoryId) request = request.eq("category_id", options.categoryId)
  const { data, count, error } = await request
  if (error) throw new Error(`Could not load the news: ${error.message}`)
  const total = count ?? 0
  return { rows: (data as PostRow[]).map(toNewsPost), total, page, pageCount: Math.max(1, Math.ceil(total / NEWS_PAGE_SIZE)) }
}

export async function getNewsPost(slug: string): Promise<NewsPost | null> {
  "use cache"
  cacheTag(cacheTags.news)
  cacheLife("minutes")
  if (isDemoMode()) return null
  const { data, error } = await publishedPosts().eq("slug", slug).maybeSingle()
  if (error) throw new Error(`Could not load the post: ${error.message}`)
  return data ? toNewsPost(data as PostRow) : null
}

/** Latest posts for the homepage, featured ones first. */
export async function getLatestNews(limit = 3): Promise<NewsPost[]> {
  "use cache"
  cacheTag(cacheTags.news)
  cacheLife("minutes")
  if (isDemoMode()) return []
  const { data, error } = await publishedPosts().limit(12)
  if (error) throw new Error(`Could not load the news: ${error.message}`)
  const posts = (data as PostRow[]).map(toNewsPost)
  // Keep the newest post first, then any featured ones, then the rest by date.
  const [newest, ...rest] = posts
  if (!newest) return []
  return [newest, ...rest.filter((post) => post.featured), ...rest.filter((post) => !post.featured)].slice(0, limit)
}

/** Other posts from the same category, then the latest. */
export async function getRelatedNews(post: Pick<NewsPost, "id" | "category">, limit = 3): Promise<NewsPost[]> {
  "use cache"
  cacheTag(cacheTags.news)
  cacheLife("minutes")
  if (isDemoMode()) return []
  const { data, error } = await publishedPosts().neq("id", post.id).limit(20)
  if (error) return []
  const posts = (data as PostRow[]).map(toNewsPost)
  const same = posts.filter((item) => post.category && item.category?.id === post.category.id)
  return [...same, ...posts.filter((item) => !same.includes(item))].slice(0, limit)
}

/** For sitemap.xml and the RSS feed. */
export async function getNewsForFeeds(limit = 1000): Promise<NewsPost[]> {
  "use cache"
  cacheTag(cacheTags.news)
  cacheLife("minutes")
  if (isDemoMode()) return []
  const { data } = await publishedPosts().limit(limit)
  return ((data ?? []) as PostRow[]).map(toNewsPost)
}

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------

export async function listAdminNews(options: { status?: string; query?: string; page?: number }): Promise<Paged<NewsPost>> {
  await requireFullAdmin()
  if (isDemoMode()) return empty()
  const supabase = await createClient()
  const page = Math.max(1, Math.floor(options.page ?? 1) || 1)
  const from = (page - 1) * ADMIN_PAGE_SIZE

  let request = supabase
    .from("news_posts")
    .select(POST_SELECT, { count: "exact" })
    .order("published_at", { ascending: false, nullsFirst: true })
    .order("updated_at", { ascending: false })
    .range(from, from + ADMIN_PAGE_SIZE - 1)
  if (options.status === "published") request = request.eq("status", "published").lte("published_at", new Date().toISOString())
  if (options.status === "scheduled") request = request.eq("status", "published").gt("published_at", new Date().toISOString())
  if (options.status === "draft") request = request.eq("status", "draft")
  const term = (options.query ?? "").replace(/[%,()*]/g, " ").trim()
  if (term) request = request.or(`title.ilike.%${term}%,slug.ilike.%${term}%,excerpt.ilike.%${term}%`)

  const { data, count, error } = await request
  if (error) throw new Error(error.message)
  const total = count ?? 0
  return { rows: (data as PostRow[]).map(toNewsPost), total, page, pageCount: Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE)) }
}

export async function getAdminNewsPost(id: string): Promise<NewsPost> {
  await requireFullAdmin()
  if (isDemoMode() || !UUID.test(id)) notFound()
  const supabase = await createClient()
  const { data, error } = await supabase.from("news_posts").select(POST_SELECT).eq("id", id).maybeSingle()
  if (error) throw new Error(error.message)
  if (!data) notFound()
  return toNewsPost(data as PostRow)
}

/** Categories with how many published posts each has. */
export async function listAdminNewsCategories(): Promise<NewsCategory[]> {
  await requireFullAdmin()
  if (isDemoMode()) return []
  const supabase = await createClient()
  const [categories, posts] = await Promise.all([
    supabase.from("news_categories").select("*").order("sort_order").order("name"),
    supabase.from("news_posts").select("category_id").eq("status", "published"),
  ])
  if (categories.error) throw new Error(categories.error.message)
  const counts = new Map<string, number>()
  for (const row of posts.data ?? []) if (row.category_id) counts.set(row.category_id, (counts.get(row.category_id) ?? 0) + 1)
  return categories.data.map((row) => ({ ...toNewsCategory(row), postCount: counts.get(row.id) ?? 0 }))
}
