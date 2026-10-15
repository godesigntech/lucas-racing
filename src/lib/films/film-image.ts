"use client"

import { createClient } from "@/lib/supabase/browser"

const BUCKET = "film-images"
const TEXTURE_SIZE = 512
const THUMB_SIZE = 160

async function squareWebp(bitmap: ImageBitmap, size: number, quality: number): Promise<Blob> {
  // Centre square crop, like the supplier catalogue photos.
  const side = Math.min(bitmap.width, bitmap.height)
  const canvas = document.createElement("canvas")
  canvas.width = size
  canvas.height = size
  const context = canvas.getContext("2d")
  if (!context) throw new Error("Canvas isn't supported in this browser.")
  context.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, size, size)
  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Couldn't read that image."))), "image/webp", quality),
  )
}

/**
 * Turns a film photo into the 512px texture (3D helmet) and 160px swatch (picker)
 * and uploads both to the public film-images bucket. Admins only (storage policy).
 */
export async function uploadFilmImage(filmId: string, file: File): Promise<{ textureUrl: string; thumbUrl: string }> {
  if (!file.type.startsWith("image/")) throw new Error("Please choose an image file.")
  const bitmap = await createImageBitmap(file)
  try {
    const [texture, thumb] = await Promise.all([squareWebp(bitmap, TEXTURE_SIZE, 0.8), squareWebp(bitmap, THUMB_SIZE, 0.72)])
    const storage = createClient().storage.from(BUCKET)
    const stamp = Date.now()
    const paths = { texture: `${filmId}/${stamp}-texture.webp`, thumb: `${filmId}/${stamp}-thumb.webp` }
    const [first, second] = await Promise.all([
      storage.upload(paths.texture, texture, { contentType: "image/webp" }),
      storage.upload(paths.thumb, thumb, { contentType: "image/webp" }),
    ])
    if (first.error || second.error) throw new Error((first.error ?? second.error)!.message)
    return {
      textureUrl: storage.getPublicUrl(paths.texture).data.publicUrl,
      thumbUrl: storage.getPublicUrl(paths.thumb).data.publicUrl,
    }
  } finally {
    bitmap.close()
  }
}
