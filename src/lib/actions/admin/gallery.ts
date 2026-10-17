"use server"

import { revalidatePath, updateTag } from "next/cache"

import { databaseError, failure, validationError } from "@/lib/actions/result"
import { cacheTags } from "@/lib/data/cache-tags"
import { DEMO_READ_ONLY, isDemoMode } from "@/lib/demo/mode"
import { slugify } from "@/lib/news/text"
import { createClient } from "@/lib/supabase/server"
import { albumSchema, captionSchema, newAlbumSchema, newPhotosSchema, type AlbumValues, type NewAlbumValues } from "@/lib/validations/gallery"
import type { ActionResult } from "@/types/account"

import { getFullAdmin, NOT_ALLOWED } from "./guard"

const SLUG_TAKEN = "23505"
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function refreshGallery(albumId?: string) {
  updateTag(cacheTags.gallery)
  revalidatePath("/admin/gallery")
  revalidatePath("/gallery")
  if (albumId) revalidatePath(`/admin/gallery/${albumId}`)
}

/** Starts a hidden album from a title and returns its id. */
export async function createAlbum(values: NewAlbumValues): Promise<ActionResult<{ id: string }>> {
  if (isDemoMode()) return DEMO_READ_ONLY
  if (!(await getFullAdmin())) return NOT_ALLOWED
  const parsed = newAlbumSchema.safeParse(values)
  if (!parsed.success) return validationError(parsed.error)

  const supabase = await createClient()
  const base = slugify(parsed.data.title) || "album"
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const slug = attempt === 0 ? base : `${base}-${attempt + 1}`
    const { data, error } = await supabase.from("gallery_albums").insert({ title: parsed.data.title, slug }).select("id").single()
    if (data) {
      refreshGallery()
      return { ok: true, message: "Album created. Add photos, then publish it.", data: { id: data.id } }
    }
    if (error?.code !== SLUG_TAKEN) return databaseError(error, "We couldn't create the album.")
  }
  return failure("An album with that title already exists. Try a different title.")
}

export async function updateAlbum(id: string, values: AlbumValues): Promise<ActionResult> {
  if (isDemoMode()) return DEMO_READ_ONLY
  if (!(await getFullAdmin())) return NOT_ALLOWED
  const parsed = albumSchema.safeParse(values)
  if (!parsed.success) return validationError(parsed.error)
  const data = parsed.data

  const supabase = await createClient()
  const { error } = await supabase
    .from("gallery_albums")
    .update({
      title: data.title,
      slug: data.slug,
      event: data.event,
      album_date: data.albumDate || null,
      description: data.description,
      is_published: data.isPublished,
    })
    .eq("id", id)
  if (error?.code === SLUG_TAKEN) return { ok: false, message: "Please check the highlighted fields.", fieldErrors: { slug: "Another album already uses this web address." } }
  if (error) return databaseError(error, "We couldn't save the album.")
  refreshGallery(id)
  return { ok: true, message: data.isPublished ? "Album saved and published." : "Album saved (hidden from the website)." }
}

export async function deleteAlbum(id: string): Promise<ActionResult> {
  if (isDemoMode()) return DEMO_READ_ONLY
  if (!(await getFullAdmin())) return NOT_ALLOWED
  const supabase = await createClient()
  const { data, error } = await supabase.from("gallery_albums").delete().eq("id", id).select("title").maybeSingle()
  if (error) return databaseError(error, "We couldn't delete the album.")
  if (!data) return failure("That album no longer exists.")
  refreshGallery()
  return { ok: true, message: `"${data.title}" deleted.` }
}

/** Adds uploaded photos to the end of an album. */
export async function addPhotos(albumId: string, photos: { url: string; width: number; height: number }[]): Promise<ActionResult> {
  if (isDemoMode()) return DEMO_READ_ONLY
  if (!(await getFullAdmin())) return NOT_ALLOWED
  if (!UUID.test(albumId)) return failure("That album no longer exists.")
  const parsed = newPhotosSchema.safeParse(photos)
  if (!parsed.success) return failure("Some photos didn't upload properly. Please try again.")

  const supabase = await createClient()
  const { data: last } = await supabase.from("gallery_photos").select("sort_order").eq("album_id", albumId).order("sort_order", { ascending: false }).limit(1).maybeSingle()
  const start = (last?.sort_order ?? 0) + 10
  const { error } = await supabase
    .from("gallery_photos")
    .insert(parsed.data.map((photo, index) => ({ album_id: albumId, image_url: photo.url, width: photo.width, height: photo.height, sort_order: start + index * 10 })))
  if (error) return databaseError(error, "We couldn't add the photos.")
  refreshGallery(albumId)
  return { ok: true, message: parsed.data.length === 1 ? "Photo added." : `${parsed.data.length} photos added.` }
}

export async function updatePhotoCaption(albumId: string, photoId: string, caption: string): Promise<ActionResult> {
  if (isDemoMode()) return DEMO_READ_ONLY
  if (!(await getFullAdmin())) return NOT_ALLOWED
  const parsed = captionSchema.safeParse(caption)
  if (!parsed.success) return failure(parsed.error.issues[0]?.message ?? "That caption isn't valid.")
  const supabase = await createClient()
  const { error } = await supabase.from("gallery_photos").update({ caption: parsed.data }).eq("id", photoId).eq("album_id", albumId)
  if (error) return databaseError(error, "We couldn't save the caption.")
  refreshGallery(albumId)
  return { ok: true, message: "Caption saved." }
}

export async function deletePhoto(albumId: string, photoId: string): Promise<ActionResult> {
  if (isDemoMode()) return DEMO_READ_ONLY
  if (!(await getFullAdmin())) return NOT_ALLOWED
  const supabase = await createClient()
  const { data, error } = await supabase.from("gallery_photos").delete().eq("id", photoId).eq("album_id", albumId).select("image_url").maybeSingle()
  if (error) return databaseError(error, "We couldn't delete the photo.")
  // If it was the cover, fall back to the first photo.
  if (data) await supabase.from("gallery_albums").update({ cover_url: null }).eq("id", albumId).eq("cover_url", data.image_url)
  refreshGallery(albumId)
  return { ok: true, message: "Photo deleted." }
}

/** Saves a new photo order (the ids in display order). */
export async function reorderPhotos(albumId: string, photoIds: string[]): Promise<ActionResult> {
  if (isDemoMode()) return DEMO_READ_ONLY
  if (!(await getFullAdmin())) return NOT_ALLOWED
  if (photoIds.length > 500 || !photoIds.every((id) => UUID.test(id))) return failure("That order couldn't be saved.")
  const supabase = await createClient()
  const results = await Promise.all(
    photoIds.map((id, index) => supabase.from("gallery_photos").update({ sort_order: (index + 1) * 10 }).eq("id", id).eq("album_id", albumId)),
  )
  const failed = results.find((result) => result.error)
  if (failed?.error) return databaseError(failed.error, "We couldn't save the order.")
  refreshGallery(albumId)
  return { ok: true, message: "Order saved." }
}

export async function setAlbumCover(albumId: string, imageUrl: string): Promise<ActionResult> {
  if (isDemoMode()) return DEMO_READ_ONLY
  if (!(await getFullAdmin())) return NOT_ALLOWED
  const supabase = await createClient()
  // Only a photo already in this album can be the cover.
  const { data: photo } = await supabase.from("gallery_photos").select("id").eq("album_id", albumId).eq("image_url", imageUrl).limit(1).maybeSingle()
  if (!photo) return failure("Pick a photo from this album.")
  const { error } = await supabase.from("gallery_albums").update({ cover_url: imageUrl }).eq("id", albumId)
  if (error) return databaseError(error, "We couldn't set the cover.")
  refreshGallery(albumId)
  return { ok: true, message: "Cover photo set." }
}
