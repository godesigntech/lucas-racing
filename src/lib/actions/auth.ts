"use server"

import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { DEMO_READ_ONLY, isDemoMode } from "@/lib/demo/mode"
import { safeRedirectPath } from "@/lib/safe-redirect"
import { createClient } from "@/lib/supabase/server"
import {
  forgotPasswordSchema,
  loginSchema,
  signupSchema,
  type ForgotPasswordValues,
  type LoginFormValues,
  type SignupFormValues,
} from "@/lib/validations/auth"
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
const safeNext = safeRedirectPath

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
      // The form offers to send the link again.
      return { ok: false, code: "email_not_confirmed", message: "Please confirm your email first. Check your inbox for the link we sent." }
    }
    return failure("That email and password don't match an account.")
  }

  // Staff land in the admin portal (shop staff on their products) unless they were heading somewhere specific.
  const [{ data: isAdmin }, { data: isShopStaff }] = await Promise.all([supabase.rpc("is_admin"), supabase.rpc("is_shop_staff")])
  redirect(safeNext(next, isAdmin ? "/admin" : isShopStaff ? "/admin/shop" : "/account"))
}

/** `next` is where to go once the account exists, e.g. back to a form the customer was filling in. */
export async function signUp(values: SignupFormValues, next?: string): Promise<ActionResult<{ needsConfirmation: boolean }>> {
  const destination = safeNext(next, "/account")
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
      emailRedirectTo: `${origin}/auth/confirm?next=${encodeURIComponent(destination)}`,
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

  redirect(destination)
}

/** Where an email link lands: /auth/confirm signs the customer in, then sends them on to `next`. */
async function emailLink(next: string) {
  const origin = (await headers()).get("origin") ?? ""
  return `${origin}/auth/confirm?next=${encodeURIComponent(next)}`
}

const emailLimitMessage = "We've sent a few emails already. Please wait a few minutes and try again."
const isRateLimited = (code: string | undefined) => code === "over_email_send_rate_limit" || code === "over_request_rate_limit"

/** Sends the sign-up confirmation link again (from login, or the "check your inbox" screen). */
export async function resendConfirmation(emailAddress: string, next?: string): Promise<ActionResult> {
  if (isDemoMode()) return DEMO_READ_ONLY
  const parsed = forgotPasswordSchema.safeParse({ email: emailAddress })
  if (!parsed.success) return failure("Enter the email you signed up with.")

  const supabase = await createClient()
  const { error } = await supabase.auth.resend({
    type: "signup",
    email: parsed.data.email,
    options: { emailRedirectTo: await emailLink(safeNext(next, "/account")) },
  })
  if (error) {
    console.error("Resend confirmation failed:", { code: error.code, status: error.status, message: error.message })
    if (isRateLimited(error.code)) return failure(emailLimitMessage)
    return failure("We couldn't send the email. Please try again.")
  }
  return { ok: true, message: "We've sent a new confirmation link. Check your inbox." }
}

/**
 * Emails a link to choose a new password. The answer is the same whether or not the email
 * has an account, so the form can't be used to find out who has one.
 */
export async function requestPasswordReset(values: ForgotPasswordValues): Promise<ActionResult> {
  if (isDemoMode()) return DEMO_READ_ONLY
  const parsed = forgotPasswordSchema.safeParse(values)
  if (!parsed.success) return validationError(parsed.error)

  const supabase = await createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: await emailLink("/reset-password"),
  })
  if (error) {
    console.error("Password reset email failed:", { code: error.code, status: error.status, message: error.message })
    if (isRateLimited(error.code)) return failure(emailLimitMessage)
    if (error.code !== "user_not_found") return failure("We couldn't send the email. Please try again.")
  }
  return { ok: true, message: "If that email has an account, a reset link is on its way." }
}

export async function signOut(): Promise<void> {
  if (isDemoMode()) redirect("/")
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/")
}
