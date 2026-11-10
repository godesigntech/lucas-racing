import "server-only"

import { createClient as createSupabaseClient } from "@supabase/supabase-js"

import type { Database } from "./database.types"
import { supabaseUrl } from "./env"

/**
 * Supabase's secret key, which can create accounts. Server only, never sent to the
 * browser. Set SUPABASE_SECRET_KEY (or the older SUPABASE_SERVICE_ROLE_KEY) in
 * .env.local and in Netlify's environment variables.
 */
const secretKey = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY

/** True when the secret key is set, so admins can create accounts with a password. */
export const canCreateAccounts = Boolean(secretKey)

/** A client with full access, for the few admin tasks Supabase only allows with the secret key. */
export function createAdminClient() {
  if (!secretKey) throw new Error("SUPABASE_SECRET_KEY is not set.")
  return createSupabaseClient<Database>(supabaseUrl, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
