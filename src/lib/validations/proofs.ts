import { z } from "zod"

export const proofSchema = z.object({
  /** Storage path returned by uploadOrderProof(). */
  imagePath: z.string().trim().min(1, "Upload a file first").max(400),
  kind: z.enum(["design_proof", "production_photo"]),
  caption: z.string().trim().max(200),
  /** Null when the proof covers the whole order rather than one helmet. */
  orderItemId: z.string().uuid().nullable(),
})
export type ProofValues = z.infer<typeof proofSchema>

export const proofResponseSchema = z.object({
  proofId: z.string().uuid(),
  approved: z.boolean(),
  note: z.string().trim().max(1000, "Please keep your note under 1000 characters"),
})
export type ProofResponseValues = z.infer<typeof proofResponseSchema>
