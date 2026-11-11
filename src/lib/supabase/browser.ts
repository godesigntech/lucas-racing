import { createBrowserClient } from "@supabase/ssr"

import type { Database } from "./database.types"
import { supabaseKey, supabaseUrl } from "./env"

export function createClient() {
  return createBrowserClient<Database>(supabaseUrl, supabaseKey)
}

type Bucket = ReturnType<ReturnType<typeof createClient>["storage"]["from"]>

/**
 * Uploads a file, renewing the login once if storage says it has expired. The browser
 * renews it on its own clock, so on a computer whose clock is a few minutes slow it can
 * still be sending a login the server has already expired, and the upload fails.
 */
export async function uploadFile(bucket: string, path: string, body: Blob, options: Parameters<Bucket["upload"]>[2]): Promise<{ error: Error | null }> {
  const client = createClient()
  const first = await client.storage.from(bucket).upload(path, body, options)
  if (!first.error || !/exp|jwt|expired/i.test(first.error.message)) return { error: first.error }
  const { error: refreshError } = await client.auth.refreshSession()
  if (refreshError) return { error: first.error }
  const second = await client.storage.from(bucket).upload(path, body, options)
  return { error: second.error }
}
