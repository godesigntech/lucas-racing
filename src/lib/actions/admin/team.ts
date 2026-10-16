"use server"

import { revalidatePath, updateTag } from "next/cache"

import { databaseError, failure, validationError } from "@/lib/actions/result"
import { cacheTags } from "@/lib/data/cache-tags"
import { DEMO_READ_ONLY, isDemoMode } from "@/lib/demo/mode"
import { createClient } from "@/lib/supabase/server"
import { teamMemberSchema, type TeamMemberValues } from "@/lib/validations/team"
import type { ActionResult } from "@/types/account"

import { getFullAdmin, NOT_ALLOWED } from "./guard"

/** Meet the Team, About and the homepage read the team from a tagged cache. */
function refreshTeam() {
  updateTag(cacheTags.team)
  revalidatePath("/admin/team")
}

function toRow(values: TeamMemberValues) {
  return {
    name: values.name,
    role: values.role,
    tagline: values.tagline,
    bio: values.bio,
    photo_url: values.photoUrl,
    photo_alt: values.photoAlt || values.name,
    featured: values.featured,
    is_active: values.isActive,
    sort_order: values.sortOrder,
  }
}

/** Adds a team member when `id` is null, otherwise updates them. */
export async function saveTeamMember(id: string | null, values: TeamMemberValues): Promise<ActionResult> {
  if (isDemoMode()) return DEMO_READ_ONLY
  if (!(await getFullAdmin())) return NOT_ALLOWED

  const parsed = teamMemberSchema.safeParse(values)
  if (!parsed.success) return validationError(parsed.error)

  const supabase = await createClient()
  const { error } = id
    ? await supabase.from("team_members").update(toRow(parsed.data)).eq("id", id)
    : await supabase.from("team_members").insert(toRow(parsed.data))
  if (error) return databaseError(error, "We couldn't save the team member.")

  refreshTeam()
  return { ok: true, message: id ? `${parsed.data.name} updated.` : `${parsed.data.name} added to the team.` }
}

export async function setTeamMemberActive(id: string, isActive: boolean): Promise<ActionResult> {
  if (isDemoMode()) return DEMO_READ_ONLY
  if (!(await getFullAdmin())) return NOT_ALLOWED

  const supabase = await createClient()
  const { error } = await supabase.from("team_members").update({ is_active: isActive }).eq("id", id)
  if (error) return databaseError(error, "We couldn't update the team member.")

  refreshTeam()
  return { ok: true, message: isActive ? "Shown on the website." : "Hidden from the website." }
}

export async function deleteTeamMember(id: string): Promise<ActionResult> {
  if (isDemoMode()) return DEMO_READ_ONLY
  if (!(await getFullAdmin())) return NOT_ALLOWED

  const supabase = await createClient()
  const { data, error } = await supabase.from("team_members").delete().eq("id", id).select("name").maybeSingle()
  if (error) return databaseError(error, "We couldn't remove the team member.")
  if (!data) return failure("That team member no longer exists.")

  refreshTeam()
  return { ok: true, message: `${data.name} removed from the team.` }
}
