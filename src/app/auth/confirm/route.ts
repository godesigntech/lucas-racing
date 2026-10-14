import type { EmailOtpType } from "@supabase/supabase-js"
import { NextResponse, type NextRequest } from "next/server"

import { createClient } from "@/lib/supabase/server"

/** Handles the link in Supabase confirmation and password-reset emails. */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const tokenHash = searchParams.get("token_hash")
  const type = searchParams.get("type") as EmailOtpType | null
  const code = searchParams.get("code")
  const nextParam = searchParams.get("next") ?? "/account"
  const next = nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/account"

  const supabase = await createClient()
  const { error } = tokenHash && type
    ? await supabase.auth.verifyOtp({ type, token_hash: tokenHash })
    : code
      ? await supabase.auth.exchangeCodeForSession(code)
      : { error: new Error("Missing token") }

  if (error) {
    return NextResponse.redirect(new URL("/login?error=link", origin))
  }
  return NextResponse.redirect(new URL(next, origin))
}
