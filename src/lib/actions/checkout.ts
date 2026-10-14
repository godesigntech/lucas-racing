"use server"

import { getCurrentUser } from "@/lib/auth/session"
import { isDemoMode } from "@/lib/demo/mode"
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
  const { data, error } = await supabase.rpc("place_order", {
    p_items: items,
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

  return { ok: true, data: { orderNumber: order.order_number } }
}
