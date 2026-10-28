import "server-only"

import { requireFullAdmin } from "@/lib/auth/session"
import { demoAeroKits, demoTemplates, demoVisors } from "@/lib/demo/catalog"
import { isDemoMode } from "@/lib/demo/mode"
import { toAeroKit, toDesignTemplate, toHelmetSizeOption, toVisor } from "@/lib/supabase/mappers"
import { createClient } from "@/lib/supabase/server"
import type { AeroKit, DesignTemplate, HelmetSizeOption, Visor } from "@/types/templates"

import { isMissingTable } from "./schema-state"

/**
 * Admin reads for the builder's catalogue: everything, including rows switched off.
 *
 * `ready` is false when the 16-step migrations haven't been applied, so the pages can
 * explain that instead of throwing. Writes are in lib/actions/admin/builder-catalog.ts
 * and are re-checked by row level security.
 */

export interface AdminBuilderCatalog {
  ready: boolean
  templates: DesignTemplate[]
  aeroKits: AeroKit[]
  visors: Visor[]
  sizes: HelmetSizeOption[]
}

const empty: AdminBuilderCatalog = { ready: false, templates: [], aeroKits: [], visors: [], sizes: [] }

export async function getAdminBuilderCatalog(): Promise<AdminBuilderCatalog> {
  await requireFullAdmin()
  if (isDemoMode()) {
    return {
      ready: true,
      templates: demoTemplates,
      aeroKits: demoAeroKits,
      visors: demoVisors,
      sizes: demoSizes(),
    }
  }

  const supabase = await createClient()
  const [templates, regions, aeroKits, visors, sizes] = await Promise.all([
    supabase.from("design_templates").select("*").order("sort_order"),
    supabase.from("template_regions").select("*").order("sort_order"),
    supabase.from("aero_kits").select("*").order("model_id").order("sort_order"),
    supabase.from("visors").select("*").order("model_id").order("sort_order"),
    supabase.from("helmet_model_sizes").select("*").order("model_id").order("sort_order"),
  ])

  const error = templates.error ?? regions.error ?? aeroKits.error ?? visors.error ?? sizes.error
  if (error) {
    if (isMissingTable(error)) return empty
    throw new Error(`Could not load the builder catalogue: ${error.message}`)
  }

  const regionsByTemplate = new Map<string, typeof regions.data>()
  for (const region of regions.data ?? []) {
    const list = regionsByTemplate.get(region.template_id) ?? []
    list.push(region)
    regionsByTemplate.set(region.template_id, list)
  }

  return {
    ready: true,
    templates: (templates.data ?? []).map((row) => toDesignTemplate(row, regionsByTemplate.get(row.id) ?? [])),
    aeroKits: (aeroKits.data ?? []).map(toAeroKit),
    visors: (visors.data ?? []).map(toVisor),
    sizes: (sizes.data ?? []).map(toHelmetSizeOption),
  }
}

/** Demo mode mirrors the seed: every model's sizes, all included in the price. */
function demoSizes(): HelmetSizeOption[] {
  const sizes = ["XS", "S", "M", "L", "XL", "XXL"]
  return ["arai-sk6", "bell-kc7"].flatMap((modelId) =>
    sizes.map((size, index) => ({ modelId, size, price: 0, isActive: true, sortOrder: index + 1 })),
  )
}
