"use server"

import { createHash } from "node:crypto"
import { headers } from "next/headers"
import { after } from "next/server"

import { databaseError, failure, validationError } from "@/lib/actions/result"
import { getProducts, getPriceBook } from "@/lib/data/products"
import { getDesignAdvisor } from "@/lib/design-assistant/advisor"
import { builderHref } from "@/lib/design-assistant/builder-link"
import { ConceptImageError, conceptImagesConfigured, generateConceptImage } from "@/lib/design-assistant/concept-image"
import { notifyNewQuote } from "@/lib/email/notifications"
import { DEMO_READ_ONLY, isDemoMode } from "@/lib/demo/mode"
import { createClient } from "@/lib/supabase/server"
import {
  conceptImageSchema,
  designBriefSchema,
  quoteRequestSchema,
  type ConceptImageValues,
  type QuoteRequestValues,
} from "@/lib/validations/design-assistant"
import type { ActionResult } from "@/types/account"
import { quoteHelmetLabels, type DesignAnalysis, type DesignBrief } from "@/types/design-assistant"
import type { HelmetLook } from "@/types/helmet"

const DEFAULT_IMAGES_PER_HOUR = 5

/**
 * AI images each visitor may make per hour: AI_IMAGES_PER_HOUR (1 to 100, the most
 * claim_ai_use() accepts), or 5. Raise it while testing.
 */
function imagesPerHour(): number {
  const setting = Number(process.env.AI_IMAGES_PER_HOUR)
  return Number.isInteger(setting) && setting >= 1 && setting <= 100 ? setting : DEFAULT_IMAGES_PER_HOUR
}

/** The parts of a look that carry the customer's colours and finish. */
function pickColourway({ finish, base, graphic, accent, trim, film }: HelmetLook): Partial<HelmetLook> {
  return { finish, base, graphic, accent, trim, film }
}

/**
 * Who is asking, for the AI limit: a one-way hash of their connection, never the
 * address itself. Netlify passes the visitor's address in x-nf-client-connection-ip.
 */
async function visitorKey(): Promise<string> {
  const list = await headers()
  const address =
    list.get("x-nf-client-connection-ip") ?? list.get("x-forwarded-for")?.split(",")[0]?.trim() ?? list.get("x-real-ip") ?? "unknown"
  return createHash("sha256")
    .update(`${process.env.AI_LIMIT_SALT ?? "lucas-racing-ai"}:${address}`)
    .digest("hex")
}

/** Open to guests: suggests a concept and matching designs. Saves nothing. */
export async function analyseDesignBrief(brief: DesignBrief): Promise<ActionResult<DesignAnalysis>> {
  const parsed = designBriefSchema.safeParse(brief)
  if (!parsed.success) return validationError(parsed.error)

  try {
    const [products, priceBook] = await Promise.all([getProducts(), getPriceBook()])
    const analysis = await getDesignAdvisor().analyse(parsed.data, products)
    if (!analysis) return failure("We couldn't find any designs to compare with right now. Please try again later.")

    // Each suggestion opens in the builder wearing the concept's colours.
    const suggestions = analysis.suggestions.map((suggestion) => {
      const product = products.find((item) => item.slug === suggestion.slug)
      const look = { ...suggestion.look, ...pickColourway(analysis.concept) }
      return product ? { ...suggestion, builderHref: builderHref(product, look, priceBook) } : suggestion
    })
    return { ok: true, data: { ...analysis, suggestions, imageAvailable: conceptImagesConfigured() } }
  } catch (error) {
    console.error("Design analysis failed:", error)
    return failure("Something went wrong while looking at your design. Please try again.")
  }
}

/** Open to guests, up to imagesPerHour() each: paints an AI concept image of the customer's design. */
export async function requestConceptImage(values: ConceptImageValues): Promise<ActionResult<{ image: string }>> {
  if (!conceptImagesConfigured()) return failure("AI images aren't available right now.")
  const parsed = conceptImageSchema.safeParse(values)
  if (!parsed.success) return validationError(parsed.error)

  const supabase = await createClient()
  const visitor = await visitorKey()
  const limit = imagesPerHour()
  const { data: allowed, error } = await supabase.rpc("claim_ai_use", {
    p_visitor: visitor,
    p_kind: "image",
    p_limit: limit,
    p_window_minutes: 60,
  })
  if (error) return databaseError(error, "We couldn't start your AI concept. Please try again.")
  if (!allowed) {
    return failure(`You've made ${limit} AI concepts in the last hour. Try again a little later, or send us your design for a quote.`)
  }

  try {
    return { ok: true, data: { image: await generateConceptImage(parsed.data) } }
  } catch (error) {
    console.error("AI concept image failed:", error instanceof Error ? error.message : error)
    // Nothing was made, so give the attempt back.
    await supabase.rpc("release_ai_use", { p_visitor: visitor, p_kind: "image" })
    const reason = error instanceof ConceptImageError ? error.reason : "failed"
    if (reason === "quota") {
      return failure("AI images are busy right now. Your suggestions below still work, or send us your design for a quote.")
    }
    if (reason === "flagged") return failure("The AI couldn't draw that design. Try describing it differently.")
    return failure("The AI couldn't finish your concept. Please try again.")
  }
}

/** Open to guests: sends the brief and concept to the workshop as a quote request. */
export async function submitQuoteRequest(values: QuoteRequestValues): Promise<ActionResult<{ reference: string }>> {
  if (isDemoMode()) return DEMO_READ_ONLY
  const parsed = quoteRequestSchema.safeParse(values)
  if (!parsed.success) return validationError(parsed.error)
  const { name, email, phone, helmet, notes, imagePath, aiImagePath, palette, concept, suggestedProducts } = parsed.data

  const supabase = await createClient()
  const { data, error } = await supabase.rpc("submit_quote_request", {
    p_name: name,
    p_email: email,
    p_phone: phone,
    p_helmet: helmet,
    p_notes: notes,
    p_image_path: imagePath,
    p_palette: palette.map((hex) => hex.toLowerCase()),
    p_concept: concept ?? {},
    p_suggested_products: suggestedProducts,
    p_ai_image_path: aiImagePath ?? null,
  })
  if (error) return databaseError(error, "We couldn't send your request. Please try again.")

  const reference = data?.[0]?.reference
  if (!reference) return failure("We couldn't send your request. Please try again.")

  after(() =>
    notifyNewQuote({
      reference,
      name,
      email,
      phone,
      helmet: quoteHelmetLabels[helmet],
      notes,
      summary: [concept?.summary ?? "", aiImagePath ? "An AI concept image is attached in Admin > Quotes." : ""].filter(Boolean).join(" "),
    }),
  )
  return { ok: true, data: { reference } }
}
