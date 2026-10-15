"use server"

import { revalidatePath, updateTag } from "next/cache"

import { databaseError, failure, validationError } from "@/lib/actions/result"
import { cacheTags } from "@/lib/data/cache-tags"
import { DEMO_READ_ONLY, isDemoMode } from "@/lib/demo/mode"
import { formatMoney } from "@/lib/format"
import { createClient } from "@/lib/supabase/server"
import {
  filmCategoryPriceSchema,
  filmSchema,
  helmetModelSchema,
  optionGroupSchema,
  productSchema,
  type FilmCategoryPriceValues,
  type FilmValues,
  type HelmetModelValues,
  type OptionGroupValues,
  type ProductValues,
} from "@/lib/validations/admin"
import type { ActionResult } from "@/types/account"

import { getAdmin, NOT_ALLOWED } from "./guard"

/** Public pages read the catalogue from a tagged cache; expire it after every change. */
function refreshCatalog(...paths: string[]) {
  updateTag(cacheTags.catalog)
  for (const path of paths) revalidatePath(path)
}

// Products ------------------------------------------------------------------

export async function updateProduct(productId: string, values: ProductValues): Promise<ActionResult> {
  if (isDemoMode()) return DEMO_READ_ONLY
  if (!(await getAdmin())) return NOT_ALLOWED
  const parsed = productSchema.safeParse(values)
  if (!parsed.success) return validationError(parsed.error)
  const data = parsed.data

  const supabase = await createClient()
  const { data: row, error } = await supabase
    .from("products")
    .update({
      name: data.name,
      tagline: data.tagline,
      description: data.description,
      category: data.category,
      model_ids: data.models,
      base_price: data.priceOnRequest ? null : data.basePrice,
      badge: data.badge === "none" ? null : data.badge,
      features: data.features
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean),
      specs: data.specs.filter((spec) => spec.label && spec.value),
      is_active: data.isActive,
      sort_order: data.sortOrder,
    })
    .eq("id", productId)
    .select("slug")
    .single()

  if (error) return databaseError(error, "We couldn't save the product.")
  refreshCatalog("/admin/products", `/admin/products/${row.slug}`)
  return { ok: true, message: `${data.name} saved.` }
}

export async function setProductActive(productId: string, isActive: boolean): Promise<ActionResult> {
  if (isDemoMode()) return DEMO_READ_ONLY
  if (!(await getAdmin())) return NOT_ALLOWED
  const supabase = await createClient()
  const { error } = await supabase.from("products").update({ is_active: isActive }).eq("id", productId)
  if (error) return databaseError(error, "We couldn't update the product.")
  refreshCatalog("/admin/products")
  return { ok: true, message: isActive ? "Product is now live on the site." : "Product hidden from the site." }
}

// Films ---------------------------------------------------------------------

export async function saveFilm(values: FilmValues, mode: "create" | "update"): Promise<ActionResult> {
  if (isDemoMode()) return DEMO_READ_ONLY
  if (!(await getAdmin())) return NOT_ALLOWED
  const parsed = filmSchema.safeParse(values)
  if (!parsed.success) return validationError(parsed.error)
  const film = parsed.data

  const supabase = await createClient()
  const row = {
    name: film.name,
    category: film.category,
    pattern: film.pattern,
    price: film.price,
    is_active: film.isActive,
    sort_order: film.sortOrder,
  }
  const { error } =
    mode === "create"
      ? await supabase.from("films").insert({ id: film.id, ...row })
      : await supabase.from("films").update(row).eq("id", film.id)

  if (error) {
    if (error.code === "23505") return failure("A film with that ID already exists. Choose a different ID.")
    return databaseError(error, "We couldn't save the film.")
  }
  refreshCatalog("/admin/films")
  return { ok: true, message: mode === "create" ? `${film.name} added.` : `${film.name} saved.` }
}

export async function deleteFilm(id: string): Promise<ActionResult> {
  if (isDemoMode()) return DEMO_READ_ONLY
  if (!(await getAdmin())) return NOT_ALLOWED
  if (id === "none") return failure("Solid colour is required by the configurator and can't be deleted.")

  const supabase = await createClient()
  const { error } = await supabase.from("films").delete().eq("id", id)
  if (error) return databaseError(error, "We couldn't delete the film.")
  refreshCatalog("/admin/films")
  return { ok: true, message: "Film deleted." }
}

/** Sets one price for every film in a category, e.g. all Carbon fibre films to £55. */
export async function setFilmCategoryPrice(values: FilmCategoryPriceValues): Promise<ActionResult> {
  if (isDemoMode()) return DEMO_READ_ONLY
  if (!(await getAdmin())) return NOT_ALLOWED
  const parsed = filmCategoryPriceSchema.safeParse(values)
  if (!parsed.success) return validationError(parsed.error)
  const { category, price } = parsed.data

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("films")
    .update({ price })
    .eq("category", category)
    .neq("id", "none")
    .select("id")
  if (error) return databaseError(error, "We couldn't update the prices.")
  refreshCatalog("/admin/films")
  const count = data?.length ?? 0
  return { ok: true, message: `${count} ${category} ${count === 1 ? "film" : "films"} now cost ${formatMoney(price)}.` }
}

// Pricing -------------------------------------------------------------------

export async function updateHelmetModel(id: string, values: HelmetModelValues): Promise<ActionResult> {
  if (isDemoMode()) return DEMO_READ_ONLY
  if (!(await getAdmin())) return NOT_ALLOWED
  const parsed = helmetModelSchema.safeParse(values)
  if (!parsed.success) return validationError(parsed.error)

  const supabase = await createClient()
  const { error } = await supabase
    .from("helmet_models")
    .update({
      name: parsed.data.name,
      summary: parsed.data.summary,
      new_helmet_price: parsed.data.newHelmetPrice,
      sizes: parsed.data.sizes,
      is_active: parsed.data.isActive,
    })
    .eq("id", id)
  if (error) return databaseError(error, "We couldn't save the helmet.")
  refreshCatalog("/admin/pricing")
  return { ok: true, message: `${parsed.data.name} saved.` }
}

export async function updateOptionGroup(values: OptionGroupValues): Promise<ActionResult> {
  if (isDemoMode()) return DEMO_READ_ONLY
  if (!(await getAdmin())) return NOT_ALLOWED
  const parsed = optionGroupSchema.safeParse(values)
  if (!parsed.success) return validationError(parsed.error)

  if (!parsed.data.options.some((option) => option.isActive)) {
    return failure("Keep at least one option switched on, or customers can't complete the configurator.")
  }

  const supabase = await createClient()
  const results = await Promise.all(
    parsed.data.options.map((option) =>
      supabase
        .from("configurator_options")
        .update({ label: option.label, price: option.price, is_active: option.isActive })
        .eq("option_group", parsed.data.group)
        .eq("value", option.value),
    ),
  )
  const failed = results.find((result) => result.error)
  if (failed?.error) return databaseError(failed.error, "Some options weren't saved. Please try again.")

  refreshCatalog("/admin/pricing")
  return { ok: true, message: "Prices saved." }
}
