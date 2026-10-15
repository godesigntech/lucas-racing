import "server-only"

import { requireAdmin } from "@/lib/auth/session"
import { ADMIN_PAGE_SIZE, type Paged } from "@/lib/data/admin"
import { isDemoMode } from "@/lib/demo/mode"
import type { ContactMessageRow } from "@/lib/supabase/database.types"
import { createClient } from "@/lib/supabase/server"
import { enquiryStatuses, type Enquiry, type EnquiryStatus } from "@/types/enquiry"

function toEnquiry(row: ContactMessageRow): Enquiry {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    topic: row.topic,
    design: row.design,
    message: row.message,
    status: row.status as EnquiryStatus,
    adminNotes: row.admin_notes,
    createdAt: row.created_at,
  }
}

/** Contact form messages, newest first, filtered by status and name/email/message search. */
export async function listEnquiries(options: {
  status?: string
  query?: string
  page?: number
}): Promise<Paged<Enquiry> & { counts: Record<EnquiryStatus, number> }> {
  await requireAdmin()
  const counts = Object.fromEntries(enquiryStatuses.map((status) => [status, 0])) as Record<EnquiryStatus, number>
  if (isDemoMode()) return { rows: [], total: 0, page: 1, pageCount: 1, counts }

  const supabase = await createClient()
  const page = Math.max(1, Math.floor(options.page ?? 1) || 1)
  const from = (page - 1) * ADMIN_PAGE_SIZE

  let request = supabase
    .from("contact_messages")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, from + ADMIN_PAGE_SIZE - 1)
  if (options.status && (enquiryStatuses as readonly string[]).includes(options.status)) {
    request = request.eq("status", options.status)
  }
  const term = (options.query ?? "").replace(/[%,()*]/g, " ").trim()
  if (term) request = request.or(`name.ilike.%${term}%,email.ilike.%${term}%,message.ilike.%${term}%`)

  const [{ data, count, error }, statuses] = await Promise.all([request, supabase.from("contact_messages").select("status")])
  if (error) throw new Error(error.message)
  for (const row of statuses.data ?? []) counts[row.status as EnquiryStatus] += 1

  const total = count ?? 0
  return { rows: (data ?? []).map(toEnquiry), total, page, pageCount: Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE)), counts }
}

/** Enquiries nobody has answered yet, for the dashboard. */
export async function countNewEnquiries(): Promise<number> {
  await requireAdmin()
  if (isDemoMode()) return 0
  const supabase = await createClient()
  const { count } = await supabase.from("contact_messages").select("id", { count: "exact", head: true }).eq("status", "new")
  return count ?? 0
}
