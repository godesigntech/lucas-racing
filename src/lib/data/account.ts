import "server-only"

import { notFound } from "next/navigation"

import { requireUser } from "@/lib/auth/session"
import { isDemoMode } from "@/lib/demo/mode"
import { demoOrders, demoProfiles } from "@/lib/demo/people"
import { createClient } from "@/lib/supabase/server"
import { toOrder, toOrderListItem, toProfile } from "@/lib/supabase/mappers"
import type { Profile } from "@/types/account"
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
