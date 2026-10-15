import "server-only"

import { notFound } from "next/navigation"

import { requireAdmin } from "@/lib/auth/session"
import { demoAdmin } from "@/lib/demo/admin"
import { isDemoMode } from "@/lib/demo/mode"
import { createClient } from "@/lib/supabase/server"
import {
  toCustomerSummary,
  toFilm,
  toHelmetModel,
  toOption,
  toOrder,
  toOrderListItem,
  toProduct,
  toProfile,
  toSiteSettings,
} from "@/lib/supabase/mappers"
import type { AdminUser, CustomerSummary, Profile } from "@/types/account"
import type { ConfiguratorOption, Film } from "@/types/catalog"
import type { HelmetModel } from "@/types/helmet"
import { orderStatuses, type Order, type OrderListItem, type OrderStatus } from "@/types/order"
import type { Product } from "@/types/product"
import type { SiteSettings } from "@/types/settings"

export const ADMIN_PAGE_SIZE = 20

export interface Paged<T> {
  rows: T[]
  total: number
  page: number
  pageCount: number
}

/** Strips characters that would break a PostgREST `or()` filter. */
function searchTerm(query: string | undefined): string {
  return (query ?? "").replace(/[%,()*]/g, " ").trim()
}

function pageRange(page: number) {
  const current = Math.max(1, Math.floor(page) || 1)
  const from = (current - 1) * ADMIN_PAGE_SIZE
  return { current, from, to: from + ADMIN_PAGE_SIZE - 1 }
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

export interface DashboardStats {
  revenuePaid: number
  revenueLast30Days: number
  ordersLast30Days: number
  openOrders: number
  awaitingPayment: number
  customerCount: number
  statusCounts: Record<OrderStatus, number>
  recentOrders: OrderListItem[]
}

export async function getDashboardStats(): Promise<DashboardStats> {
  await requireAdmin()
  if (isDemoMode()) return demoAdmin.dashboardStats()
  const supabase = await createClient()

  const [orders, customers, recent] = await Promise.all([
    supabase.from("orders").select("status, payment_status, total, created_at"),
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("orders").select("*, order_items(count)").order("created_at", { ascending: false }).limit(6),
  ])
  if (orders.error) throw new Error(orders.error.message)

  const since = Date.now() - 30 * 24 * 60 * 60 * 1000
  const statusCounts = Object.fromEntries(orderStatuses.map((status) => [status, 0])) as Record<OrderStatus, number>
  let revenuePaid = 0
  let revenueLast30Days = 0
  let ordersLast30Days = 0
  let awaitingPayment = 0

  for (const order of orders.data ?? []) {
    const total = Number(order.total)
    const live = order.status !== "cancelled"
    statusCounts[order.status as OrderStatus] += 1
    if (order.payment_status === "paid") revenuePaid += total
    if (live && order.payment_status === "unpaid") awaitingPayment += 1
    if (new Date(order.created_at).getTime() >= since) {
      ordersLast30Days += 1
      if (live) revenueLast30Days += total
    }
  }

  return {
    revenuePaid,
    revenueLast30Days,
    ordersLast30Days,
    openOrders: (orders.data ?? []).filter((order) => !["completed", "cancelled"].includes(order.status)).length,
    awaitingPayment,
    customerCount: customers.count ?? 0,
    statusCounts,
    recentOrders: (recent.data ?? []).map(toOrderListItem),
  }
}

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------

export async function listOrders(options: { query?: string; status?: string; page?: number }): Promise<Paged<OrderListItem>> {
  await requireAdmin()
  if (isDemoMode()) return demoAdmin.listOrders(options)
  const supabase = await createClient()
  const { current, from, to } = pageRange(options.page ?? 1)

  let request = supabase
    .from("orders")
    .select("*, order_items(count)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to)

  if (options.status && (orderStatuses as readonly string[]).includes(options.status)) {
    request = request.eq("status", options.status)
  }
  const term = searchTerm(options.query)
  if (term) {
    request = request.or(`order_number.ilike.%${term}%,customer_name.ilike.%${term}%,customer_email.ilike.%${term}%`)
  }

  const { data, count, error } = await request
  if (error) throw new Error(error.message)
  const total = count ?? 0
  return { rows: (data ?? []).map(toOrderListItem), total, page: current, pageCount: Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE)) }
}

export async function getAdminOrder(id: string): Promise<Order> {
  await requireAdmin()
  if (isDemoMode()) return demoAdmin.order(id)
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(*), order_status_events(*)")
    .eq("id", id)
    .maybeSingle()
  if (error) throw new Error(error.message)
  if (!data) notFound()
  return toOrder(data)
}

// ---------------------------------------------------------------------------
// Customers
// ---------------------------------------------------------------------------

export async function listCustomers(options: { query?: string; page?: number }): Promise<Paged<CustomerSummary>> {
  await requireAdmin()
  if (isDemoMode()) return demoAdmin.listCustomers(options)
  const supabase = await createClient()
  const { current, from, to } = pageRange(options.page ?? 1)

  let request = supabase
    .from("customer_summaries")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to)

  const term = searchTerm(options.query)
  if (term) request = request.or(`full_name.ilike.%${term}%,email.ilike.%${term}%,postcode.ilike.%${term}%`)

  const { data, count, error } = await request
  if (error) throw new Error(error.message)
  const total = count ?? 0
  return { rows: (data ?? []).map(toCustomerSummary), total, page: current, pageCount: Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE)) }
}

export async function getCustomer(id: string): Promise<{ profile: Profile; summary: CustomerSummary; orders: OrderListItem[] }> {
  await requireAdmin()
  if (isDemoMode()) return demoAdmin.customer(id)
  const supabase = await createClient()
  const [profile, summary, orders] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", id).maybeSingle(),
    supabase.from("customer_summaries").select("*").eq("id", id).maybeSingle(),
    supabase.from("orders").select("*, order_items(count)").eq("user_id", id).order("created_at", { ascending: false }),
  ])
  if (profile.error) throw new Error(profile.error.message)
  if (!profile.data || !summary.data) notFound()
  return {
    profile: toProfile(profile.data),
    summary: toCustomerSummary(summary.data),
    orders: (orders.data ?? []).map(toOrderListItem),
  }
}

// ---------------------------------------------------------------------------
// Catalogue (includes inactive rows)
// ---------------------------------------------------------------------------

export async function listAdminProducts(): Promise<Product[]> {
  await requireAdmin()
  if (isDemoMode()) return demoAdmin.products()
  const supabase = await createClient()
  const { data, error } = await supabase.from("products").select("*").order("sort_order")
  if (error) throw new Error(error.message)
  return (data ?? []).map(toProduct)
}

export async function getAdminProduct(slug: string): Promise<Product> {
  await requireAdmin()
  if (isDemoMode()) return demoAdmin.product(slug)
  const supabase = await createClient()
  const { data, error } = await supabase.from("products").select("*").eq("slug", slug).maybeSingle()
  if (error) throw new Error(error.message)
  if (!data) notFound()
  return toProduct(data)
}

export interface FilmCategorySummary {
  name: string
  count: number
  activeCount: number
  minPrice: number
  maxPrice: number
}

/** Every film category with its size and price range, for filters and category pricing. */
function summariseFilmCategories(films: Pick<Film, "category" | "price" | "isActive">[]): FilmCategorySummary[] {
  const byName = new Map<string, FilmCategorySummary>()
  for (const film of films) {
    const entry = byName.get(film.category) ?? { name: film.category, count: 0, activeCount: 0, minPrice: Infinity, maxPrice: 0 }
    entry.count += 1
    if (film.isActive) entry.activeCount += 1
    entry.minPrice = Math.min(entry.minPrice, film.price)
    entry.maxPrice = Math.max(entry.maxPrice, film.price)
    byName.set(film.category, entry)
  }
  return [...byName.values()]
}

/** The film library, filtered by category and code/name search, a page at a time. */
export async function listAdminFilms(options: {
  category?: string
  query?: string
  page?: number
}): Promise<Paged<Film> & { categories: FilmCategorySummary[] }> {
  await requireAdmin()
  const { current, from, to } = pageRange(options.page ?? 1)

  if (isDemoMode()) {
    const all = demoAdmin.films()
    const rows = all.filter((film) => !options.category || film.category === options.category)
    return { rows: rows.slice(from, to + 1), total: rows.length, page: current, pageCount: Math.max(1, Math.ceil(rows.length / ADMIN_PAGE_SIZE)), categories: summariseFilmCategories(all) }
  }

  const supabase = await createClient()
  let request = supabase
    .from("films")
    .select("*", { count: "exact" })
    .order("sort_order")
    .order("name")
    .range(from, to)
  if (options.category) request = request.eq("category", options.category)
  const term = searchTerm(options.query)
  if (term) request = request.or(`code.ilike.%${term}%,name.ilike.%${term}%`)

  const [{ data, count, error }, all] = await Promise.all([
    request,
    supabase.from("films").select("category, price, is_active").order("sort_order"),
  ])
  if (error) throw new Error(error.message)

  const total = count ?? 0
  return {
    rows: (data ?? []).map(toFilm),
    total,
    page: current,
    pageCount: Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE)),
    categories: summariseFilmCategories(
      (all.data ?? []).map((row) => ({ category: row.category, price: Number(row.price), isActive: row.is_active })),
    ),
  }
}

export async function listAdminHelmetModels(): Promise<HelmetModel[]> {
  await requireAdmin()
  if (isDemoMode()) return demoAdmin.models()
  const supabase = await createClient()
  const { data, error } = await supabase.from("helmet_models").select("*").order("sort_order")
  if (error) throw new Error(error.message)
  return (data ?? []).map(toHelmetModel)
}

export async function listAdminOptions(): Promise<ConfiguratorOption[]> {
  await requireAdmin()
  if (isDemoMode()) return demoAdmin.options()
  const supabase = await createClient()
  const { data, error } = await supabase.from("configurator_options").select("*").order("sort_order")
  if (error) throw new Error(error.message)
  return (data ?? []).map(toOption)
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

export async function getAdminSettings(): Promise<{ settings: SiteSettings; admins: AdminUser[]; currentEmail: string }> {
  const user = await requireAdmin()
  if (isDemoMode()) return demoAdmin.settings()
  const supabase = await createClient()
  const [settings, admins] = await Promise.all([
    supabase.from("site_settings").select("*").eq("id", 1).single(),
    supabase.from("admin_users").select("*").order("created_at"),
  ])
  if (settings.error) throw new Error(settings.error.message)
  return {
    settings: toSiteSettings(settings.data),
    admins: (admins.data ?? []).map((row) => ({ email: row.email, createdAt: row.created_at })),
    currentEmail: user.email.toLowerCase(),
  }
}
