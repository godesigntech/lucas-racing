"use server"

import { after } from "next/server"
import { revalidatePath } from "next/cache"

import { databaseError, failure, validationError } from "@/lib/actions/result"
import { DEMO_READ_ONLY, isDemoMode } from "@/lib/demo/mode"
import { notifyProofReady } from "@/lib/email/notifications"
import { createClient } from "@/lib/supabase/server"
import { proofSchema, type ProofValues } from "@/lib/validations/proofs"
import type { ActionResult } from "@/types/account"

import { getAdmin, NOT_ALLOWED } from "./guard"

/**
 * Design proofs and finished-helmet photographs.
 *
 * A design proof is the thing the customer signs off before anything is painted, so
 * adding one moves the order to "Proof sent" and emails them. Production photographs are
 * just a record of the finished helmet and change nothing.
 */
export async function addOrderProof(orderId: string, values: ProofValues): Promise<ActionResult> {
  if (isDemoMode()) return DEMO_READ_ONLY
  const admin = await getAdmin()
  if (!admin) return NOT_ALLOWED

  const parsed = proofSchema.safeParse(values)
  if (!parsed.success) return validationError(parsed.error)
  const data = parsed.data

  const supabase = await createClient()

  // Versions run per order and per kind, so "proof 2" means the second proof we sent.
  const { data: existing } = await supabase
    .from("order_proofs")
    .select("version")
    .eq("order_id", orderId)
    .eq("kind", data.kind)
    .order("version", { ascending: false })
    .limit(1)
  const version = (existing?.[0]?.version ?? 0) + 1

  const { error } = await supabase.from("order_proofs").insert({
    order_id: orderId,
    order_item_id: data.orderItemId,
    kind: data.kind,
    version,
    image_path: data.imagePath,
    caption: data.caption,
    status: data.kind === "design_proof" ? "pending" : "approved",
    created_by: admin.id,
  })
  if (error) return databaseError(error, "We couldn't save that file.")

  if (data.kind === "design_proof") {
    const { data: order } = await supabase
      .from("orders")
      .select("order_number, customer_name, customer_email, status, payment_status")
      .eq("id", orderId)
      .maybeSingle()

    if (order) {
      await supabase.from("orders").update({ status: "awaiting_proof_approval" }).eq("id", orderId)
      await supabase.from("order_status_events").insert({
        order_id: orderId,
        status: "awaiting_proof_approval",
        payment_status: order.payment_status,
        note: `Proof ${version} sent to the customer.`,
        created_by: admin.id,
      })
      after(() =>
        notifyProofReady({
          orderNumber: order.order_number,
          customerName: order.customer_name,
          customerEmail: order.customer_email,
          version,
        }),
      )
    }
  }

  revalidatePath(`/admin/orders/${orderId}`)
  return {
    ok: true,
    message: data.kind === "design_proof" ? "Proof sent. The customer has been emailed." : "Photo added.",
  }
}

export async function deleteOrderProof(orderId: string, proofId: string): Promise<ActionResult> {
  if (isDemoMode()) return DEMO_READ_ONLY
  if (!(await getAdmin())) return NOT_ALLOWED
  if (!proofId) return failure("That file is no longer there.")

  const supabase = await createClient()
  const { data: proof } = await supabase.from("order_proofs").select("image_path").eq("id", proofId).maybeSingle()

  const { error } = await supabase.from("order_proofs").delete().eq("id", proofId)
  if (error) return databaseError(error, "We couldn't remove that file.")

  // The row is the record; a file left behind would just be clutter.
  if (proof?.image_path) await supabase.storage.from("order-proofs").remove([proof.image_path])

  revalidatePath(`/admin/orders/${orderId}`)
  return { ok: true, message: "Removed." }
}
