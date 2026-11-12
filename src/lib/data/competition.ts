import "server-only"

import { cacheLife, cacheTag } from "next/cache"
import { notFound } from "next/navigation"

import { requireAdmin, requireUser } from "@/lib/auth/session"
import { ADMIN_PAGE_SIZE, type Paged } from "@/lib/data/admin"
import { isDemoMode } from "@/lib/demo/mode"
import type { CompetitionEntryRow, CompetitionRow, VoucherRow } from "@/lib/supabase/database.types"
import { createClient, createPublicClient } from "@/lib/supabase/server"
import { countStatuses } from "./status-counts"
import {
  competitionStatuses,
  entryStatuses,
  type Competition,
  type CompetitionEntry,
  type CompetitionStatus,
  type CompetitionWinner,
  type EntryStatus,
  type Voucher,
} from "@/types/competition"

import { cacheTags } from "./cache-tags"

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const IMAGE_LINK_SECONDS = 60 * 60

function toCompetition(row: CompetitionRow): Competition {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    prize: row.prize,
    description: row.description,
    rules: row.rules ?? [],
    opensAt: row.opens_at,
    closesAt: row.closes_at,
    judgingDate: row.judging_date,
    votingOpensAt: row.voting_opens_at,
    votingClosesAt: row.voting_closes_at,
    status: (competitionStatuses as readonly string[]).includes(row.status) ? (row.status as CompetitionStatus) : "upcoming",
    winnerEntryId: row.winner_entry_id,
  }
}

function toEntry(row: CompetitionEntryRow): CompetitionEntry {
  const summary = Array.isArray(row.summary) ? row.summary : []
  return {
    id: row.id,
    reference: row.reference,
    competitionId: row.competition_id,
    userId: row.user_id,
    name: row.name,
    email: row.email,
    designName: row.design_name,
    productSlug: row.product_slug,
    config: row.config && typeof row.config === "object" && !Array.isArray(row.config) ? (row.config as Record<string, unknown>) : {},
    summary: summary.flatMap((line) => {
      if (!line || typeof line !== "object" || Array.isArray(line)) return []
      const item = line as Record<string, unknown>
      return typeof item.label === "string" ? [{ key: String(item.key ?? ""), label: item.label, value: String(item.value ?? "") }] : []
    }),
    status: (entryStatuses as readonly string[]).includes(row.status) ? (row.status as EntryStatus) : "entered",
    marketingOptIn: row.marketing_opt_in,
    agreedRulesAt: row.agreed_rules_at,
    adminNotes: row.admin_notes,
    postUrl: row.post_url ?? "",
    ukResident: row.uk_resident ?? false,
    imagePath: row.image_path ?? null,
    place: row.place ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

/** The current competition (the most recently created), for the public page and the builder. */
export async function getCompetition(): Promise<Competition | null> {
  "use cache"
  cacheTag(cacheTags.competition)
  cacheLife("hours")
  if (isDemoMode()) return null
  const { data, error } = await createPublicClient().from("competitions").select("*").order("created_at", { ascending: false }).limit(1).maybeSingle()
  if (error) throw new Error(`Could not load the competition: ${error.message}`)
  return data ? toCompetition(data) : null
}

/** The announced winner: first name and design name only. */
export async function getCompetitionWinner(competitionId: string): Promise<CompetitionWinner | null> {
  "use cache"
  cacheTag(cacheTags.competition)
  cacheLife("hours")
  if (isDemoMode()) return null
  const { data } = await createPublicClient().rpc("competition_winner", { p_competition: competitionId })
  const row = data?.[0]
  return row ? { firstName: row.first_name, designName: row.design_name, productSlug: row.product_slug } : null
}

/** The signed-in customer's own entries, newest first. */
export async function getMyCompetitionEntries(): Promise<(CompetitionEntry & { competition: Competition | null })[]> {
  const user = await requireUser("/account/competition")
  if (isDemoMode()) return []
  const supabase = await createClient()
  const [{ data, error }, { data: competitions }] = await Promise.all([
    supabase.from("competition_entries").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
    supabase.from("competitions").select("*"),
  ])
  if (error) throw new Error(`Could not load your entries: ${error.message}`)
  return (data ?? []).map((row) => {
    const competition = competitions?.find((item) => item.id === row.competition_id)
    return { ...toEntry(row), competition: competition ? toCompetition(competition) : null }
  })
}

// ---------------------------------------------------------------------------
// Admin

export async function getAdminCompetition(): Promise<Competition | null> {
  await requireAdmin()
  if (isDemoMode()) return null
  const supabase = await createClient()
  const { data, error } = await supabase.from("competitions").select("*").order("created_at", { ascending: false }).limit(1).maybeSingle()
  if (error) throw new Error(error.message)
  return data ? toCompetition(data) : null
}

export async function listCompetitionEntries(
  competitionId: string,
  options: { status?: string; query?: string; page?: number },
): Promise<Paged<CompetitionEntry> & { counts: Record<EntryStatus, number> }> {
  await requireAdmin()
  const counts = Object.fromEntries(entryStatuses.map((status) => [status, 0])) as Record<EntryStatus, number>
  if (isDemoMode()) return { rows: [], total: 0, page: 1, pageCount: 1, counts }

  const supabase = await createClient()
  const page = Math.max(1, Math.floor(options.page ?? 1) || 1)
  const from = (page - 1) * ADMIN_PAGE_SIZE
  let request = supabase
    .from("competition_entries")
    .select("*", { count: "exact" })
    .eq("competition_id", competitionId)
    .order("created_at", { ascending: false })
    .range(from, from + ADMIN_PAGE_SIZE - 1)
  if (options.status && (entryStatuses as readonly string[]).includes(options.status)) request = request.eq("status", options.status)
  const term = (options.query ?? "").replace(/[%,()*]/g, " ").trim()
  if (term) request = request.or(`reference.ilike.%${term}%,name.ilike.%${term}%,email.ilike.%${term}%,design_name.ilike.%${term}%`)

  const [{ data, count, error }, statusCounts] = await Promise.all([
    request,
    countStatuses(entryStatuses, (status) =>
      supabase.from("competition_entries").select("id", { count: "exact", head: true }).eq("competition_id", competitionId).eq("status", status),
    ),
  ])
  if (error) throw new Error(error.message)
  Object.assign(counts, statusCounts)

  const total = count ?? 0
  return { rows: (data ?? []).map(toEntry), total, page, pageCount: Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE)), counts }
}

/** The signed-in customer's vouchers, newest first. */
export async function getMyVouchers(): Promise<Voucher[]> {
  const user = await requireUser("/account/competition")
  if (isDemoMode()) return []
  const supabase = await createClient()
  const { data, error } = await supabase.from("vouchers").select("*").eq("user_id", user.id).order("created_at", { ascending: false })
  if (error) throw new Error(`Could not load your vouchers: ${error.message}`)
  const now = Date.now()
  return (data ?? []).map((row) => ({ ...toVoucher(row), expired: Date.parse(row.expires_at) <= now }))
}

function toVoucher(row: VoucherRow): Omit<Voucher, "expired"> {
  return { id: row.id, code: row.code, percentOff: row.percent_off, description: row.description, expiresAt: row.expires_at, redeemedAt: row.redeemed_at }
}

/** How many vouchers this competition has issued, and how many have been used. */
export async function getCompetitionVoucherCounts(competitionId: string): Promise<{ issued: number; used: number }> {
  await requireAdmin()
  if (isDemoMode()) return { issued: 0, used: 0 }
  const supabase = await createClient()
  const [issued, used] = await Promise.all([
    supabase.from("vouchers").select("id", { count: "exact", head: true }).eq("competition_id", competitionId),
    supabase.from("vouchers").select("id", { count: "exact", head: true }).eq("competition_id", competitionId).not("redeemed_at", "is", null),
  ])
  return { issued: issued.count ?? 0, used: used.count ?? 0 }
}

/**
 * Every eligible entry's picture, numbered and without names, for the Facebook vote.
 * Numbered in the order they were entered, so the numbers stay put if it's downloaded again.
 */
export async function getCompetitionPictures(competitionId: string): Promise<{ number: number; entryId: string; designName: string; url: string | null }[]> {
  await requireAdmin()
  if (isDemoMode()) return []
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("competition_entries")
    .select("id, design_name, image_path, status")
    .eq("competition_id", competitionId)
    .neq("status", "disqualified")
    .order("created_at", { ascending: true })
  if (error) throw new Error(error.message)
  const paths = (data ?? []).flatMap((row) => (row.image_path ? [row.image_path] : []))
  const signed = paths.length ? await supabase.storage.from("design-uploads").createSignedUrls(paths, IMAGE_LINK_SECONDS) : null
  const urls = new Map((signed?.data ?? []).flatMap((link) => (link.path && link.signedUrl ? [[link.path, link.signedUrl] as const] : [])))
  return (data ?? []).map((row, index) => ({ number: index + 1, entryId: row.id, designName: row.design_name, url: row.image_path ? (urls.get(row.image_path) ?? null) : null }))
}

/** One entry with short-lived links to its images, for the 3D view. */
export async function getCompetitionEntry(id: string): Promise<{ entry: CompetitionEntry; imageUrls: Record<string, string>; pictureUrl: string | null }> {
  await requireAdmin()
  if (isDemoMode() || !UUID.test(id)) notFound()
  const supabase = await createClient()
  const { data, error } = await supabase.from("competition_entries").select("*").eq("id", id).maybeSingle()
  if (error) throw new Error(error.message)
  if (!data) notFound()
  const entry = toEntry(data)

  const paths = imagePaths(entry.config)
  const signed = paths.length ? await supabase.storage.from("design-logos").createSignedUrls(paths, IMAGE_LINK_SECONDS) : null
  const imageUrls = Object.fromEntries((signed?.data ?? []).flatMap((link) => (link.path && link.signedUrl ? [[link.path, link.signedUrl]] : [])))
  const picture = entry.imagePath ? await supabase.storage.from("design-uploads").createSignedUrl(entry.imagePath, IMAGE_LINK_SECONDS) : null
  return { entry, imageUrls, pictureUrl: picture?.data?.signedUrl ?? null }
}

/** Storage paths of the entrant's images and prints in a build. */
function imagePaths(config: Record<string, unknown>): string[] {
  const logos = Array.isArray(config.logos) ? config.logos.map((logo) => (logo && typeof logo === "object" ? (logo as { path?: unknown }).path : null)) : []
  const prints =
    config.regions && typeof config.regions === "object"
      ? Object.values(config.regions).map((region) => (region && typeof region === "object" ? (region as { print?: unknown }).print : null))
      : []
  return [...new Set([...logos, ...prints].filter((path): path is string => typeof path === "string" && path.length > 0))]
}
