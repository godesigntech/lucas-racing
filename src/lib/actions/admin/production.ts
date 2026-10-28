"use server"

import { revalidatePath, updateTag } from "next/cache"

import { databaseError, failure, validationError } from "@/lib/actions/result"
import { cacheTags } from "@/lib/data/cache-tags"
import { weekStart } from "@/lib/dates/uk"
import { DEMO_READ_ONLY, isDemoMode } from "@/lib/demo/mode"
import { createClient } from "@/lib/supabase/server"
import {
  blackoutSchema,
  capacitySchema,
  productionSettingsSchema,
  rushTierSchema,
  type BlackoutValues,
  type CapacityValues,
  type ProductionSettingsValues,
  type RushTierValues,
} from "@/lib/validations/production"
import type { ActionResult } from "@/types/account"

import { getFullAdmin, NOT_ALLOWED } from "./guard"

/**
 * Production scheduling and rush orders.
 *
 * Rush fees came from the client as a suggestion and have not been approved, so turning
 * rush on is a separate, deliberate act from editing the numbers: a tier only sells when
 * it is active, has a fee, and production_settings.rush_enabled is on. place_order()
 * checks all three again in the database.
 */
function refreshProduction() {
  updateTag(cacheTags.production)
  revalidatePath("/admin/production")
  revalidatePath("/checkout")
}

export async function updateProductionSettings(values: ProductionSettingsValues): Promise<ActionResult> {
  if (isDemoMode()) return DEMO_READ_ONLY
  if (!(await getFullAdmin())) return NOT_ALLOWED

  const parsed = productionSettingsSchema.safeParse(values)
  if (!parsed.success) return validationError(parsed.error)
  const data = parsed.data

  const supabase = await createClient()
  const { error } = await supabase
    .from("production_settings")
    .update({
      standard_lead_weeks: data.standardLeadWeeks,
      weekly_capacity: data.weeklyCapacity,
      booking_lead_days: data.bookingLeadDays,
      horizon_weeks: data.horizonWeeks,
      rush_enabled: data.rushEnabled,
    })
    .eq("id", 1)
  if (error) return databaseError(error, "We couldn't save the production settings.")

  refreshProduction()
  return {
    ok: true,
    message: data.rushEnabled
      ? "Saved. Rush options are now offered at checkout."
      : "Saved. Customers see standard production only.",
  }
}

export async function saveRushTier(values: RushTierValues): Promise<ActionResult> {
  if (isDemoMode()) return DEMO_READ_ONLY
  if (!(await getFullAdmin())) return NOT_ALLOWED

  const parsed = rushTierSchema.safeParse(values)
  if (!parsed.success) return validationError(parsed.error)
  const data = parsed.data

  // A tier with no agreed fee can't be sold, so switching it on would mislead.
  if (data.isActive && data.fee === null) {
    return { ok: false, message: "Please check the highlighted fields.", fieldErrors: { fee: "Set a fee before offering this turnaround." } }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from("production_rush_tiers")
    .update({
      label: data.label,
      lead_weeks: data.leadWeeks,
      fee: data.fee,
      max_per_week: data.maxPerWeek,
      is_draft: data.isDraft,
      is_active: data.isActive,
    })
    .eq("key", data.key)
  if (error) return databaseError(error, "We couldn't save the turnaround.")

  refreshProduction()
  return { ok: true, message: data.isDraft ? "Saved as a draft price." : "Turnaround saved." }
}

/** Sets how many helmets may start in one week, overriding the standing capacity. */
export async function setWeekCapacity(values: CapacityValues): Promise<ActionResult> {
  if (isDemoMode()) return DEMO_READ_ONLY
  if (!(await getFullAdmin())) return NOT_ALLOWED

  const parsed = capacitySchema.safeParse(values)
  if (!parsed.success) return validationError(parsed.error)
  const data = parsed.data

  // Capacity is per production week, which always starts on a Monday.
  const monday = weekStart(data.weekStart)

  const supabase = await createClient()
  const { error } = await supabase
    .from("production_capacity")
    .upsert({ week_start: monday, slots: data.slots, note: data.note }, { onConflict: "week_start" })
  if (error) return databaseError(error, "We couldn't save that week's capacity.")

  refreshProduction()
  return { ok: true, message: "Capacity saved." }
}

export async function clearWeekCapacity(weekStartDate: string): Promise<ActionResult> {
  if (isDemoMode()) return DEMO_READ_ONLY
  if (!(await getFullAdmin())) return NOT_ALLOWED

  const supabase = await createClient()
  const { error } = await supabase.from("production_capacity").delete().eq("week_start", weekStartDate)
  if (error) return databaseError(error, "We couldn't reset that week.")

  refreshProduction()
  return { ok: true, message: "That week is back to the standing capacity." }
}

export async function addBlackout(values: BlackoutValues): Promise<ActionResult> {
  if (isDemoMode()) return DEMO_READ_ONLY
  if (!(await getFullAdmin())) return NOT_ALLOWED

  const parsed = blackoutSchema.safeParse(values)
  if (!parsed.success) return validationError(parsed.error)
  const data = parsed.data

  const supabase = await createClient()
  const { error } = await supabase
    .from("production_blackouts")
    .insert({ starts_on: data.startsOn, ends_on: data.endsOn, reason: data.reason })
  if (error) return databaseError(error, "We couldn't add those closed dates.")

  refreshProduction()
  return { ok: true, message: "Closed dates added. Customers can't start production then." }
}

export async function deleteBlackout(id: string): Promise<ActionResult> {
  if (isDemoMode()) return DEMO_READ_ONLY
  if (!(await getFullAdmin())) return NOT_ALLOWED
  if (!id) return failure("That entry is no longer there.")

  const supabase = await createClient()
  const { error } = await supabase.from("production_blackouts").delete().eq("id", id)
  if (error) return databaseError(error, "We couldn't remove those dates.")

  refreshProduction()
  return { ok: true, message: "Closed dates removed." }
}
