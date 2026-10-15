"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { databaseError, failure, validationError } from "@/lib/actions/result"
import { getCurrentUser } from "@/lib/auth/session"
import { DEMO_READ_ONLY, isDemoMode } from "@/lib/demo/mode"
import { createClient } from "@/lib/supabase/server"
import { basketItemSchema } from "@/lib/validations/checkout"
import type { ActionResult } from "@/types/account"
import type { HelmetConfiguration } from "@/types/configurator"

const MAX_DESIGNS = 50

const saveDesignSchema = z.object({
  productSlug: z.string().min(1).max(80),
  name: z.string().trim().min(1, "Give your design a name").max(60, "Keep the name under 60 characters"),
  config: basketItemSchema.shape.config,
})

/** Saves a build to the signed-in customer's account. */
export async function saveDesign(values: {
  productSlug: string
  name: string
  config: HelmetConfiguration
}): Promise<ActionResult<{ id: string }>> {
  if (isDemoMode()) return DEMO_READ_ONLY
  const user = await getCurrentUser()
  if (!user) return failure("Please log in to save designs.")
  const parsed = saveDesignSchema.safeParse(values)
  if (!parsed.success) return validationError(parsed.error)

  const supabase = await createClient()
  const { count } = await supabase.from("saved_designs").select("id", { count: "exact", head: true }).eq("user_id", user.id)
  if ((count ?? 0) >= MAX_DESIGNS) return failure(`You can keep up to ${MAX_DESIGNS} designs. Delete one to save another.`)

  const { data, error } = await supabase
    .from("saved_designs")
    .insert({ product_slug: parsed.data.productSlug, name: parsed.data.name, config: parsed.data.config })
    .select("id")
    .single()
  if (error) return databaseError(error, "We couldn't save your design. Please try again.")

  revalidatePath("/account/designs")
  return { ok: true, message: `"${parsed.data.name}" saved to your account.`, data: { id: data.id } }
}

export async function deleteDesign(id: string): Promise<ActionResult> {
  if (isDemoMode()) return DEMO_READ_ONLY
  if (!(await getCurrentUser())) return failure("Please log in.")

  const supabase = await createClient()
  const { error } = await supabase.from("saved_designs").delete().eq("id", id)
  if (error) return databaseError(error, "We couldn't delete that design.")

  revalidatePath("/account/designs")
  return { ok: true, message: "Design deleted." }
}
