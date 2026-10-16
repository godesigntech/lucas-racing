"use server"

import { after } from "next/server"

import { getCurrentUser } from "@/lib/auth/session"
import { isDemoMode } from "@/lib/demo/mode"
import { notifyOrderPlaced } from "@/lib/email/notifications"
import { createClient } from "@/lib/supabase/server"
import { placeOrderSchema, type PlaceOrderInput } from "@/lib/validations/checkout"
import type { ActionResult } from "@/types/account"

import { databaseError, failure, validationError } from "./result"

/** Places an order. Prices are recalculated in the database by public.place_order(). */
export async function placeOrder(input: PlaceOrderInput): Promise<ActionResult<{ orderNumber: string }>> {
  if (isDemoMode()) return { ok: false, message: "Demo mode: orders aren't saved. Connect Supabase to take real orders." }
  const user = await getCurrentUser()
  if (!user) return failure("Please log in to place your order.")

  const parsed = placeOrderSchema.safeParse(input)
  if (!parsed.success) return validationError(parsed.error)
  const { items, checkout } = parsed.data

  const supabase = await createClient()
  // place_order() takes helmet builds as { slug, quantity, config } and products as { kind, variant_id, quantity }.
  const orderItems = items.map((item) =>
    item.kind === "product"
      ? { kind: "product", variant_id: item.variantId, quantity: item.quantity, ...(item.finish ? { finish: item.finish } : {}) }
      : { slug: item.slug, quantity: item.quantity, config: item.config },
  )
  const { data, error } = await supabase.rpc("place_order", {
    p_items: orderItems,
    p_customer: { name: checkout.name, email: checkout.email, phone: checkout.phone },
    p_shipping: checkout.requiresAddress ? checkout.address : {},
    p_delivery_method: checkout.deliveryMethod,
    p_notes: checkout.notes,
  })

  if (error) return databaseError(error, "We couldn't place your order. Please try again.")
  const order = data?.[0]
  if (!order) return failure("We couldn't place your order. Please try again.")

  if (checkout.saveDetails) {
    const { address } = checkout
    await supabase
      .from("profiles")
      .update({
        full_name: checkout.name,
        phone: checkout.phone,
        ...(checkout.requiresAddress && {
          address_line1: address.line1,
          address_line2: address.line2,
          city: address.city,
          county: address.county,
          postcode: address.postcode,
          country: address.country || "United Kingdom",
        }),
      })
      .eq("id", user.id)
  }

  // Confirmation to the customer and an alert to the workshop, after the response is sent.
  const { data: placed } = await supabase
    .from("orders")
    .select("id, order_number, customer_name, customer_email, delivery_label, total, order_items(product_name, quantity, line_total, configuration, line_kind)")
    .eq("id", order.order_id)
    .single()
  if (placed) {
    after(() =>
      notifyOrderPlaced({
        id: placed.id,
        orderNumber: placed.order_number,
        customerName: placed.customer_name,
        customerEmail: placed.customer_email,
        deliveryLabel: placed.delivery_label,
        total: Number(placed.total),
        hasHelmets: placed.order_items.some((item) => item.line_kind === "helmet"),
        items: placed.order_items.map((item) => ({
          name: item.product_name,
          quantity: item.quantity,
          lineTotal: Number(item.line_total),
          summary: ((item.configuration as { summary?: { label: string; value: string }[] })?.summary ?? []),
        })),
      }),
    )
  }

  return { ok: true, data: { orderNumber: order.order_number } }
}
