import "server-only"

import { notFound } from "next/navigation"

import { requireAdmin } from "@/lib/auth/session"
import { ADMIN_PAGE_SIZE, type Paged } from "@/lib/data/admin"
import { getProducts } from "@/lib/data/products"
import { isDemoMode } from "@/lib/demo/mode"
import type { QuoteRequestRow } from "@/lib/supabase/database.types"
import { createClient } from "@/lib/supabase/server"
import { quoteStatuses, type BuildQuoteDetails, type OwnHelmetDetails, type QuoteRequest, type QuoteStatus } from "@/types/design-assistant"
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
    aiImagePath: row.ai_image_path ?? null,
    palette: row.palette ?? [],
    concept: { look: concept.look ?? null, summary: concept.summary ?? "", basedOn: concept.basedOn ?? "" },
    suggestedProducts: row.suggested_products ?? [],
    status: row.status as QuoteStatus,
    adminNotes: row.admin_notes,
    createdAt: row.created_at,
    kind: row.kind === "own_helmet" || row.kind === "build" ? row.kind : "design",
    photoPaths: row.photo_paths ?? [],
    details: toOwnHelmetDetails(row.details),
    build: row.kind === "build" ? toBuildDetails(row.details) : null,
    quotedPrice: row.quoted_price === null ? null : Number(row.quoted_price),
    quotedDeposit: row.quoted_deposit === null ? null : Number(row.quoted_deposit),
    quotedAt: row.quoted_at,
  }
}

/** The design sent with a bespoke build request. */
export function toBuildDetails(value: unknown): BuildQuoteDetails {
  const details = (value && typeof value === "object" ? value : {}) as Record<string, unknown>
  const summary = Array.isArray(details.summary) ? details.summary : []
  return {
    slug: typeof details.slug === "string" ? details.slug : "",
    name: typeof details.name === "string" ? details.name : "",
    config: details.config && typeof details.config === "object" ? (details.config as Record<string, unknown>) : {},
    summary: summary.flatMap((line) =>
      line && typeof line === "object" && typeof (line as { label?: unknown }).label === "string"
        ? [{ key: String((line as { key?: unknown }).key ?? ""), label: (line as { label: string }).label, value: String((line as { value?: unknown }).value ?? "") }]
        : [],
    ),
  }
}

/** Storage paths of the customer's images and prints in a build. */
function buildImagePaths(config: Record<string, unknown>): string[] {
  const logos = Array.isArray(config.logos) ? config.logos.map((logo) => (logo && typeof logo === "object" ? (logo as { path?: unknown }).path : null)) : []
  const prints = config.regions && typeof config.regions === "object" ? Object.values(config.regions).map((region) => (region && typeof region === "object" ? (region as { print?: unknown }).print : null)) : []
  return [...new Set([...logos, ...prints].filter((path): path is string => typeof path === "string" && path.length > 0))]
}

/** The choices sent with an own-helmet request (empty for design-assistant requests). */
function toOwnHelmetDetails(value: unknown): OwnHelmetDetails {
  const details = (value && typeof value === "object" ? value : {}) as Record<string, unknown>
  const text = (key: string) => (typeof details[key] === "string" ? (details[key] as string) : "")
  const list = (key: string) => (Array.isArray(details[key]) ? (details[key] as unknown[]) : [])
  return {
    makeModel: text("makeModel"),
    size: text("size"),
    finishes: list("finishes").filter((item): item is string => typeof item === "string"),
    lacquer: text("lacquer"),
    films: list("films").flatMap((film) =>
      film && typeof film === "object" && typeof (film as { name?: unknown }).name === "string"
        ? [{ name: (film as { name: string }).name, code: String((film as { code?: unknown }).code ?? "") }]
        : [],
    ),
    racingName: text("racingName"),
    racingNumber: text("racingNumber"),
    extraText: text("extraText"),
    logos: list("logos").filter((item): item is string => typeof item === "string"),
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
  /** Own-helmet requests: short-lived links to every photo of the customer's helmet. */
  photoUrls: string[]
  /** Own-helmet requests: short-lived links to the customer's logos. */
  logoUrls: string[]
  /** Short-lived link to the AI concept image, if there is one. */
  aiImageUrl: string | null
  /** Bespoke builds: short-lived links to the customer's images, by storage path, for the 3D view. */
  buildImageUrls: Record<string, string>
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

  const buildPaths = quote.build ? buildImagePaths(quote.build.config) : []
  const [photo, aiImage, products, photos, logos, buildImages] = await Promise.all([
    quote.imagePath
      ? supabase.storage.from("design-uploads").createSignedUrl(quote.imagePath, PHOTO_LINK_SECONDS)
      : Promise.resolve(null),
    quote.aiImagePath
      ? supabase.storage.from("design-uploads").createSignedUrl(quote.aiImagePath, PHOTO_LINK_SECONDS)
      : Promise.resolve(null),
    getProducts(),
    quote.photoPaths.length
      ? supabase.storage.from("design-uploads").createSignedUrls(quote.photoPaths, PHOTO_LINK_SECONDS)
      : Promise.resolve(null),
    quote.details.logos.length
      ? supabase.storage.from("design-logos").createSignedUrls(quote.details.logos, PHOTO_LINK_SECONDS)
      : Promise.resolve(null),
    buildPaths.length ? supabase.storage.from("design-logos").createSignedUrls(buildPaths, PHOTO_LINK_SECONDS) : Promise.resolve(null),
  ])
  const links = (result: typeof photos) => (result?.data ?? []).flatMap((link) => (link.signedUrl ? [link.signedUrl] : []))

  return {
    quote,
    photoUrls: links(photos),
    logoUrls: links(logos),
    photoUrl: photo?.data?.signedUrl ?? null,
    aiImageUrl: aiImage?.data?.signedUrl ?? null,
    buildImageUrls: Object.fromEntries((buildImages?.data ?? []).flatMap((link) => (link.path && link.signedUrl ? [[link.path, link.signedUrl]] : []))),
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
