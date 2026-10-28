import "server-only"

import { connection } from "next/server"

import { requireFullAdmin } from "@/lib/auth/session"
import { isDemoMode } from "@/lib/demo/mode"
import {
  toProductionBlackout,
  toProductionSettings,
  toProductionWeek,
  toRushTier,
} from "@/lib/supabase/mappers"
import { createClient, createPublicClient } from "@/lib/supabase/server"
import { addWeeks, weekStart, ukToday } from "@/lib/dates/uk"
import type { ProductionBlackout, ProductionSettings, ProductionWeek, RushTier } from "@/types/production"

import { isMissingTable } from "./schema-state"

/**
 * Production scheduling.
 *
 * Capacity and blackouts are workshop business and stay behind the admin guard. What
 * customers see is the output of public.production_availability(), which only says how
 * many slots are left in a week — never who booked them.
 */

const defaultSettings: ProductionSettings = {
  standardLeadWeeks: 6,
  weeklyCapacity: 4,
  bookingLeadDays: 7,
  horizonWeeks: 26,
  rushEnabled: false,
}

/** The provisional tiers from the client's brief, as they ship: off, and marked draft. */
const draftTiers: RushTier[] = [
  { key: "standard", label: "Standard", leadWeeks: 6, fee: 0, maxPerWeek: 1000, isDraft: false, isActive: true, sortOrder: 1 },
  { key: "rush-3-week", label: "Rush — 3 weeks", leadWeeks: 3, fee: 100, maxPerWeek: 2, isDraft: true, isActive: false, sortOrder: 2 },
  { key: "rush-2-week", label: "Rush — 2 weeks", leadWeeks: 2, fee: 150, maxPerWeek: 1, isDraft: true, isActive: false, sortOrder: 3 },
  { key: "priority-1-week", label: "Priority — 1 week", leadWeeks: 1, fee: 200, maxPerWeek: 1, isDraft: true, isActive: false, sortOrder: 4 },
]

export interface AdminProduction {
  ready: boolean
  settings: ProductionSettings
  tiers: RushTier[]
  blackouts: ProductionBlackout[]
  weeks: ProductionWeek[]
}

export async function getAdminProduction(): Promise<AdminProduction> {
  // The calendar is built from today's date, which can't be prerendered. In demo mode
  // nothing else reads the request, so say so explicitly.
  await connection()
  await requireFullAdmin()
  if (isDemoMode()) {
    return { ready: true, settings: defaultSettings, tiers: draftTiers, blackouts: [], weeks: demoWeeks() }
  }

  const supabase = await createClient()
  const [settings, tiers, blackouts, availability] = await Promise.all([
    supabase.from("production_settings").select("*").eq("id", 1).maybeSingle(),
    supabase.from("production_rush_tiers").select("*").order("sort_order"),
    supabase.from("production_blackouts").select("*").order("starts_on"),
    supabase.rpc("production_availability", { p_weeks: 16 }),
  ])

  const error = settings.error ?? tiers.error ?? blackouts.error ?? availability.error
  if (error) {
    if (isMissingTable(error)) {
      return { ready: false, settings: defaultSettings, tiers: draftTiers, blackouts: [], weeks: [] }
    }
    throw new Error(`Could not load production settings: ${error.message}`)
  }

  return {
    ready: true,
    settings: settings.data ? toProductionSettings(settings.data) : defaultSettings,
    tiers: (tiers.data ?? []).map(toRushTier),
    blackouts: (blackouts.data ?? []).map(toProductionBlackout),
    weeks: (availability.data ?? []).map(toProductionWeek),
  }
}

/**
 * The weeks a customer can choose from at checkout. Public, because the builder shows an
 * estimated completion date before anyone signs in.
 */
export async function getProductionAvailability(weeks = 16): Promise<ProductionWeek[]> {
  await connection()
  if (isDemoMode()) return demoWeeks()

  const supabase = createPublicClient()
  const { data, error } = await supabase.rpc("production_availability", { p_weeks: weeks })
  if (error) {
    if (isMissingTable(error)) return []
    throw new Error(`Could not load production dates: ${error.message}`)
  }
  return (data ?? []).map(toProductionWeek)
}

/** Demo mode: a rolling calendar with one week blocked, so the UI has something to show. */
function demoWeeks(): ProductionWeek[] {
  const first = weekStart(ukToday())
  return Array.from({ length: 16 }, (_, index) => {
    const start = addWeeks(first, index + 1)
    const booked = index === 2 ? 4 : index % 3
    return {
      weekStart: start,
      slots: 4,
      booked,
      available: Math.max(4 - booked, 0),
      isBlackedOut: index === 5,
      isBookable: index !== 5 && booked < 4,
    }
  })
}

/**
 * What the customer picks from at checkout: the weeks the workshop can start in, and
 * the turnarounds actually on sale.
 *
 * A rush tier only reaches this list when it is active, has an agreed fee, and rush is
 * switched on overall — the same three conditions place_order() checks before it will
 * charge for one. While any of them is false the customer simply sees standard
 * production, which is how unapproved rush pricing stays invisible.
 */
export interface ProductionOptions {
  ready: boolean
  weeks: ProductionWeek[]
  tiers: RushTier[]
  standardLeadWeeks: number
}

export async function getProductionOptions(): Promise<ProductionOptions> {
  await connection()
  if (isDemoMode()) {
    return { ready: true, weeks: demoWeeks(), tiers: [draftTiers[0]], standardLeadWeeks: 6 }
  }

  const supabase = createPublicClient()
  const [settings, tiers, availability] = await Promise.all([
    supabase.from("production_settings").select("*").eq("id", 1).maybeSingle(),
    supabase.from("production_rush_tiers").select("*").eq("is_active", true).order("sort_order"),
    supabase.rpc("production_availability", { p_weeks: 16 }),
  ])

  const error = settings.error ?? tiers.error ?? availability.error
  if (error) {
    if (isMissingTable(error)) return { ready: false, weeks: [], tiers: [], standardLeadWeeks: 6 }
    throw new Error(`Could not load production dates: ${error.message}`)
  }

  const config = settings.data ? toProductionSettings(settings.data) : defaultSettings
  const live = (tiers.data ?? [])
    .map(toRushTier)
    .filter((tier) => tier.key === "standard" || (config.rushEnabled && tier.fee !== null))

  return {
    ready: true,
    weeks: (availability.data ?? []).map(toProductionWeek),
    tiers: live,
    standardLeadWeeks: config.standardLeadWeeks,
  }
}
