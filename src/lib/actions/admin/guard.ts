import "server-only"

import { getCurrentUser } from "@/lib/auth/session"
import type { CurrentUser } from "@/types/account"

/**
 * Server Actions are public endpoints, so every admin action re-checks the
 * session here. Row level security enforces the same rule in the database.
 */
export async function getAdmin(): Promise<CurrentUser | null> {
  const user = await getCurrentUser()
  return user?.isAdmin ? user : null
}

export const NOT_ALLOWED = { ok: false as const, message: "You don't have permission to do that." }
