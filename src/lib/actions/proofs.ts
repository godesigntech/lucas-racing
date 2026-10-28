"use server"

import { after } from "next/server"
import { revalidatePath } from "next/cache"

import { databaseError, validationError } from "@/lib/actions/result"
import { requireUser } from "@/lib/auth/session"
import { DEMO_READ_ONLY, isDemoMode } from "@/lib/demo/mode"
import { notifyProofAnswered } from "@/lib/email/notifications"
import { createClient } from "@/lib/supabase/server"
import { proofResponseSchema, type ProofResponseValues } from "@/lib/validations/proofs"
import type { ActionResult } from "@/types/account"

/**
 * The customer's answer to a proof.
 *
 * All the work happens in public.respond_to_proof(), which checks the proof belongs to
 * this customer, that it hasn't already been answered, moves the order on, and writes
 * the history entry — in one transaction. This action is the thin wrapper that validates
 * the input and tells the workshop.
 */
export async function respondToProof(values: ProofResponseValues): Promise<ActionResult> {
  if (isDemoMode()) return DEMO_READ_ONLY
  const user = await requireUser("/account")

  const parsed = proofResponseSchema.safeParse(values)
  if (!parsed.success) return validationError(parsed.error)
  const data = parsed.data

  const supabase = await createClient()
  const { error } = await supabase.rpc("respond_to_proof", {
    p_proof_id: data.proofId,
    p_approved: data.approved,
    p_note: data.note,
  })
  if (error) return databaseError(error, "We couldn't record your answer. Please try again.")

  const { data: proof } = await supabase
    .from("order_proofs")
    .select("order_id, version, orders(order_number)")
    .eq("id", data.proofId)
    .maybeSingle()

  const orderNumber = (proof?.orders as { order_number: string } | null)?.order_number ?? ""
  if (orderNumber) {
    after(() =>
      notifyProofAnswered({
        orderNumber,
        customerName: user.fullName || user.email,
        approved: data.approved,
        note: data.note,
        version: proof?.version ?? 1,
      }),
    )
    revalidatePath(`/account/orders/${orderNumber}`)
  }
  if (proof?.order_id) revalidatePath(`/admin/orders/${proof.order_id}`)

  return {
    ok: true,
    message: data.approved
      ? "Thanks — your proof is approved and your helmet is booked in."
      : "Thanks. We've passed your changes to the workshop and will send a new proof.",
  }
}
