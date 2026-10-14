import "server-only"

import { cacheLife, cacheTag } from "next/cache"

import { demoSettings } from "@/lib/demo/catalog"
import { isDemoMode } from "@/lib/demo/mode"
import { createPublicClient } from "@/lib/supabase/server"
import { toSiteSettings } from "@/lib/supabase/mappers"
import type { SiteSettings } from "@/types/settings"

import { cacheTags } from "./cache-tags"

/** Business details, socials and delivery options edited in Admin > Settings. */
export async function getSiteSettings(): Promise<SiteSettings> {
  "use cache"
  cacheTag(cacheTags.settings)
  cacheLife("hours")

  if (isDemoMode()) return demoSettings

  const { data, error } = await createPublicClient().from("site_settings").select("*").eq("id", 1).single()
  if (error) throw new Error(`Could not load site settings: ${error.message}`)
  return toSiteSettings(data)
}
