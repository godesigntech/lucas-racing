import { getCurrentUser } from "@/lib/auth/session"
import { isDemoMode } from "@/lib/demo/mode"

import { CustomerChatLazy } from "./customer-chat-lazy"

/** Live chat for signed-in customers. Admins answer from the admin panel instead. Reads the session: render in <Suspense>. */
export async function CustomerChatLauncher() {
  if (isDemoMode()) return null
  const user = await getCurrentUser()
  if (!user || user.isStaff) return null

  const firstName = user.fullName.trim().split(/\s+/)[0] ?? ""
  return <CustomerChatLazy customerId={user.id} firstName={firstName} />
}
