"use server"

import { after } from "next/server"

import { databaseError, failure, validationError } from "@/lib/actions/result"
import { getProducts, getPriceBook } from "@/lib/data/products"
import { getDesignAdvisor } from "@/lib/design-assistant/advisor"
import { builderHref } from "@/lib/design-assistant/builder-link"
import { notifyNewQuote } from "@/lib/email/notifications"
import { DEMO_READ_ONLY, isDemoMode } from "@/lib/demo/mode"
import { createClient } from "@/lib/supabase/server"
import { designBriefSchema, quoteRequestSchema, type QuoteRequestValues } from "@/lib/validations/design-assistant"
import type { ActionResult } from "@/types/account"
import { quoteHelmetLabels, type DesignAnalysis, type DesignBrief } from "@/types/design-assistant"
import type { HelmetLook } from "@/types/helmet"

/** The parts of a look that carry the customer's colours and finish. */
function pickColourway({ finish, base, graphic, accent, trim, film }: HelmetLook): Partial<HelmetLook> {
  return { finish, base, graphic, accent, trim, film }
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
    return { ok: true, data: { ...analysis, suggestions } }
  } catch (error) {
    console.error("Design analysis failed:", error)
    return failure("Something went wrong while looking at your design. Please try again.")
  }
}

/** Open to guests: sends the brief and concept to the workshop as a quote request. */
export async function submitQuoteRequest(values: QuoteRequestValues): Promise<ActionResult<{ reference: string }>> {
  if (isDemoMode()) return DEMO_READ_ONLY
  const parsed = quoteRequestSchema.safeParse(values)
  if (!parsed.success) return validationError(parsed.error)
  const { name, email, phone, helmet, notes, imagePath, palette, concept, suggestedProducts } = parsed.data

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
      summary: concept?.summary ?? "",
    }),
  )
  return { ok: true, data: { reference } }
}
