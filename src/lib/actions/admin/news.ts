"use server"

import { revalidatePath, updateTag } from "next/cache"

import { databaseError, failure, validationError } from "@/lib/actions/result"
import { cacheTags } from "@/lib/data/cache-tags"
import { DEMO_READ_ONLY, isDemoMode } from "@/lib/demo/mode"
import { slugify } from "@/lib/news/text"
import { createClient } from "@/lib/supabase/server"
import {
  newNewsPostSchema,
  newsCategorySchema,
  newsPostSchema,
  type NewNewsPostValues,
  type NewsCategoryValues,
  type NewsPostValues,
} from "@/lib/validations/news"
import type { ActionResult } from "@/types/account"

import { getFullAdmin, NOT_ALLOWED } from "./guard"

const SLUG_TAKEN = "23505"

function refreshNews(...paths: string[]) {
  updateTag(cacheTags.news)
  revalidatePath("/admin/news")
  for (const path of paths) revalidatePath(path)
}

/** Starts a draft from a title and returns its id, for the editor. */
export async function createNewsPost(values: NewNewsPostValues): Promise<ActionResult<{ id: string }>> {
  if (isDemoMode()) return DEMO_READ_ONLY
  if (!(await getFullAdmin())) return NOT_ALLOWED
  const parsed = newNewsPostSchema.safeParse(values)
  if (!parsed.success) return validationError(parsed.error)

  const supabase = await createClient()
  const base = slugify(parsed.data.title) || "post"
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const slug = attempt === 0 ? base : `${base}-${attempt + 1}`
    const { data, error } = await supabase.from("news_posts").insert({ title: parsed.data.title, slug }).select("id").single()
    if (data) {
      refreshNews()
      return { ok: true, message: "Draft created.", data: { id: data.id } }
    }
    if (error?.code !== SLUG_TAKEN) return databaseError(error, "We couldn't create the post.")
  }
  return failure("A post with that title already exists. Try a different title.")
}

export async function updateNewsPost(id: string, values: NewsPostValues): Promise<ActionResult> {
  if (isDemoMode()) return DEMO_READ_ONLY
  if (!(await getFullAdmin())) return NOT_ALLOWED
  const parsed = newsPostSchema.safeParse(values)
  if (!parsed.success) return validationError(parsed.error)
  const data = parsed.data

  const supabase = await createClient()
  const { data: previous } = await supabase.from("news_posts").select("slug").eq("id", id).maybeSingle()
  const { error } = await supabase
    .from("news_posts")
    .update({
      title: data.title,
      slug: data.slug,
      excerpt: data.excerpt,
      body: data.body,
      cover_url: data.coverUrl,
      cover_alt: data.coverAlt,
      category_id: data.categoryId,
      status: data.status,
      published_at: data.publishedAt ? new Date(data.publishedAt).toISOString() : null,
      featured: data.featured,
      author_name: data.authorName,
      seo_title: data.seoTitle,
      seo_description: data.seoDescription,
      result: data.result && Object.values(data.result).some(Boolean) ? data.result : null,
    })
    .eq("id", id)
  if (error?.code === SLUG_TAKEN) {
    return { ok: false, message: "Please check the highlighted fields.", fieldErrors: { slug: "Another post already uses this web address." } }
  }
  if (error) return databaseError(error, "We couldn't save the post.")

  refreshNews(`/admin/news/${id}`, "/news", `/news/${data.slug}`, ...(previous && previous.slug !== data.slug ? [`/news/${previous.slug}`] : []))
  const live = data.status === "published" && data.publishedAt && Date.parse(data.publishedAt) <= Date.now()
  return { ok: true, message: data.status === "draft" ? "Draft saved." : live ? "Post published." : "Post scheduled." }
}

export async function deleteNewsPost(id: string): Promise<ActionResult> {
  if (isDemoMode()) return DEMO_READ_ONLY
  if (!(await getFullAdmin())) return NOT_ALLOWED
  const supabase = await createClient()
  const { data, error } = await supabase.from("news_posts").delete().eq("id", id).select("title, slug").maybeSingle()
  if (error) return databaseError(error, "We couldn't delete the post.")
  if (!data) return failure("That post no longer exists.")
  refreshNews("/news", `/news/${data.slug}`)
  return { ok: true, message: `"${data.title}" deleted.` }
}

/** Adds a category when `id` is null, otherwise updates it. */
export async function saveNewsCategory(id: string | null, values: NewsCategoryValues): Promise<ActionResult> {
  if (isDemoMode()) return DEMO_READ_ONLY
  if (!(await getFullAdmin())) return NOT_ALLOWED
  const parsed = newsCategorySchema.safeParse(values)
  if (!parsed.success) return validationError(parsed.error)
  const row = { name: parsed.data.name, slug: parsed.data.slug, description: parsed.data.description, sort_order: parsed.data.sortOrder }

  const supabase = await createClient()
  const { error } = id
    ? await supabase.from("news_categories").update(row).eq("id", id)
    : await supabase.from("news_categories").insert(row)
  if (error?.code === SLUG_TAKEN) {
    return { ok: false, message: "Please check the highlighted fields.", fieldErrors: { slug: "Another category already uses this web address." } }
  }
  if (error) return databaseError(error, "We couldn't save the category.")
  refreshNews("/admin/news/categories", "/news")
  return { ok: true, message: id ? "Category saved." : `${parsed.data.name} added.` }
}

/** Removes a category; its posts stay published, without a category. */
export async function deleteNewsCategory(id: string): Promise<ActionResult> {
  if (isDemoMode()) return DEMO_READ_ONLY
  if (!(await getFullAdmin())) return NOT_ALLOWED
  const supabase = await createClient()
  const { data, error } = await supabase.from("news_categories").delete().eq("id", id).select("name").maybeSingle()
  if (error) return databaseError(error, "We couldn't delete the category.")
  if (!data) return failure("That category no longer exists.")
  refreshNews("/admin/news/categories", "/news")
  return { ok: true, message: `${data.name} deleted. Its posts are now uncategorised.` }
}
