export type NewsStatus = "draft" | "published"

export interface NewsCategory {
  id: string
  name: string
  slug: string
  description: string
  sortOrder: number
  /** Published posts in the category (admin lists only). */
  postCount?: number
}

export interface NewsPost {
  id: string
  slug: string
  title: string
  excerpt: string
  /** Markdown. */
  body: string
  coverUrl: string | null
  coverAlt: string
  category: Pick<NewsCategory, "id" | "name" | "slug"> | null
  status: NewsStatus
  publishedAt: string | null
  featured: boolean
  authorName: string
  seoTitle: string
  seoDescription: string
  createdAt: string
  updatedAt: string
  /** Minutes to read, from the body's word count. */
  readingMinutes: number
}
