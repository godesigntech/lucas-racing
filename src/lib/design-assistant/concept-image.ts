import "server-only"

import { cloudflareImagesConfigured, paintWithCloudflare } from "./cloudflare"
import type { ImageRequest } from "./image-prompt"
import { openAiImagesConfigured, paintWithOpenAi } from "./openai"

export { ConceptImageError } from "./image-prompt"

// Which service paints the concept image: OpenAI when OPENAI_API_KEY is set
// (best likeness to the customer's helmet), otherwise Cloudflare's free tier.

export function conceptImagesConfigured(): boolean {
  return openAiImagesConfigured() || cloudflareImagesConfigured()
}

/** Paints the concept image and returns it as a JPEG data URL. Throws ConceptImageError. */
export function generateConceptImage(request: ImageRequest): Promise<string> {
  return openAiImagesConfigured() ? paintWithOpenAi(request) : paintWithCloudflare(request)
}
