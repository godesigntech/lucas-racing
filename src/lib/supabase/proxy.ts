import { NextResponse, type NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"

import { isDemoMode } from "@/lib/demo/mode"

import type { Database } from "./database.types"
import { supabaseKey, supabaseUrl } from "./env"

const PROTECTED_PREFIXES = ["/account", "/admin", "/checkout"]
const AUTH_PAGES = ["/login", "/signup"]

/** Refreshes the Supabase session cookie and guards signed-in-only routes. */
export async function updateSession(request: NextRequest) {
  // Demo mode: Supabase is switched off and a demo admin is always signed in.
  if (isDemoMode()) return NextResponse.next({ request })

  let response = NextResponse.next({ request })

  const supabase = createServerClient<Database>(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet, headers) {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value)
        response = NextResponse.next({ request })
        for (const { name, value, options } of cookiesToSet) response.cookies.set(name, value, options)
        for (const [key, value] of Object.entries(headers ?? {})) response.headers.set(key, value)
      },
    },
  })

  // Do not run code between createServerClient and getClaims: it validates and refreshes the session.
  const { data } = await supabase.auth.getClaims()
  const signedIn = Boolean(data?.claims)
  const { pathname, search } = request.nextUrl

  if (!signedIn && PROTECTED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    url.search = `?next=${encodeURIComponent(pathname + search)}`
    return withCookies(NextResponse.redirect(url), response)
  }

  if (signedIn && AUTH_PAGES.includes(pathname)) {
    const url = request.nextUrl.clone()
    url.pathname = "/account"
    url.search = ""
    return withCookies(NextResponse.redirect(url), response)
  }

  return response
}

function withCookies(target: NextResponse, source: NextResponse) {
  for (const cookie of source.cookies.getAll()) target.cookies.set(cookie)
  return target
}
