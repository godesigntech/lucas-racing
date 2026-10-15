"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { databaseError, validationError } from "@/lib/actions/result"
import { DEMO_READ_ONLY, isDemoMode } from "@/lib/demo/mode"
import { createClient } from "@/lib/supabase/server"
import type { ActionResult } from "@/types/account"
import { enquiryStatuses } from "@/types/enquiry"

import { getAdmin, NOT_ALLOWED } from "./guard"

const enquiryUpdateSchema = z.object({
  status: z.enum(enquiryStatuses),
  adminNotes: z.string().trim().max(4000, "Keep notes under 4,000 characters"),
})

/** Sales and admins: mark an enquiry replied or closed, and keep private notes on it. */
export async function updateEnquiry(id: string, values: z.infer<typeof enquiryUpdateSchema>): Promise<ActionResult> {
  if (isDemoMode()) return DEMO_READ_ONLY
  if (!(await getAdmin())) return NOT_ALLOWED
  const parsed = enquiryUpdateSchema.safeParse(values)
  if (!parsed.success) return validationError(parsed.error)

  const supabase = await createClient()
  const { error } = await supabase
    .from("contact_messages")
    .update({ status: parsed.data.status, admin_notes: parsed.data.adminNotes })
    .eq("id", id)
  if (error) return databaseError(error, "We couldn't update the enquiry.")

  revalidatePath("/admin/enquiries")
  return { ok: true, message: "Enquiry updated." }
}
