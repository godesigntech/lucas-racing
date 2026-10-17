import "server-only"

import { cache } from "react"
import { notFound, redirect } from "next/navigation"
import { connection } from "next/server"

import { isDemoMode } from "@/lib/demo/mode"
import { demoUser } from "@/lib/demo/people"
import { createClient } from "@/lib/supabase/server"
import type { CurrentUser, StaffRole } from "@/types/account"

/**
 * The signed-in user, or null. Reads the session cookie, so call it inside a
 * <Suspense> boundary. Deduplicated per request.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  if (isDemoMode()) return demoUser

  // Session checks read the clock (token expiry), so they must run at request time, never during prerendering.
  await connection()
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const claims = data?.claims
  if (!claims?.sub) return null

  const email = (claims.email ?? "").toLowerCase()
  // The staff list is only readable by staff, so customers simply get no row back.
  const [{ data: profile }, { data: staff }] = await Promise.all([
    supabase.from("profiles").select("full_name, email").eq("id", claims.sub).maybeSingle(),
    supabase.from("admin_users").select("role").eq("email", email).maybeSingle(),
  ])

  const metadata = (claims.user_metadata ?? {}) as { full_name?: string }
  const role = staff ? (staff.role as StaffRole) : null
  return {
    id: claims.sub,
    email: profile?.email ?? claims.email ?? "",
    fullName: profile?.full_name || metadata.full_name || "",
    isAdmin: role === "admin" || role === "sales",
    isStaff: role !== null,
    role,
  }
})

/** Redirects to login when signed out. For pages. */
export async function requireUser(returnTo = "/account"): Promise<CurrentUser> {
  const user = await getCurrentUser()
  if (!user) redirect(`/login?next=${encodeURIComponent(returnTo)}`)
  return user
}

/** Anyone with a staff role (Teamwear included) may open the admin panel; customers see a 404. */
export async function requireStaff(): Promise<CurrentUser> {
  const user = await requireUser("/admin")
  if (!user.isStaff) notFound()
  return user
}

/** Admin or Sales only. Teamwear goes to their products; everyone else sees a 404. For pages. */
export async function requireAdmin(): Promise<CurrentUser> {
  const user = await requireStaff()
  if (user.role === "teamwear") redirect("/admin/shop")
  if (!user.isAdmin) notFound()
  return user
}

/** Shop products: admins (every shop) and Teamwear (Teamwear only). Sales go back to the dashboard. */
export async function requireShopManager(): Promise<CurrentUser> {
  const user = await requireStaff()
  if (user.role !== "admin" && user.role !== "teamwear") redirect("/admin")
  return user
}

/** Orders: Admin and Sales see all; Teamwear sees orders containing teamwear (row level security). */
export async function requireOrderViewer(): Promise<CurrentUser> {
  return requireStaff()
}

/** Catalogue, pricing, settings and team pages: full admins only. Sales go back to the dashboard. */
export async function requireFullAdmin(): Promise<CurrentUser> {
  const user = await requireAdmin()
  if (user.role !== "admin") redirect("/admin")
  return user
}
