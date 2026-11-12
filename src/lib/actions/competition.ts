"use server"

import { revalidatePath } from "next/cache"
import { after } from "next/server"
import { z } from "zod"

import { databaseError, failure, validationError } from "@/lib/actions/result"
import { getCurrentUser } from "@/lib/auth/session"
import { getCompetition } from "@/lib/data/competition"
import { DEMO_READ_ONLY, isDemoMode } from "@/lib/demo/mode"
import { notifyCompetitionEntry } from "@/lib/email/notifications"
import { createClient } from "@/lib/supabase/server"
import { helmetItemSchema } from "@/lib/validations/checkout"
import type { ActionResult } from "@/types/account"
import type { HelmetConfiguration } from "@/types/configurator"

const entrySchema = z.object({
  competitionId: z.string().uuid(),
  slug: z.string().min(1).max(80),
  designName: z.string().trim().min(1, "Give your design a name").max(60, "Keep the name under 60 characters"),
  config: helmetItemSchema.shape.config,
  summary: z.array(z.object({ key: z.string().max(60), label: z.string().max(80), value: z.string().max(300) })).max(120),
  agreedRules: z.literal(true, { message: "Please agree to the competition rules." }),
  marketingOptIn: z.boolean(),
  ukResident: z.literal(true, { message: "The competition is only open to people with a UK address." }),
  postUrl: z.string().trim().max(500).regex(/^https?:\/\/\S+$/, "Add the link to your social media post."),
  imagePath: z.string().regex(/^quotes\/[0-9a-f-]{36}\.(jpg|png|webp)$/).optional(),
})

/**
 * Enters the customer's build in the competition, or replaces their entry (one each).
 * enter_competition() checks they're signed in, entries are open and the images are theirs.
 */
export async function enterCompetition(values: {
  competitionId: string
  slug: string
  designName: string
  config: HelmetConfiguration
  summary: { key: string; label: string; value: string }[]
  agreedRules: boolean
  marketingOptIn: boolean
  ukResident: boolean
  postUrl: string
  imagePath?: string
}): Promise<ActionResult<{ reference: string; updated: boolean }>> {
  if (isDemoMode()) return DEMO_READ_ONLY
  const user = await getCurrentUser()
  if (!user) return failure("Please log in to enter.")

  const parsed = entrySchema.safeParse(values)
  if (!parsed.success) return validationError(parsed.error)
  const entry = parsed.data

  const supabase = await createClient()
  const { data, error } = await supabase.rpc("enter_competition", {
    p_competition: entry.competitionId,
    p_entry: {
      slug: entry.slug,
      designName: entry.designName,
      config: entry.config,
      summary: entry.summary,
      agreedRules: entry.agreedRules,
      marketingOptIn: entry.marketingOptIn,
      ukResident: entry.ukResident,
      postUrl: entry.postUrl,
      imagePath: entry.imagePath ?? null,
    },
  })
  if (error) return databaseError(error, "We couldn't save your entry. Please try again.")
  const row = data?.[0]
  if (!row) return failure("We couldn't save your entry. Please try again.")

  const competition = await getCompetition()
  after(() =>
    notifyCompetitionEntry({
      reference: row.reference,
      customerName: user.fullName || user.email,
      customerEmail: user.email,
      designName: entry.designName,
      competitionTitle: competition?.title ?? "our helmet competition",
      closesAt: competition?.closesAt ?? null,
      updated: row.updated,
    }),
  )

  revalidatePath("/account/competition")
  revalidatePath("/admin/competition")
  return {
    ok: true,
    message: row.updated ? "Your entry has been updated." : "You're in! Good luck.",
    data: { reference: row.reference, updated: row.updated },
  }
}
