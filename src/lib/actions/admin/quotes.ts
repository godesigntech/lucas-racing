"use server"

import { revalidatePath } from "next/cache"

import { databaseError, validationError } from "@/lib/actions/result"
import { DEMO_READ_ONLY, isDemoMode } from "@/lib/demo/mode"
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
