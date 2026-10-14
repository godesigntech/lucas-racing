import "server-only"

import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"

import type { Database } from "./database.types"
import { supabaseKey, supabaseUrl } from "./env"

/**
 * Per-request client that acts as the signed-in user (reads auth cookies).
 * Use in Server Components, Server Actions and Route Handlers.
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) cookieStore.set(name, value, options)
        } catch {
          // Called from a Server Component: the proxy refreshes the session instead.
        }
      },
    },
  })
}

/**
 * Anonymous client with no cookies, for public catalogue reads inside `use cache`.
 * Row level security limits it to public data.
 */
export function createPublicClient() {
  return createSupabaseClient<Database>(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
