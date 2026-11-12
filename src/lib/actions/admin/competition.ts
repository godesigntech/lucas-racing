"use server"

import { revalidatePath, updateTag } from "next/cache"
import { after } from "next/server"
import { z } from "zod"

import { databaseError, failure, validationError } from "@/lib/actions/result"
import { cacheTags } from "@/lib/data/cache-tags"
import { DEMO_READ_ONLY, isDemoMode } from "@/lib/demo/mode"
import { notifyCompetitionVoucher, notifyCompetitionWinner } from "@/lib/email/notifications"
import { canCreateAccounts, createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import type { ActionResult } from "@/types/account"
import { competitionStatuses } from "@/types/competition"

import { getAdmin, getFullAdmin, NOT_ALLOWED } from "./guard"

const settingsSchema = z
  .object({
    title: z.string().trim().min(3, "Add a title").max(120),
    prize: z.string().trim().max(500),
    description: z.string().trim().max(2000),
    rules: z.array(z.string().trim().min(1).max(1000)).max(40),
    opensAt: z.string().nullable(),
    closesAt: z.string().nullable(),
    judgingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
    votingOpensAt: z.string().nullable(),
    votingClosesAt: z.string().nullable(),
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
    if (value.votingOpensAt && value.votingClosesAt && Date.parse(value.votingClosesAt) <= Date.parse(value.votingOpensAt)) {
      context.addIssue({ code: "custom", path: ["votingClosesAt"], message: "Voting must close after it opens." })
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
      voting_opens_at: settings.votingOpensAt ? new Date(settings.votingOpensAt).toISOString() : null,
      voting_closes_at: settings.votingClosesAt ? new Date(settings.votingClosesAt).toISOString() : null,
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
  /** 2nd to 5th in the vote, or none. */
  place: z.number().int().min(2).max(5).nullable(),
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

  const place = parsed.data.status === "disqualified" ? null : parsed.data.place
  const { error } = await supabase.from("competition_entries").update({ status: parsed.data.status, admin_notes: parsed.data.adminNotes, place }).eq("id", id)
  if (error?.code === "23505") return failure(`Another entry is already in ${place}${place === 2 ? "nd" : place === 3 ? "rd" : "th"} place. Clear that one first.`)
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

const ordinal = (place: number) => `${place}${place === 2 ? "nd" : place === 3 ? "rd" : "th"} place`

/**
 * Gives every eligible entrant their voucher once the winner is chosen and the places are
 * in, and emails each their code. Run it again after changes: entrants with one are skipped.
 */
export async function issueCompetitionVouchers(competitionId: string): Promise<ActionResult> {
  if (isDemoMode()) return DEMO_READ_ONLY
  if (!(await getAdmin())) return NOT_ALLOWED
  const supabase = await createClient()
  const startedAt = new Date().toISOString()
  const { data: count, error } = await supabase.rpc("issue_competition_vouchers", { p_competition: competitionId })
  if (error) return databaseError(error, "We couldn't issue the vouchers.")
  if (!count) return { ok: true, message: "Everyone eligible already has a voucher." }

  const { data: issued } = await supabase
    .from("vouchers")
    .select("code, percent_off, expires_at, competition_entry_id")
    .eq("competition_id", competitionId)
    .gte("created_at", startedAt)
  const entryIds = (issued ?? []).flatMap((voucher) => (voucher.competition_entry_id ? [voucher.competition_entry_id] : []))
  const { data: entries } = entryIds.length
    ? await supabase.from("competition_entries").select("id, name, email, place").in("id", entryIds)
    : { data: [] }
  after(async () => {
    for (const voucher of issued ?? []) {
      const entry = entries?.find((item) => item.id === voucher.competition_entry_id)
      if (!entry) continue
      await notifyCompetitionVoucher({
        customerName: entry.name,
        customerEmail: entry.email,
        code: voucher.code,
        percentOff: voucher.percent_off,
        placeLabel: entry.place ? ordinal(entry.place) : "",
        expiresAt: voucher.expires_at,
      })
    }
  })
  refresh()
  return { ok: true, message: `${count} voucher${count === 1 ? "" : "s"} issued and emailed.` }
}

/**
 * Deletes the competition's entry records and their pictures, as the rules promise once
 * prizes and vouchers are issued. Vouchers and the winner's announcement are kept.
 */
export async function deleteCompetitionEntries(competitionId: string): Promise<ActionResult> {
  if (isDemoMode()) return DEMO_READ_ONLY
  const admin = await getFullAdmin()
  if (!admin) return NOT_ALLOWED
  const supabase = await createClient()
  const { data, error } = await supabase.rpc("delete_competition_entries", { p_competition: competitionId })
  if (error) return databaseError(error, "We couldn't delete the entries.")
  const paths = (data ?? []).flatMap((row) => (row.image_path ? [row.image_path] : []))
  // Pictures are private files only the secret key can delete.
  if (paths.length && canCreateAccounts) await createAdminClient().storage.from("design-uploads").remove(paths)
  refresh()
  return { ok: true, message: `${data?.length ?? 0} entr${data?.length === 1 ? "y" : "ies"} deleted. Vouchers and the winner's announcement are kept.` }
}
