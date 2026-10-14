"use server"

import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { DEMO_READ_ONLY, isDemoMode } from "@/lib/demo/mode"
import { createClient } from "@/lib/supabase/server"
import { loginSchema, signupSchema, type LoginFormValues, type SignupFormValues } from "@/lib/validations/auth"
import type { ActionResult } from "@/types/account"

import { failure, validationError } from "./result"

/** Only allow redirects back into this site. */
function safeNext(next: string | null | undefined, fallback: string): string {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : fallback
}

export async function signIn(values: LoginFormValues, next?: string): Promise<ActionResult> {
  if (isDemoMode()) return DEMO_READ_ONLY
  const parsed = loginSchema.safeParse(values)
  if (!parsed.success) return validationError(parsed.error)

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  })

  if (error) {
    if (error.code === "email_not_confirmed") {
      return failure("Please confirm your email first. Check your inbox for the link we sent.")
    }
    return failure("That email and password don't match an account.")
  }

  // Admins land in the admin portal unless they were heading somewhere specific.
  const { data: isAdmin } = await supabase.rpc("is_admin")
  redirect(safeNext(next, isAdmin ? "/admin" : "/account"))
}

export async function signUp(values: SignupFormValues): Promise<ActionResult<{ needsConfirmation: boolean }>> {
  if (isDemoMode()) return DEMO_READ_ONLY
  const parsed = signupSchema.safeParse(values)
  if (!parsed.success) return validationError(parsed.error)

  const origin = (await headers()).get("origin") ?? ""
  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.fullName },
      emailRedirectTo: `${origin}/auth/confirm?next=/account`,
    },
  })

  if (error) {
    if (error.code === "user_already_exists") return failure("An account with that email already exists. Try logging in.")
    if (error.code === "weak_password") return failure("Please choose a stronger password.")
    return failure("We couldn't create your account. Please try again.")
  }

  // With email confirmation on, Supabase returns no session until the link is clicked.
  if (!data.session) {
    return {
      ok: true,
      message: "Check your inbox to confirm your email, then log in.",
      data: { needsConfirmation: true },
    }
  }

  redirect("/account")
}

export async function signOut(): Promise<void> {
  if (isDemoMode()) redirect("/")
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/")
}
