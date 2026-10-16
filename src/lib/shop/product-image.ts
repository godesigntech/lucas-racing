"use client"

import { createClient } from "@/lib/supabase/browser"

const BUCKET = "product-images"
const MAX_SIDE = 1600

/**
 * Resizes a product photo in the browser (longest side 1600px, WebP) and uploads it
 * to the public product-images bucket. Admins only (storage policy). Returns its URL.
 */
export async function uploadProductImage(productId: string, file: File): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Please choose an image file.")
  const bitmap = await createImageBitmap(file)
  try {
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement("canvas")
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)
    const context = canvas.getContext("2d")
    if (!context) throw new Error("Canvas isn't supported in this browser.")
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    const blob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((result) => (result ? resolve(result) : reject(new Error("Couldn't read that image."))), "image/webp", 0.85),
    )

    const storage = createClient().storage.from(BUCKET)
    const path = `${productId}/${crypto.randomUUID()}.webp`
    const { error } = await storage.upload(path, blob, { contentType: "image/webp" })
    if (error) throw new Error(error.message)
    return storage.getPublicUrl(path).data.publicUrl
  } finally {
    bitmap.close()
  }
}
