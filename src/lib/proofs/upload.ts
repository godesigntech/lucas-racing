"use client"

import { createClient } from "@/lib/supabase/browser"

const BUCKET = "order-proofs"
const MAX_SIDE = 2000
const TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"]

/**
 * Uploads a design proof or a finished-helmet photograph.
 *
 * The bucket is private: the first folder of the path is the order id, which is how the
 * storage policy lets that order's customer read their own proofs and nobody else's.
 * Images are resized in the browser like every other upload here; a PDF goes up as it is.
 *
 * Returns the storage path, which is what order_proofs.image_path stores — never a URL,
 * because reading it always needs a fresh signed link.
 */
export async function uploadOrderProof(orderId: string, file: File): Promise<string> {
  if (!TYPES.includes(file.type)) throw new Error(`${file.name} isn't a JPG, PNG, WebP or PDF.`)
  if (file.size > 10 * 1024 * 1024) throw new Error(`${file.name} is over 10 MB.`)

  const storage = createClient().storage.from(BUCKET)

  if (file.type === "application/pdf") {
    const path = `${orderId}/${crypto.randomUUID()}.pdf`
    const { error } = await storage.upload(path, file, { contentType: "application/pdf" })
    if (error) throw new Error(error.message)
    return path
  }

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
      canvas.toBlob((result) => (result ? resolve(result) : reject(new Error(`Couldn't read ${file.name}.`))), "image/webp", 0.85),
    )
    const path = `${orderId}/${crypto.randomUUID()}.webp`
    const { error } = await storage.upload(path, blob, { contentType: "image/webp" })
    if (error) throw new Error(error.message)
    return path
  } finally {
    bitmap.close()
  }
}
