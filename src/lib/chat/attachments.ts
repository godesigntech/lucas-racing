import { createClient } from "@/lib/supabase/browser"

export const CHAT_BUCKET = "chat-attachments"
export const CHAT_IMAGE_MAX_BYTES = 5 * 1024 * 1024

const extensions: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
}

export const CHAT_IMAGE_ACCEPT = Object.keys(extensions).join(",")

/** A message explaining why the file can't be sent, or null when it's fine. */
export function validateChatImage(file: File): string | null {
  if (!extensions[file.type]) return "Please choose a JPG, PNG, WebP or GIF image."
  if (file.size > CHAT_IMAGE_MAX_BYTES) return "That photo is over 5 MB. Please choose a smaller one."
  return null
}

/** Uploads a photo into the customer's folder and returns its storage path. */
export async function uploadChatImage(customerId: string, file: File): Promise<string> {
  const path = `${customerId}/${crypto.randomUUID()}.${extensions[file.type]}`
  const { error } = await createClient().storage.from(CHAT_BUCKET).upload(path, file, { contentType: file.type })
  if (error) throw new Error(error.message)
  return path
}

const SIGNED_URL_SECONDS = 60 * 60
const signedUrls = new Map<string, { url: string; expiresAt: number }>()

/** A short-lived link to a private chat photo, cached until shortly before it expires. */
export async function getChatImageUrl(path: string): Promise<string> {
  const cached = signedUrls.get(path)
  if (cached && cached.expiresAt > Date.now() + 60_000) return cached.url

  const { data, error } = await createClient().storage.from(CHAT_BUCKET).createSignedUrl(path, SIGNED_URL_SECONDS)
  if (error) throw new Error(error.message)
  signedUrls.set(path, { url: data.signedUrl, expiresAt: Date.now() + SIGNED_URL_SECONDS * 1000 })
  return data.signedUrl
}
