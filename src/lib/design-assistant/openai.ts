import "server-only"

import { ConceptImageError, imagePrompt, photoBytes, type ImageRequest } from "./image-prompt"
import { secret } from "./secret"

// OpenAI paints the design assistant's concept image. With the customer's photo
// it edits that photo: same helmet, shape, visor and hardware, new paint. Without
// one it paints a new helmet. The key is read on the server only and never
// reaches the browser. The model and quality can be changed with
// OPENAI_IMAGE_MODEL and OPENAI_IMAGE_QUALITY (low, medium or high).
//
// One request makes the whole image (usually 15 to 25 seconds at medium quality).
// Netlify lets a website request run for 60 seconds, so no background job is needed.

const API = "https://api.openai.com/v1"
const DEFAULT_MODEL = "gpt-image-2.5-flare"
const DEFAULT_QUALITY = "medium"
/** Stays inside Netlify's 60 second limit. */
const IMAGE_TIMEOUT_MS = 50_000

export function openAiImagesConfigured(): boolean {
  return Boolean(secret("OPENAI_API_KEY"))
}

const model = () => process.env.OPENAI_IMAGE_MODEL || DEFAULT_MODEL
const quality = () => (["low", "medium", "high"].includes(process.env.OPENAI_IMAGE_QUALITY ?? "") ? process.env.OPENAI_IMAGE_QUALITY! : DEFAULT_QUALITY)

/** OpenAI's error codes for a refused image and for a used-up balance or rate limit. */
const FLAGGED = new Set(["moderation_blocked", "content_policy_violation"])
const QUOTA = new Set(["insufficient_quota", "billing_hard_limit_reached", "rate_limit_exceeded"])

/** Paints the concept image with OpenAI and returns it as a JPEG data URL. */
export async function paintWithOpenAi(request: ImageRequest): Promise<string> {
  const photo = photoBytes(request.photo)
  const settings = {
    model: model(),
    prompt: imagePrompt(photo ? request : { ...request, photo: undefined }),
    quality: quality(),
    size: "1024x1024",
    output_format: "jpeg",
  }

  // With a photo it's an edit of that photo, sent as a file upload; without one,
  // a new picture, which that endpoint only takes as JSON.
  let body: FormData | string
  const headers: Record<string, string> = { Authorization: `Bearer ${secret("OPENAI_API_KEY")}` }
  if (photo) {
    const form = new FormData()
    for (const [key, value] of Object.entries(settings)) form.append(key, value)
    form.append("image[]", new Blob([new Uint8Array(photo)], { type: "image/jpeg" }), "helmet.jpg")
    body = form
  } else {
    body = JSON.stringify(settings)
    headers["Content-Type"] = "application/json"
  }

  return `data:image/jpeg;base64,${await requestImage(photo ? "edits" : "generations", body, headers)}`
}

/** A picture OpenAI should work from, e.g. a blank sticker layout or a logo. */
export interface ImageInput {
  bytes: Uint8Array
  type: "image/png" | "image/jpeg" | "image/webp"
  name: string
}

/**
 * Edits pictures with OpenAI from a prompt (the first picture is the one being changed;
 * any others are references, like logos to include). Returns the JPEG's base64.
 * Throws ConceptImageError ("flagged", "quota" or "failed").
 */
export async function editWithOpenAi(prompt: string, images: ImageInput[], size: "1024x1024" | "1536x1024" | "1024x1536" = "1024x1024"): Promise<string> {
  const form = new FormData()
  for (const [key, value] of Object.entries({ model: model(), prompt, quality: quality(), size, output_format: "jpeg" })) form.append(key, value)
  for (const image of images) form.append("image[]", new Blob([new Uint8Array(image.bytes)], { type: image.type }), image.name)
  return requestImage("edits", form, { Authorization: `Bearer ${secret("OPENAI_API_KEY")}` })
}

/** One call to OpenAI's images API: the picture's base64, or a ConceptImageError saying why not. */
async function requestImage(endpoint: "edits" | "generations", body: FormData | string, headers: Record<string, string>): Promise<string> {
  const response = await fetch(`${API}/images/${endpoint}`, {
    method: "POST",
    headers,
    body,
    signal: AbortSignal.timeout(IMAGE_TIMEOUT_MS),
    cache: "no-store",
  })
  const result = (await response.json().catch(() => ({}))) as {
    data?: { b64_json?: string }[]
    error?: { code?: string | null; type?: string; message?: string }
  }
  const image = result.data?.[0]?.b64_json
  if (response.ok && image) return image

  const code = result.error?.code ?? result.error?.type ?? ""
  const message = `${code || response.status}: ${result.error?.message ?? "OpenAI returned no image"}`
  if (FLAGGED.has(code)) throw new ConceptImageError(message, "flagged")
  if (response.status === 429 || QUOTA.has(code) || /credit|billing|quota/i.test(code)) throw new ConceptImageError(message, "quota")
  throw new ConceptImageError(message, "failed")
}
