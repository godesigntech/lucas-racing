"use server"

import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { DEMO_READ_ONLY, isDemoMode } from "@/lib/demo/mode"
import { createClient } from "@/lib/supabase/server"
import { loginSchema, signupSchema, type LoginFormValues, type SignupFormValues } from "@/lib/validations/auth"
import type { ActionResult } from "@/types/account"

import { failure, validationError } from "./result"

/** Customer-facing message for each Supabase sign-up error code. */
function signUpErrorMessage(code: string | undefined): string {
  switch (code) {
    case "user_already_exists":
    case "email_exists":
      return "An account with that email already exists. Try logging in."
    case "weak_password":
      return "Please choose a stronger password."
    case "email_address_invalid":
      return "Please use a real email address you can receive mail at."
    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
      return "Too many sign-ups in a short time. Please wait a few minutes and try again."
    case "email_address_not_authorized":
      return "We can't send a confirmation email to that address right now. Please contact us and we'll set up your account."
    case "signup_disabled":
    case "email_provider_disabled":
      return "New sign-ups are paused at the moment. Please contact us."
    default:
      return "We couldn't create your account. Please try again."
  }
}

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

  // Staff land in the admin portal (Teamwear on their products) unless they were heading somewhere specific.
  const [{ data: isAdmin }, { data: isTeamwear }] = await Promise.all([supabase.rpc("is_admin"), supabase.rpc("is_teamwear")])
  redirect(safeNext(next, isAdmin ? "/admin" : isTeamwear ? "/admin/shop" : "/account"))
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
    // Logged server-side so configuration problems (email limits, disabled sign-ups) are visible.
    console.error("Sign-up failed:", { code: error.code, status: error.status, message: error.message })
    return failure(signUpErrorMessage(error.code))
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
