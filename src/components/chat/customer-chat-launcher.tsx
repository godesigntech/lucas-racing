import { getCurrentUser } from "@/lib/auth/session"
import { isDemoMode } from "@/lib/demo/mode"

import { CustomerChat } from "./customer-chat"

/** Live chat for signed-in customers. Admins answer from the admin panel instead. Reads the session: render in <Suspense>. */
export async function CustomerChatLauncher() {
  if (isDemoMode()) return null
  const user = await getCurrentUser()
  if (!user || user.isAdmin) return null

  const firstName = user.fullName.trim().split(/\s+/)[0] ?? ""
  return <CustomerChat customerId={user.id} firstName={firstName} />
}
