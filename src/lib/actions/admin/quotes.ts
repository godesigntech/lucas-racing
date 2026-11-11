"use server"

import { revalidatePath } from "next/cache"
import { after } from "next/server"
import { z } from "zod"

import { databaseError, validationError } from "@/lib/actions/result"
import { chromeBaseCoatPrice, helmetDeposit } from "@/lib/configurator/pricing-rules"
import { getPriceBook } from "@/lib/data/products"
import { DEMO_READ_ONLY, isDemoMode } from "@/lib/demo/mode"
import { notifyQuotePrice } from "@/lib/email/notifications"
import { createClient } from "@/lib/supabase/server"
import { quoteUpdateSchema, type QuoteUpdateValues } from "@/lib/validations/design-assistant"
import type { ActionResult } from "@/types/account"

import { getAdmin, NOT_ALLOWED } from "./guard"

export async function updateQuoteRequest(id: string, values: QuoteUpdateValues): Promise<ActionResult> {
  if (isDemoMode()) return DEMO_READ_ONLY
  if (!(await getAdmin())) return NOT_ALLOWED

  const parsed = quoteUpdateSchema.safeParse(values)
  if (!parsed.success) return validationError(parsed.error)

  const supabase = await createClient()
  const { error } = await supabase
    .from("quote_requests")
    .update({ status: parsed.data.status, admin_notes: parsed.data.adminNotes })
    .eq("id", id)
  if (error) return databaseError(error, "We couldn't update the quote request.")

  revalidatePath(`/admin/quotes/${id}`)
  revalidatePath("/admin/quotes")
  return { ok: true, message: "Quote request updated." }
}

const sendPriceSchema = z.object({
  price: z.number().positive("Enter a price above £0").max(100000, "That price looks too high"),
  note: z.string().trim().max(2000, "Keep the note under 2,000 characters"),
})

/**
 * Prices a bespoke build: saves the price and the deposit (10%, plus the chrome base coat in full with a
 * chrome base coat), marks the request quoted and emails the customer.
 */
export async function sendBuildQuotePrice(id: string, values: { price: number; note: string }): Promise<ActionResult> {
  if (isDemoMode()) return DEMO_READ_ONLY
  if (!(await getAdmin())) return NOT_ALLOWED

  const parsed = sendPriceSchema.safeParse(values)
  if (!parsed.success) return validationError(parsed.error)

  const supabase = await createClient()
  const { data: quote, error: readError } = await supabase.from("quote_requests").select("reference, name, email, kind, details").eq("id", id).maybeSingle()
  if (readError) return databaseError(readError, "We couldn't load the quote request.")
  if (!quote || quote.kind !== "build") return { ok: false, message: "Only builder designs can be priced here." }

  const details = (quote.details ?? {}) as { name?: string; config?: { baseCoat?: string } }
  const chrome = details.config?.baseCoat === "chrome"
  const price = Math.round(parsed.data.price * 100) / 100
  const deposit = helmetDeposit(price, { baseCoat: chrome ? "chrome" : undefined }, chromeBaseCoatPrice(await getPriceBook()))

  const { error } = await supabase
    .from("quote_requests")
    .update({ quoted_price: price, quoted_deposit: deposit, quoted_at: new Date().toISOString(), status: "quoted" })
    .eq("id", id)
  if (error) return databaseError(error, "We couldn't save the price.")

  after(() =>
    notifyQuotePrice({
      reference: quote.reference,
      customerName: quote.name,
      customerEmail: quote.email,
      designName: details.name || "helmet",
      price,
      deposit,
      chrome,
      note: parsed.data.note,
    }),
  )

  revalidatePath(`/admin/quotes/${id}`)
  revalidatePath("/admin/quotes")
  revalidatePath("/account/quotes")
  return { ok: true, message: `Price sent to ${quote.email}.` }
}
