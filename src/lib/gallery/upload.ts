"use client"

import { createClient } from "@/lib/supabase/browser"

const BUCKET = "gallery"
const MAX_SIDE = 2000

export interface UploadedPhoto {
  url: string
  width: number
  height: number
}

/**
 * Resizes a gallery photo in the browser (longest side 2000px, WebP) and uploads it to
 * the public gallery bucket. Admins only (storage policy). Returns its URL and size.
 */
export async function uploadGalleryPhoto(file: File): Promise<UploadedPhoto> {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) throw new Error(`${file.name} isn't a JPG, PNG or WebP photo.`)
  if (file.size > 25 * 1024 * 1024) throw new Error(`${file.name} is over 25 MB.`)
  const bitmap = await createImageBitmap(file)
  try {
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height))
    const width = Math.round(bitmap.width * scale)
    const height = Math.round(bitmap.height * scale)
    const canvas = document.createElement("canvas")
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext("2d")
    if (!context) throw new Error("Canvas isn't supported in this browser.")
    context.drawImage(bitmap, 0, 0, width, height)
    const blob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((result) => (result ? resolve(result) : reject(new Error(`Couldn't read ${file.name}.`))), "image/webp", 0.82),
    )
    const storage = createClient().storage.from(BUCKET)
    const path = `${crypto.randomUUID()}.webp`
    const { error } = await storage.upload(path, blob, { contentType: "image/webp" })
    if (error) throw new Error(error.message)
    return { url: storage.getPublicUrl(path).data.publicUrl, width, height }
  } finally {
    bitmap.close()
  }
}
