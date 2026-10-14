import "server-only"

import { notFound } from "next/navigation"

import { requireAdmin } from "@/lib/auth/session"
import { ADMIN_PAGE_SIZE, type Paged } from "@/lib/data/admin"
import { getProducts } from "@/lib/data/products"
import { isDemoMode } from "@/lib/demo/mode"
import type { QuoteRequestRow } from "@/lib/supabase/database.types"
import { createClient } from "@/lib/supabase/server"
import { quoteStatuses, type QuoteRequest, type QuoteStatus } from "@/types/design-assistant"
import type { HelmetLook } from "@/types/helmet"
import type { CatalogProduct } from "@/types/product"

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const PHOTO_LINK_SECONDS = 60 * 60

function toQuoteRequest(row: QuoteRequestRow): QuoteRequest {
  const concept = (row.concept ?? {}) as { look?: HelmetLook; summary?: string; basedOn?: string }
  return {
    id: row.id,
    reference: row.reference,
    userId: row.user_id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    helmet: row.helmet,
    notes: row.notes,
    imagePath: row.image_path,
    palette: row.palette ?? [],
    concept: { look: concept.look ?? null, summary: concept.summary ?? "", basedOn: concept.basedOn ?? "" },
    suggestedProducts: row.suggested_products ?? [],
    status: row.status as QuoteStatus,
    adminNotes: row.admin_notes,
    createdAt: row.created_at,
  }
}

export async function listQuoteRequests(options: {
  status?: string
  query?: string
  page?: number
}): Promise<Paged<QuoteRequest> & { counts: Record<QuoteStatus, number> }> {
  await requireAdmin()
  const counts = Object.fromEntries(quoteStatuses.map((status) => [status, 0])) as Record<QuoteStatus, number>
  if (isDemoMode()) return { rows: [], total: 0, page: 1, pageCount: 1, counts }

  const supabase = await createClient()
  const page = Math.max(1, Math.floor(options.page ?? 1) || 1)
  const from = (page - 1) * ADMIN_PAGE_SIZE

  let request = supabase
    .from("quote_requests")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, from + ADMIN_PAGE_SIZE - 1)
  if (options.status && (quoteStatuses as readonly string[]).includes(options.status)) {
    request = request.eq("status", options.status)
  }
  const term = (options.query ?? "").replace(/[%,()*]/g, " ").trim()
  if (term) request = request.or(`reference.ilike.%${term}%,name.ilike.%${term}%,email.ilike.%${term}%`)

  const [{ data, count, error }, statuses] = await Promise.all([
    request,
    supabase.from("quote_requests").select("status"),
  ])
  if (error) throw new Error(error.message)
  for (const row of statuses.data ?? []) counts[row.status as QuoteStatus] += 1

  const total = count ?? 0
  return {
    rows: (data ?? []).map(toQuoteRequest),
    total,
    page,
    pageCount: Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE)),
    counts,
  }
}

export interface QuoteRequestDetail {
  quote: QuoteRequest
  /** Short-lived link to the customer's photo, if they added one. */
  photoUrl: string | null
  suggestions: CatalogProduct[]
}

export async function getQuoteRequest(id: string): Promise<QuoteRequestDetail> {
  await requireAdmin()
  if (isDemoMode() || !UUID.test(id)) notFound()

  const supabase = await createClient()
  const { data, error } = await supabase.from("quote_requests").select("*").eq("id", id).maybeSingle()
  if (error) throw new Error(error.message)
  if (!data) notFound()
  const quote = toQuoteRequest(data)

  const [photo, products] = await Promise.all([
    quote.imagePath
      ? supabase.storage.from("design-uploads").createSignedUrl(quote.imagePath, PHOTO_LINK_SECONDS)
      : Promise.resolve(null),
    getProducts(),
  ])

  return {
    quote,
    photoUrl: photo?.data?.signedUrl ?? null,
    suggestions: quote.suggestedProducts
      .map((slug) => products.find((product) => product.slug === slug))
      .filter((product): product is CatalogProduct => Boolean(product)),
  }
}

/** Quote requests nobody has picked up yet, for the dashboard. */
export async function countNewQuoteRequests(): Promise<number> {
  await requireAdmin()
  if (isDemoMode()) return 0
  const supabase = await createClient()
  const { count } = await supabase.from("quote_requests").select("id", { count: "exact", head: true }).eq("status", "new")
  return count ?? 0
}
