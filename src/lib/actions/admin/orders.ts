"use server"

import { after } from "next/server"
import { revalidatePath } from "next/cache"

import { databaseError, validationError } from "@/lib/actions/result"
import { formatUkDateShort } from "@/lib/dates/uk"
import { DEMO_READ_ONLY, isDemoMode } from "@/lib/demo/mode"
import { notifyOrderStatus } from "@/lib/email/notifications"
import { orderStatusMeta } from "@/lib/orders/status"
import { createClient } from "@/lib/supabase/server"
import {
  adminNotesSchema,
  orderStatusUpdateSchema,
  type AdminNotesValues,
  type OrderStatusUpdateValues,
} from "@/lib/validations/admin"
import type { ActionResult } from "@/types/account"

import { getAdmin, NOT_ALLOWED } from "./guard"

export async function updateOrderStatus(orderId: string, values: OrderStatusUpdateValues): Promise<ActionResult> {
  if (isDemoMode()) return DEMO_READ_ONLY
  const admin = await getAdmin()
  if (!admin) return NOT_ALLOWED

  const parsed = orderStatusUpdateSchema.safeParse(values)
  if (!parsed.success) return validationError(parsed.error)

  const supabase = await createClient()
  const { data: current, error: readError } = await supabase
    .from("orders")
    .select("status, payment_status, order_number, customer_name, customer_email, estimated_completion_date")
    .eq("id", orderId)
    .single()
  if (readError) return databaseError(readError, "We couldn't find that order.")

  const { status, paymentStatus, note } = parsed.data
  const changed = current.status !== status || current.payment_status !== paymentStatus
  if (!changed && !note) return { ok: true, message: "Nothing to update." }

  if (changed) {
    const { error } = await supabase.from("orders").update({ status, payment_status: paymentStatus }).eq("id", orderId)
    if (error) return databaseError(error, "We couldn't update the order.")
  }

  const { error: eventError } = await supabase.from("order_status_events").insert({
    order_id: orderId,
    status,
    payment_status: paymentStatus,
    note,
    created_by: admin.id,
  })
  if (eventError) return databaseError(eventError, "The order was updated, but its history wasn't saved.")

  // Tell the customer when the order actually moves. A note on its own is internal, and
  // "proof sent" has its own email with the proof attached to it, so it's skipped here.
  if (changed && current.status !== status && status !== "awaiting_proof_approval") {
    const meta = orderStatusMeta[status]
    after(() =>
      notifyOrderStatus({
        orderNumber: current.order_number,
        customerName: current.customer_name,
        customerEmail: current.customer_email,
        label: meta.label,
        description: meta.description,
        note,
        estimatedCompletionDate: current.estimated_completion_date
          ? formatUkDateShort(current.estimated_completion_date)
          : null,
      }),
    )
  }

  revalidatePath(`/admin/orders/${orderId}`)
  return { ok: true, message: changed ? "Order updated." : "Note added to the history." }
}

export async function updateAdminNotes(orderId: string, values: AdminNotesValues): Promise<ActionResult> {
  if (isDemoMode()) return DEMO_READ_ONLY
  if (!(await getAdmin())) return NOT_ALLOWED

  const parsed = adminNotesSchema.safeParse(values)
  if (!parsed.success) return validationError(parsed.error)

  const supabase = await createClient()
  const { error } = await supabase.from("orders").update({ admin_notes: parsed.data.adminNotes }).eq("id", orderId)
  if (error) return databaseError(error, "We couldn't save the notes.")

  revalidatePath(`/admin/orders/${orderId}`)
  return { ok: true, message: "Notes saved." }
}
