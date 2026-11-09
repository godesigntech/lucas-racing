"use server"

import { revalidatePath } from "next/cache"
import { after } from "next/server"
import { z } from "zod"

import { databaseError, failure, validationError } from "@/lib/actions/result"
import { getCurrentUser } from "@/lib/auth/session"
import { getPriceBook } from "@/lib/data/products"
import { DEMO_READ_ONLY, isDemoMode } from "@/lib/demo/mode"
import { notifyNewQuote } from "@/lib/email/notifications"
import { quoteReasons } from "@/lib/configurator/pricing-rules"
import { createClient } from "@/lib/supabase/server"
import { helmetItemSchema } from "@/lib/validations/checkout"
import type { ActionResult } from "@/types/account"
import type { HelmetConfiguration } from "@/types/configurator"

const buildQuoteSchema = z.object({
  slug: z.string().min(1).max(80),
  name: z.string().max(80),
  config: helmetItemSchema.shape.config,
  summary: z.array(z.object({ key: z.string().max(60), label: z.string().max(80), value: z.string().max(300) })).max(120),
  notes: z.string().trim().max(2000, "Please keep your notes under 2,000 characters."),
})

/**
 * Sends a bespoke build (one with a bespoke image or a dip) to the workshop to be
 * priced. submit_build_quote() checks the customer is signed in and owns every image.
 */
export async function submitBuildQuote(values: {
  slug: string
  name: string
  config: HelmetConfiguration
  summary: { key: string; label: string; value: string }[]
  notes: string
}): Promise<ActionResult<{ reference: string }>> {
  if (isDemoMode()) return DEMO_READ_ONLY
  const user = await getCurrentUser()
  if (!user) return failure("Please log in to send your design.")

  const parsed = buildQuoteSchema.safeParse(values)
  if (!parsed.success) return validationError(parsed.error)
  const build = parsed.data

  const supabase = await createClient()
  const { data, error } = await supabase.rpc("submit_build_quote", {
    p_build: { slug: build.slug, name: build.name, config: build.config, summary: build.summary },
    p_notes: build.notes,
  })
  if (error) return databaseError(error, "We couldn't send your design. Please try again.")
  const reference = data?.[0]?.reference
  if (!reference) return failure("We couldn't send your design. Please try again.")

  const priceBook = await getPriceBook()
  const reasons = quoteReasons(build.config as HelmetConfiguration, priceBook)
  after(() =>
    notifyNewQuote({
      reference,
      name: user.fullName || user.email,
      email: user.email,
      phone: "",
      helmet: `Bespoke build: ${build.name}`,
      notes: build.notes,
      summary: `Needs pricing: ${reasons.join(", ") || "bespoke design"}. See the 3D design in Admin > Quotes.`,
    }),
  )

  revalidatePath("/account/quotes")
  return { ok: true, message: `Design sent. Your reference is ${reference}.`, data: { reference } }
}
