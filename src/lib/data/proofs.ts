import "server-only"

import { isDemoMode } from "@/lib/demo/mode"
import { toOrderProof } from "@/lib/supabase/mappers"
import { createClient } from "@/lib/supabase/server"
import type { OrderProof } from "@/types/production"

import { isMissingTable } from "./schema-state"

/**
 * Proofs and finished-helmet photographs for one order.
 *
 * Used by both the workshop and the customer: row level security decides who sees what,
 * so there's one loader rather than an admin and a customer copy that could drift. The
 * bucket is private, so each row is paired with a signed link that lasts an hour.
 */

export interface ProofWithUrl extends OrderProof {
  /** Signed link to the file. Null if the link couldn't be created. */
  url: string | null
  isPdf: boolean
}

export async function listOrderProofs(orderId: string): Promise<ProofWithUrl[]> {
  if (isDemoMode()) return []

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("order_proofs")
    .select("*")
    .eq("order_id", orderId)
    .order("created_at", { ascending: false })

  if (error) {
    // Before the migration runs there are no proofs; that isn't an error worth a page.
    if (isMissingTable(error)) return []
    throw new Error(`Could not load the proofs: ${error.message}`)
  }

  const proofs = (data ?? []).map(toOrderProof)
  return Promise.all(
    proofs.map(async (proof) => {
      const { data: link } = await supabase.storage.from("order-proofs").createSignedUrl(proof.imagePath, 60 * 60)
      return { ...proof, url: link?.signedUrl ?? null, isPdf: proof.imagePath.endsWith(".pdf") }
    }),
  )
}

/** The proof the customer is being asked to answer, if there is one. */
export function pendingProof(proofs: ProofWithUrl[]): ProofWithUrl | null {
  return proofs.find((proof) => proof.kind === "design_proof" && proof.status === "pending") ?? null
}
