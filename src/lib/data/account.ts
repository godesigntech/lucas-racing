import "server-only"

import { notFound } from "next/navigation"

import { requireUser } from "@/lib/auth/session"
import { isDemoMode } from "@/lib/demo/mode"
import { demoOrders, demoProfiles } from "@/lib/demo/people"
import { createClient } from "@/lib/supabase/server"
import { toOrder, toOrderListItem, toProfile } from "@/lib/supabase/mappers"
import type { Profile } from "@/types/account"
import type { HelmetConfiguration } from "@/types/configurator"
import type { QuoteStatus } from "@/types/design-assistant"
import type { Order, OrderListItem } from "@/types/order"

export async function getMyProfile(): Promise<Profile> {
  const user = await requireUser()
  if (isDemoMode()) return demoProfiles.find((profile) => profile.id === user.id)!

  const supabase = await createClient()
  const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).single()
  if (error) throw new Error(`Could not load your profile: ${error.message}`)
  return toProfile(data)
}

export async function getMyOrders(limit?: number): Promise<OrderListItem[]> {
  const user = await requireUser("/account/orders")
  if (isDemoMode()) return demoOrders.filter((order) => order.userId === user.id).slice(0, limit)

  const supabase = await createClient()
  let query = supabase
    .from("orders")
    .select("*, order_items(count)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
  if (limit) query = query.limit(limit)

  const { data, error } = await query
  if (error) throw new Error(`Could not load your orders: ${error.message}`)
  return (data ?? []).map(toOrderListItem)
}

export async function getMyOrder(orderNumber: string): Promise<Order> {
  const user = await requireUser(`/account/orders/${orderNumber}`)
  if (isDemoMode()) {
    const order = demoOrders.find((entry) => entry.orderNumber === orderNumber && entry.userId === user.id)
    if (!order) notFound()
    return order
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(*), order_status_events(*)")
    .eq("order_number", orderNumber)
    .eq("user_id", user.id)
    .maybeSingle()

  if (error) throw new Error(`Could not load the order: ${error.message}`)
  if (!data) notFound()
  return toOrder(data)
}

export interface SavedDesign {
  id: string
  productSlug: string
  name: string
  config: HelmetConfiguration
  updatedAt: string
}

/** The customer's saved builds, most recently changed first. */
export async function getMyDesigns(): Promise<SavedDesign[]> {
  const user = await requireUser("/account/designs")
  if (isDemoMode()) return []

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("saved_designs")
    .select("id, product_slug, name, config, updated_at")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
  if (error) throw new Error(`Could not load your designs: ${error.message}`)
  return (data ?? []).map((row) => ({
    id: row.id,
    productSlug: row.product_slug,
    name: row.name,
    config: row.config as unknown as HelmetConfiguration,
    updatedAt: row.updated_at,
  }))
}

export interface MyQuoteRequest {
  id: string
  reference: string
  helmet: string
  status: QuoteStatus
  summary: string
  createdAt: string
}

/** Quote requests the customer sent from the design assistant while signed in. */
export async function getMyQuotes(): Promise<MyQuoteRequest[]> {
  const user = await requireUser("/account/quotes")
  if (isDemoMode()) return []

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("quote_requests")
    .select("id, reference, helmet, status, concept, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
  if (error) throw new Error(`Could not load your quote requests: ${error.message}`)
  return (data ?? []).map((row) => ({
    id: row.id,
    reference: row.reference,
    helmet: row.helmet,
    status: row.status as QuoteStatus,
    summary: ((row.concept as { summary?: string } | null)?.summary ?? "").trim(),
    createdAt: row.created_at,
  }))
}
