import "server-only"

import { cacheLife, cacheTag } from "next/cache"
import { notFound } from "next/navigation"

import { requireFullAdmin } from "@/lib/auth/session"
import { isDemoMode } from "@/lib/demo/mode"
import type { GalleryAlbumRow, GalleryPhotoRow } from "@/lib/supabase/database.types"
import { createClient, createPublicClient } from "@/lib/supabase/server"
import type { GalleryAlbum, GalleryAlbumWithPhotos, GalleryPhoto } from "@/types/gallery"

import { cacheTags } from "./cache-tags"

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
type AlbumRow = GalleryAlbumRow & { gallery_photos: GalleryPhotoRow[] }
const ALBUM_SELECT = "*, gallery_photos(*)"

function toPhoto(row: GalleryPhotoRow): GalleryPhoto {
  return {
    id: row.id,
    albumId: row.album_id,
    imageUrl: row.image_url,
    caption: row.caption,
    width: row.width,
    height: row.height,
    sortOrder: row.sort_order,
  }
}

function sortPhotos(rows: GalleryPhotoRow[]): GalleryPhoto[] {
  return [...rows].sort((a, b) => a.sort_order - b.sort_order || a.created_at.localeCompare(b.created_at)).map(toPhoto)
}

function toAlbum(row: AlbumRow): GalleryAlbumWithPhotos {
  const photos = sortPhotos(row.gallery_photos ?? [])
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    event: row.event,
    albumDate: row.album_date,
    description: row.description,
    coverUrl: row.cover_url ?? photos[0]?.imageUrl ?? null,
    isPublished: row.is_published,
    sortOrder: row.sort_order,
    photoCount: photos.length,
    photos,
  }
}

function withoutPhotos(album: GalleryAlbumWithPhotos): GalleryAlbum {
  const copy: Partial<GalleryAlbumWithPhotos> = { ...album }
  delete copy.photos
  return copy as GalleryAlbum
}

// Public ------------------------------------------------------------------------

/** Published albums, newest event first. */
export async function getGalleryAlbums(): Promise<GalleryAlbum[]> {
  "use cache"
  cacheTag(cacheTags.gallery)
  cacheLife("hours")
  if (isDemoMode()) return []
  const { data, error } = await createPublicClient()
    .from("gallery_albums")
    .select(ALBUM_SELECT)
    .eq("is_published", true)
    .order("album_date", { ascending: false, nullsFirst: false })
    .order("sort_order")
  if (error) throw new Error(`Could not load the gallery: ${error.message}`)
  return (data as AlbumRow[]).map(toAlbum).filter((album) => album.photoCount > 0).map(withoutPhotos)
}

export async function getGalleryAlbum(slug: string): Promise<GalleryAlbumWithPhotos | null> {
  "use cache"
  cacheTag(cacheTags.gallery)
  cacheLife("hours")
  if (isDemoMode()) return null
  const { data, error } = await createPublicClient().from("gallery_albums").select(ALBUM_SELECT).eq("slug", slug).eq("is_published", true).maybeSingle()
  if (error) throw new Error(`Could not load the album: ${error.message}`)
  return data ? toAlbum(data as AlbumRow) : null
}

// Admin -------------------------------------------------------------------------

export async function listAdminAlbums(): Promise<GalleryAlbum[]> {
  await requireFullAdmin()
  if (isDemoMode()) return []
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("gallery_albums")
    .select(ALBUM_SELECT)
    .order("album_date", { ascending: false, nullsFirst: true })
    .order("created_at", { ascending: false })
  if (error) throw new Error(error.message)
  return (data as AlbumRow[]).map(toAlbum).map(withoutPhotos)
}

export async function getAdminAlbum(id: string): Promise<GalleryAlbumWithPhotos> {
  await requireFullAdmin()
  if (isDemoMode() || !UUID.test(id)) notFound()
  const supabase = await createClient()
  const { data, error } = await supabase.from("gallery_albums").select(ALBUM_SELECT).eq("id", id).maybeSingle()
  if (error) throw new Error(error.message)
  if (!data) notFound()
  return toAlbum(data as AlbumRow)
}
