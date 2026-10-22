import "server-only"

import { ConceptImageError, imagePrompt, photoBytes, type ImageRequest } from "./image-prompt"

// Cloudflare Workers AI can paint the design assistant's concept image with FLUX.2,
// free up to Cloudflare's daily allowance (10,000 credits). It's the fallback:
// OpenAI paints the image whenever OPENAI_API_KEY is set (see ./concept-image).
// The account id and token are read on the server only and never reach the browser.
//
// - With the customer's photo, FLUX.2 [dev] repaints their own helmet: same shape,
//   angle and hardware, only the paint changes. About 700 credits an image at 8
//   steps, so roughly 14 a day for free.
// - From a description alone, FLUX.2 [klein] paints a new helmet, which costs far less.
//
// One request makes the whole image (usually 7 to 20 seconds). Netlify lets a
// website request run for 60 seconds, so no background job is needed.

const EDIT_MODEL = "@cf/black-forest-labs/flux-2-dev"
/** Enough for clean paintwork; more steps cost proportionally more and look much the same. */
const EDIT_STEPS = "8"
const CREATE_MODEL = "@cf/black-forest-labs/flux-2-klein-4b"
/** Both attempts together stay inside Netlify's 60 second limit. */
const TOTAL_BUDGET_MS = 50_000
/** Too little time left for a retry to finish. */
const MIN_RETRY_MS = 15_000
/** Long side of the image; the short side follows the photo's shape. */
const IMAGE_SIDE = 768

export function cloudflareImagesConfigured(): boolean {
  return Boolean(process.env.CLOUDFLARE_ACCOUNT_ID && process.env.CLOUDFLARE_API_TOKEN)
}

/** Cloudflare's error codes for a flagged image and for a used-up allowance. */
const FLAGGED = 3030
const QUOTA = new Set([3036, 4006])

/** Width and height of a JPEG, read from its frame header. */
function jpegSize(bytes: Buffer): { width: number; height: number } | null {
  let offset = 2
  while (offset + 9 < bytes.length) {
    if (bytes[offset] !== 0xff) return null
    const marker = bytes[offset + 1]
    // SOF0 to SOF15, except DHT (C4), JPG (C8) and DAC (CC), carry the size.
    if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
      return { height: bytes.readUInt16BE(offset + 5), width: bytes.readUInt16BE(offset + 7) }
    }
    offset += 2 + bytes.readUInt16BE(offset + 2)
  }
  return null
}

/** The output size: the photo's shape with the long side at IMAGE_SIDE, in steps of 16. */
function outputSize(photo: Buffer | undefined): { width: number; height: number } {
  const size = photo && jpegSize(photo)
  if (!size?.width || !size.height) return { width: IMAGE_SIDE, height: IMAGE_SIDE }
  const scale = IMAGE_SIDE / Math.max(size.width, size.height)
  const side = (value: number) => Math.max(256, Math.round((value * scale) / 16) * 16)
  return { width: side(size.width), height: side(size.height) }
}

async function runModel(prompt: string, photo: Buffer | undefined, timeoutMs: number): Promise<string> {
  const { width, height } = outputSize(photo)
  const form = new FormData()
  form.append("prompt", prompt)
  form.append("width", String(width))
  form.append("height", String(height))
  if (photo) {
    // The browser sends a JPEG under 512px, the most these models take as a reference.
    form.append("input_image_0", new Blob([new Uint8Array(photo)], { type: "image/jpeg" }), "reference.jpg")
    form.append("steps", EDIT_STEPS)
  }

  const model = photo ? EDIT_MODEL : CREATE_MODEL
  const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/ai/run/${model}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}` },
    body: form,
    signal: AbortSignal.timeout(timeoutMs),
    cache: "no-store",
  })
  const body = (await response.json().catch(() => ({}))) as {
    success?: boolean
    result?: { image?: string }
    errors?: { code?: number; message?: string }[]
  }
  const image = body.result?.image
  if (response.ok && body.success && image) {
    console.info(`AI concept image made with ${model}: ${response.headers.get("cf-ai-neurons") ?? "?"} of the 10,000 free daily credits`)
    return `data:image/jpeg;base64,${image}`
  }

  const errors = body.errors ?? []
  const message = errors.map((error) => `${error.code}: ${error.message}`).join("; ") || `Cloudflare returned ${response.status}`
  if (errors.some((error) => error.code === FLAGGED)) throw new ConceptImageError(message, "flagged")
  if (response.status === 429 || errors.some((error) => error.code !== undefined && QUOTA.has(error.code))) {
    throw new ConceptImageError(message, "quota")
  }
  throw new ConceptImageError(message, "failed")
}

/** Paints the concept image with Cloudflare and returns it as a JPEG data URL. */
export async function paintWithCloudflare(request: ImageRequest): Promise<string> {
  const deadline = Date.now() + TOTAL_BUDGET_MS
  const photo = photoBytes(request.photo)
  const prompt = imagePrompt(photo ? request : { ...request, photo: undefined })
  try {
    return await runModel(prompt, photo, TOTAL_BUDGET_MS)
  } catch (error) {
    // Cloudflare's content filter now and then flags a harmless result. Another
    // attempt usually passes; it keeps the photo so the helmet stays theirs.
    const left = deadline - Date.now()
    if (!(error instanceof ConceptImageError && error.reason === "flagged") || left < MIN_RETRY_MS) throw error
    console.warn("Cloudflare flagged the concept image; trying once more.")
    return runModel(prompt, photo, left)
  }
}
