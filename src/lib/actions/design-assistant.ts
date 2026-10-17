"use server"

import { createHash } from "node:crypto"
import { headers } from "next/headers"
import { after } from "next/server"

import { databaseError, failure, validationError } from "@/lib/actions/result"
import { getProducts, getPriceBook } from "@/lib/data/products"
import { getDesignAdvisor } from "@/lib/design-assistant/advisor"
import { builderHref } from "@/lib/design-assistant/builder-link"
import { checkConceptImage, openAiConfigured, startConceptImage, type ConceptImageStatus } from "@/lib/design-assistant/openai"
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

/** AI concept images each visitor may start per hour. */
const IMAGES_PER_HOUR = 5

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
    return { ok: true, data: { ...analysis, suggestions, imageAvailable: openAiConfigured() } }
  } catch (error) {
    console.error("Design analysis failed:", error)
    return failure("Something went wrong while looking at your design. Please try again.")
  }
}

/** Open to guests, up to five an hour each: starts an AI concept image and returns the job to check on. */
export async function requestConceptImage(values: ConceptImageValues): Promise<ActionResult<{ jobId: string }>> {
  if (!openAiConfigured()) return failure("AI images aren't available right now.")
  const parsed = conceptImageSchema.safeParse(values)
  if (!parsed.success) return validationError(parsed.error)

  const supabase = await createClient()
  const { data: allowed, error } = await supabase.rpc("claim_ai_use", {
    p_visitor: await visitorKey(),
    p_kind: "image",
    p_limit: IMAGES_PER_HOUR,
    p_window_minutes: 60,
  })
  if (error) return databaseError(error, "We couldn't start your AI concept. Please try again.")
  if (!allowed) {
    return failure(`You've made ${IMAGES_PER_HOUR} AI concepts in the last hour. Try again a little later, or send us your design for a quote.`)
  }

  try {
    return { ok: true, data: { jobId: await startConceptImage(parsed.data) } }
  } catch (error) {
    console.error("Starting the AI concept image failed:", error instanceof Error ? error.message : error)
    return failure("The AI couldn't start your concept just now. Your suggestions below still work.")
  }
}

/** Checks on an AI concept image. The browser asks every few seconds until it's ready. */
export async function getConceptImage(jobId: string): Promise<ActionResult<ConceptImageStatus>> {
  if (!openAiConfigured() || !/^resp_[A-Za-z0-9]{8,80}$/.test(jobId)) return failure("That concept couldn't be found.")
  try {
    const result = await checkConceptImage(jobId)
    if (result.status === "failed") {
      console.error("AI concept image failed:", result.reason)
      const refused = /safety|moderation|policy/i.test(result.reason)
      return failure(refused ? "The AI couldn't draw that design. Try describing it differently." : "The AI couldn't finish your concept. Please try again.")
    }
    return { ok: true, data: result }
  } catch (error) {
    console.error("Checking the AI concept image failed:", error instanceof Error ? error.message : error)
    // A brief network hiccup shouldn't end the wait: report it as still working.
    return { ok: true, data: { status: "pending" } }
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
