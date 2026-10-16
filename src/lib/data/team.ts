import "server-only"

import { cacheLife, cacheTag } from "next/cache"

import { requireFullAdmin } from "@/lib/auth/session"
import { isDemoMode } from "@/lib/demo/mode"
import type { TeamMemberRow } from "@/lib/supabase/database.types"
import { createClient, createPublicClient } from "@/lib/supabase/server"
import { family } from "@/data/about"
import type { TeamMember } from "@/types/team"

import { cacheTags } from "./cache-tags"

export function toTeamMember(row: TeamMemberRow): TeamMember {
  return {
    id: row.id,
    name: row.name,
    role: row.role,
    tagline: row.tagline,
    bio: row.bio
      .split(/\n\s*\n/)
      .map((paragraph) => paragraph.trim())
      .filter(Boolean),
    photoUrl: row.photo_url,
    photoAlt: row.photo_alt,
    featured: row.featured,
    isActive: row.is_active,
    sortOrder: row.sort_order,
  }
}

/** Demo mode: the Lucas family from the About copy. */
const demoPhotos: Record<string, string> = {
  "Howard Lucas": "/images/team/howard.webp",
  "Connor Lucas": "/images/team/connor.webp",
  "Wendy Lucas": "/images/team/wendy.webp",
}
const demoTeam: TeamMember[] = family.map((member, index) => ({
  id: `demo-${index}`,
  name: member.name,
  role: member.role,
  tagline: member.tagline,
  bio: member.bio,
  photoUrl: demoPhotos[member.name] ?? null,
  photoAlt: member.name,
  featured: true,
  isActive: true,
  sortOrder: (index + 1) * 10,
}))

/** Active team members in display order, for the public site. */
export async function getTeamMembers(): Promise<TeamMember[]> {
  "use cache"
  cacheTag(cacheTags.team)
  cacheLife("hours")

  if (isDemoMode()) return demoTeam

  const { data, error } = await createPublicClient()
    .from("team_members")
    .select("*")
    .eq("is_active", true)
    .order("sort_order")
    .order("name")
  if (error) throw new Error(`Could not load the team: ${error.message}`)
  return data.map(toTeamMember)
}

/** Everyone, including hidden members, for Admin > Team. */
export async function listAdminTeamMembers(): Promise<TeamMember[]> {
  await requireFullAdmin()
  if (isDemoMode()) return demoTeam

  const supabase = await createClient()
  const { data, error } = await supabase.from("team_members").select("*").order("sort_order").order("name")
  if (error) throw new Error(error.message)
  return data.map(toTeamMember)
}
