"use server"

import { getCurrentUser } from "@/lib/auth/session"
import { DEMO_READ_ONLY, isDemoMode } from "@/lib/demo/mode"
import { createClient } from "@/lib/supabase/server"
import { profileSchema, type ProfileValues } from "@/lib/validations/account"
import { changePasswordSchema, type ChangePasswordValues } from "@/lib/validations/auth"
import type { ActionResult } from "@/types/account"

import { databaseError, failure, validationError } from "./result"

export async function updateProfile(values: ProfileValues): Promise<ActionResult> {
  if (isDemoMode()) return DEMO_READ_ONLY
  const user = await getCurrentUser()
  if (!user) return failure("Please log in again.")

  const parsed = profileSchema.safeParse(values)
  if (!parsed.success) return validationError(parsed.error)
  const { fullName, phone, address } = parsed.data

  const supabase = await createClient()
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: fullName,
      phone,
      address_line1: address.line1,
      address_line2: address.line2,
      city: address.city,
      county: address.county,
      postcode: address.postcode.toUpperCase(),
      country: address.country || "United Kingdom",
    })
    .eq("id", user.id)

  if (error) return databaseError(error, "We couldn't save your details. Please try again.")
  return { ok: true, message: "Your details are saved." }
}

export async function changePassword(values: ChangePasswordValues): Promise<ActionResult> {
  if (isDemoMode()) return DEMO_READ_ONLY
  const user = await getCurrentUser()
  if (!user) return failure("Please log in again.")

  const parsed = changePasswordSchema.safeParse(values)
  if (!parsed.success) return validationError(parsed.error)

  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password })
  if (error) {
    if (error.code === "same_password") return failure("Choose a password you haven't used before.")
    return failure("We couldn't change your password. Please try again.")
  }
  return { ok: true, message: "Password changed." }
}
