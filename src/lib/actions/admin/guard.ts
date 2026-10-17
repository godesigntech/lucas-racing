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

/** For actions that change the catalogue, prices, settings or the team. */
export async function getFullAdmin(): Promise<CurrentUser | null> {
  const user = await getCurrentUser()
  return user?.role === "admin" ? user : null
}

/**
 * For shop catalogue actions: admins can change any shop, Teamwear only the Teamwear
 * shop. Pass every store the change touches (the product's current and new shop).
 */
export async function getShopManager(...storeIds: (string | null | undefined)[]): Promise<CurrentUser | null> {
  const user = await getCurrentUser()
  if (user?.role === "admin") return user
  if (user?.role === "teamwear" && storeIds.length > 0 && storeIds.every((store) => store === "teamwear")) return user
  return null
}

export const NOT_ALLOWED = { ok: false as const, message: "You don't have permission to do that." }
