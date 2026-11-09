"use server"

import { revalidatePath, updateTag } from "next/cache"
import { after } from "next/server"
import { z } from "zod"

import { databaseError, failure, validationError } from "@/lib/actions/result"
import { cacheTags } from "@/lib/data/cache-tags"
import { DEMO_READ_ONLY, isDemoMode } from "@/lib/demo/mode"
import { notifyCompetitionWinner } from "@/lib/email/notifications"
import { createClient } from "@/lib/supabase/server"
import type { ActionResult } from "@/types/account"
import { competitionStatuses } from "@/types/competition"

import { getAdmin, NOT_ALLOWED } from "./guard"

const settingsSchema = z
  .object({
    title: z.string().trim().min(3, "Add a title").max(120),
    prize: z.string().trim().max(500),
    description: z.string().trim().max(2000),
    rules: z.array(z.string().trim().min(1).max(1000)).max(40),
    opensAt: z.string().nullable(),
    closesAt: z.string().nullable(),
    judgingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
    status: z.enum(competitionStatuses),
  })
  .superRefine((value, context) => {
    if (value.opensAt && value.closesAt && Date.parse(value.closesAt) <= Date.parse(value.opensAt)) {
      context.addIssue({ code: "custom", path: ["closesAt"], message: "Entries must close after they open." })
    }
    // Entrants agree to the rules, so they have to exist before entries open.
    if (value.status === "open" && value.rules.length === 0) {
      context.addIssue({ code: "custom", path: ["rules"], message: "Add the rules before opening entries." })
    }
    if (value.status === "open" && !value.closesAt) {
      context.addIssue({ code: "custom", path: ["closesAt"], message: "Set a closing date before opening entries." })
    }
  })

export type CompetitionSettingsValues = z.input<typeof settingsSchema>

function refresh(entryId?: string) {
  updateTag(cacheTags.competition)
  revalidatePath("/competition")
  revalidatePath("/admin/competition")
  if (entryId) revalidatePath(`/admin/competition/entries/${entryId}`)
}

export async function updateCompetitionSettings(id: string, values: CompetitionSettingsValues): Promise<ActionResult> {
  if (isDemoMode()) return DEMO_READ_ONLY
  if (!(await getAdmin())) return NOT_ALLOWED
  const parsed = settingsSchema.safeParse(values)
  if (!parsed.success) return validationError(parsed.error)
  const settings = parsed.data

  const supabase = await createClient()
  const { error } = await supabase
    .from("competitions")
    .update({
      title: settings.title,
      prize: settings.prize,
      description: settings.description,
      rules: settings.rules,
      opens_at: settings.opensAt ? new Date(settings.opensAt).toISOString() : null,
      closes_at: settings.closesAt ? new Date(settings.closesAt).toISOString() : null,
      judging_date: settings.judgingDate,
      status: settings.status,
    })
    .eq("id", id)
  if (error) return databaseError(error, "We couldn't save the competition.")
  refresh()
  return { ok: true, message: "Competition saved." }
}

const entryUpdateSchema = z.object({
  status: z.enum(["entered", "shortlisted", "disqualified"]),
  adminNotes: z.string().trim().max(4000, "Keep notes under 4,000 characters"),
})

/** Shortlist, disqualify or put back an entry, and keep private notes on it. The winner is chosen separately. */
export async function updateCompetitionEntry(id: string, values: z.input<typeof entryUpdateSchema>): Promise<ActionResult> {
  if (isDemoMode()) return DEMO_READ_ONLY
  if (!(await getAdmin())) return NOT_ALLOWED
  const parsed = entryUpdateSchema.safeParse(values)
  if (!parsed.success) return validationError(parsed.error)

  const supabase = await createClient()
  const { data: current } = await supabase.from("competition_entries").select("status").eq("id", id).maybeSingle()
  if (!current) return failure("That entry no longer exists.")
  if (current.status === "winner") return failure("This entry is the winner. Choose another winner first to change it.")

  const { error } = await supabase.from("competition_entries").update({ status: parsed.data.status, admin_notes: parsed.data.adminNotes }).eq("id", id)
  if (error) return databaseError(error, "We couldn't update the entry.")
  refresh(id)
  return { ok: true, message: "Entry updated." }
}

/** Makes this entry the winner, announces it on the competition page and emails the winner. */
export async function chooseCompetitionWinner(id: string): Promise<ActionResult> {
  if (isDemoMode()) return DEMO_READ_ONLY
  if (!(await getAdmin())) return NOT_ALLOWED

  const supabase = await createClient()
  const { error } = await supabase.rpc("choose_competition_winner", { p_entry: id })
  if (error) return databaseError(error, "We couldn't choose this winner.")

  const { data: entry } = await supabase.from("competition_entries").select("reference, name, email, design_name, competition_id").eq("id", id).maybeSingle()
  const { data: competition } = entry
    ? await supabase.from("competitions").select("title, prize").eq("id", entry.competition_id).maybeSingle()
    : { data: null }
  if (entry && competition) {
    after(() =>
      notifyCompetitionWinner({
        reference: entry.reference,
        customerName: entry.name,
        customerEmail: entry.email,
        designName: entry.design_name,
        competitionTitle: competition.title,
        prize: competition.prize,
      }),
    )
  }
  refresh(id)
  return { ok: true, message: `Winner chosen${entry ? ` and ${entry.email} emailed` : ""}. It's now on the competition page.` }
}
