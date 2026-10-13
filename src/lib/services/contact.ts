import type { ContactFormValues } from "@/lib/validations/contact"

import { simulateLatency, type ServiceResult } from "./mock"

/**
 * Preview only: nothing is sent or stored yet.
 * Replace with a Server Action or API route (e.g. Supabase + email) when the backend is ready.
 */
export async function sendContactMessage(values: ContactFormValues): Promise<ServiceResult> {
  await simulateLatency()
  return {
    ok: true,
    message: `Thanks ${values.name.split(" ")[0]}. This preview site doesn't send messages yet, so nothing was delivered.`,
  }
}
