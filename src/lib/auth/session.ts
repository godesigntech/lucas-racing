import "server-only"

import { cache } from "react"
import { notFound, redirect } from "next/navigation"

import { isDemoMode } from "@/lib/demo/mode"
import { demoUser } from "@/lib/demo/people"
import { createClient } from "@/lib/supabase/server"
import type { CurrentUser } from "@/types/account"

/**
 * The signed-in user, or null. Reads the session cookie, so call it inside a
 * <Suspense> boundary. Deduplicated per request.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  if (isDemoMode()) return demoUser

  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const claims = data?.claims
  if (!claims?.sub) return null

  const [{ data: profile }, { data: isAdmin }] = await Promise.all([
    supabase.from("profiles").select("full_name, email").eq("id", claims.sub).maybeSingle(),
    supabase.rpc("is_admin"),
  ])

  const metadata = (claims.user_metadata ?? {}) as { full_name?: string }
  return {
    id: claims.sub,
    email: profile?.email ?? claims.email ?? "",
    fullName: profile?.full_name || metadata.full_name || "",
    isAdmin: isAdmin === true,
  }
})

/** Redirects to login when signed out. For pages. */
export async function requireUser(returnTo = "/account"): Promise<CurrentUser> {
  const user = await getCurrentUser()
  if (!user) redirect(`/login?next=${encodeURIComponent(returnTo)}`)
  return user
}

/** Only admins get past this; everyone else sees a 404. For pages. */
export async function requireAdmin(): Promise<CurrentUser> {
  const user = await requireUser("/admin")
  if (!user.isAdmin) notFound()
  return user
}
