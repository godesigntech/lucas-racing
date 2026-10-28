"use server"

import { revalidatePath, updateTag } from "next/cache"

import { databaseError, validationError } from "@/lib/actions/result"
import { cacheTags } from "@/lib/data/cache-tags"
import { DEMO_READ_ONLY, isDemoMode } from "@/lib/demo/mode"
import { createClient } from "@/lib/supabase/server"
import {
  aeroKitSchema,
  designTemplateSchema,
  helmetSizesSchema,
  templateRegionSchema,
  visorSchema,
  type AeroKitValues,
  type DesignTemplateValues,
  type HelmetSizesValues,
  type TemplateRegionValues,
  type VisorValues,
} from "@/lib/validations/builder-admin"
import type { ActionResult } from "@/types/account"

import { getFullAdmin, NOT_ALLOWED } from "./guard"

/** Blank optional text is stored as null, so "no mask" reads the same everywhere. */
const orNull = (value: string) => value.trim() || null

/**
 * The builder's catalogue: design templates and their editable regions, aero kits,
 * visors and per-size pricing.
 *
 * The helmet builder reads these through a tagged cache, so every write clears it and
 * the site picks the change up immediately.
 */
function refreshBuilder() {
  updateTag(cacheTags.templates)
  updateTag(cacheTags.catalog)
  revalidatePath("/admin/templates")
  revalidatePath("/admin/fittings")
  revalidatePath("/helmet-builder")
}

const DUPLICATE_KEY = "23505"

export async function updateDesignTemplate(id: string, values: DesignTemplateValues): Promise<ActionResult> {
  if (isDemoMode()) return DEMO_READ_ONLY
  if (!(await getFullAdmin())) return NOT_ALLOWED

  const parsed = designTemplateSchema.safeParse(values)
  if (!parsed.success) return validationError(parsed.error)
  const data = parsed.data

  const supabase = await createClient()
  const { error } = await supabase
    .from("design_templates")
    .update({
      svg_url: orNull(data.svgUrl),
      graphic_mask_url: orNull(data.graphicMaskUrl),
      accent_mask_url: orNull(data.accentMaskUrl),
      thumbnail_url: orNull(data.thumbnailUrl),
      artwork_status: data.artworkStatus,
      is_active: data.isActive,
      sort_order: data.sortOrder,
    })
    .eq("id", id)
  if (error) return databaseError(error, "We couldn't save the template.")

  refreshBuilder()
  return { ok: true, message: data.isActive ? "Template saved." : "Template saved and hidden from the builder." }
}

/** Adds a region when `id` is null, otherwise updates it. */
export async function saveTemplateRegion(
  templateId: string,
  id: string | null,
  values: TemplateRegionValues,
): Promise<ActionResult> {
  if (isDemoMode()) return DEMO_READ_ONLY
  if (!(await getFullAdmin())) return NOT_ALLOWED

  const parsed = templateRegionSchema.safeParse(values)
  if (!parsed.success) return validationError(parsed.error)
  const data = parsed.data

  const row = {
    template_id: templateId,
    key: data.key,
    label: data.label,
    kind: data.kind,
    mask_url: orNull(data.maskUrl),
    svg_element_id: orNull(data.svgElementId),
    default_colour: data.defaultColour,
    allows_film: data.allowsFilm,
    allows_chrome: data.allowsChrome,
    allows_metallic: data.allowsMetallic,
    sort_order: data.sortOrder,
  }

  const supabase = await createClient()
  const { error } = id
    ? await supabase.from("template_regions").update(row).eq("id", id)
    : await supabase.from("template_regions").insert(row)

  if (error?.code === DUPLICATE_KEY) {
    return { ok: false, message: "Please check the highlighted fields.", fieldErrors: { key: "This template already has a region with that id." } }
  }
  if (error) return databaseError(error, "We couldn't save the region.")

  refreshBuilder()
  return { ok: true, message: id ? "Region saved." : "Region added." }
}

export async function deleteTemplateRegion(id: string): Promise<ActionResult> {
  if (isDemoMode()) return DEMO_READ_ONLY
  if (!(await getFullAdmin())) return NOT_ALLOWED

  const supabase = await createClient()
  const { error } = await supabase.from("template_regions").delete().eq("id", id)
  if (error) return databaseError(error, "We couldn't remove the region.")

  refreshBuilder()
  return { ok: true, message: "Region removed." }
}

/** Adds an aero kit when `isNew`, otherwise updates the one with that id. */
export async function saveAeroKit(isNew: boolean, values: AeroKitValues): Promise<ActionResult> {
  if (isDemoMode()) return DEMO_READ_ONLY
  if (!(await getFullAdmin())) return NOT_ALLOWED

  const parsed = aeroKitSchema.safeParse(values)
  if (!parsed.success) return validationError(parsed.error)
  const data = parsed.data

  const row = {
    id: data.id,
    model_id: data.modelId,
    name: data.name,
    summary: orNull(data.summary),
    mesh_name: orNull(data.meshName),
    price: data.price,
    is_active: data.isActive,
    sort_order: data.sortOrder,
  }

  const supabase = await createClient()
  const { error } = isNew
    ? await supabase.from("aero_kits").insert(row)
    : await supabase.from("aero_kits").update(row).eq("id", data.id)

  if (error?.code === DUPLICATE_KEY) {
    return { ok: false, message: "Please check the highlighted fields.", fieldErrors: { id: "Another aero kit already uses that id." } }
  }
  if (error) return databaseError(error, "We couldn't save the aero kit.")

  refreshBuilder()
  return { ok: true, message: data.price === null ? "Saved. Customers see it as price on request." : "Aero kit saved." }
}

export async function deleteAeroKit(id: string): Promise<ActionResult> {
  if (isDemoMode()) return DEMO_READ_ONLY
  if (!(await getFullAdmin())) return NOT_ALLOWED

  const supabase = await createClient()
  const { error } = await supabase.from("aero_kits").delete().eq("id", id)
  if (error) return databaseError(error, "We couldn't remove the aero kit.")

  refreshBuilder()
  return { ok: true, message: "Aero kit removed." }
}

export async function saveVisor(isNew: boolean, values: VisorValues): Promise<ActionResult> {
  if (isDemoMode()) return DEMO_READ_ONLY
  if (!(await getFullAdmin())) return NOT_ALLOWED

  const parsed = visorSchema.safeParse(values)
  if (!parsed.success) return validationError(parsed.error)
  const data = parsed.data

  const row = {
    id: data.id,
    model_id: data.modelId,
    name: data.name,
    kind: data.kind,
    tint: data.tint,
    opacity: data.opacity,
    metalness: data.metalness,
    price: data.price,
    is_active: data.isActive,
    sort_order: data.sortOrder,
  }

  const supabase = await createClient()
  const { error } = isNew
    ? await supabase.from("visors").insert(row)
    : await supabase.from("visors").update(row).eq("id", data.id)

  if (error?.code === DUPLICATE_KEY) {
    return { ok: false, message: "Please check the highlighted fields.", fieldErrors: { id: "Another visor already uses that id." } }
  }
  if (error) return databaseError(error, "We couldn't save the visor.")

  refreshBuilder()
  return { ok: true, message: data.price === null ? "Saved. Customers see it as price on request." : "Visor saved." }
}

export async function deleteVisor(id: string): Promise<ActionResult> {
  if (isDemoMode()) return DEMO_READ_ONLY
  if (!(await getFullAdmin())) return NOT_ALLOWED

  const supabase = await createClient()
  const { error } = await supabase.from("visors").delete().eq("id", id)
  if (error) return databaseError(error, "We couldn't remove the visor.")

  refreshBuilder()
  return { ok: true, message: "Visor removed." }
}

/** Replaces a helmet's sizes: what's offered, in what order, and any surcharge. */
export async function saveHelmetSizes(values: HelmetSizesValues): Promise<ActionResult> {
  if (isDemoMode()) return DEMO_READ_ONLY
  if (!(await getFullAdmin())) return NOT_ALLOWED

  const parsed = helmetSizesSchema.safeParse(values)
  if (!parsed.success) return validationError(parsed.error)
  const data = parsed.data

  const supabase = await createClient()
  const { error } = await supabase.from("helmet_model_sizes").upsert(
    data.sizes.map((size) => ({
      model_id: data.modelId,
      size: size.size,
      price: size.price,
      is_active: size.isActive,
      sort_order: size.sortOrder,
    })),
    { onConflict: "model_id,size" },
  )
  if (error) return databaseError(error, "We couldn't save the sizes.")

  refreshBuilder()
  revalidatePath("/admin/pricing")
  return { ok: true, message: "Sizes saved." }
}
