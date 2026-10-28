import "server-only"

import { cacheLife, cacheTag } from "next/cache"

import { demoAeroKits, demoTemplates, demoVisors } from "@/lib/demo/catalog"
import { isDemoMode } from "@/lib/demo/mode"
import { toAeroKit, toDesignTemplate, toVisor } from "@/lib/supabase/mappers"
import { createPublicClient } from "@/lib/supabase/server"
import type { AeroKit, DesignTemplate, Visor } from "@/types/templates"

import { cacheTags } from "./cache-tags"
import { isMissingTable } from "./schema-state"

/**
 * The builder's catalogue: design templates with their editable regions, aero kits and
 * visors.
 *
 * These tables arrive with the 16-step migrations. Until those have been applied the
 * reads below fail, and the builder falls back to the three areas it has always had and
 * to the aero/visor steps being hidden. That keeps the live site working while the
 * database catches up, rather than taking the helmet builder down.
 */

export interface BuilderCatalog {
  templates: DesignTemplate[]
  aeroKits: AeroKit[]
  visors: Visor[]
  /** False when the tables aren't there yet, so the UI can stay on the old behaviour. */
  ready: boolean
}

const empty: BuilderCatalog = { templates: [], aeroKits: [], visors: [], ready: false }

export async function getBuilderCatalog(): Promise<BuilderCatalog> {
  "use cache"
  cacheTag(cacheTags.templates)
  cacheLife("hours")

  if (isDemoMode()) {
    return { templates: demoTemplates, aeroKits: demoAeroKits, visors: demoVisors, ready: true }
  }

  const supabase = createPublicClient()
  const [templates, regions, aeroKits, visors] = await Promise.all([
    supabase.from("design_templates").select("*").eq("is_active", true).order("sort_order"),
    supabase.from("template_regions").select("*").order("sort_order"),
    supabase.from("aero_kits").select("*").eq("is_active", true).order("sort_order"),
    supabase.from("visors").select("*").eq("is_active", true).order("sort_order"),
  ])

  const error = templates.error ?? regions.error ?? aeroKits.error ?? visors.error
  if (error) {
    if (isMissingTable(error)) {
      console.warn("[builder] 16-step tables not found; using the built-in template regions. Run npm run db:migrate.")
      return empty
    }
    throw new Error(`Could not load the builder catalogue: ${error.message}`)
  }

  const regionsByTemplate = new Map<string, typeof regions.data>()
  for (const region of regions.data ?? []) {
    const list = regionsByTemplate.get(region.template_id) ?? []
    list.push(region)
    regionsByTemplate.set(region.template_id, list)
  }

  return {
    templates: (templates.data ?? []).map((row) => toDesignTemplate(row, regionsByTemplate.get(row.id) ?? [])),
    aeroKits: (aeroKits.data ?? []).map(toAeroKit),
    visors: (visors.data ?? []).map(toVisor),
    ready: true,
  }
}
