"use server"

import { revalidatePath, updateTag } from "next/cache"

import { failure } from "@/lib/actions/result"
import { cacheTags } from "@/lib/data/cache-tags"
import { DEMO_READ_ONLY, isDemoMode } from "@/lib/demo/mode"
import { diffProduct, slugify, type ExistingProduct } from "@/lib/shop/import-diff"
import type { Json } from "@/lib/supabase/database.types"
import { createClient } from "@/lib/supabase/server"
import {
  importBatchSchema,
  importOptionsSchema,
  importStores,
  type ImportCounts,
  type ImportOptions,
  type ImportProduct,
  type ImportRowError,
} from "@/lib/validations/shop-import"
import type { ActionResult } from "@/types/account"

import { getFullAdmin, NOT_ALLOWED } from "./guard"

type Supabase = Awaited<ReturnType<typeof createClient>>

export interface ImportBatchResult {
  counts: ImportCounts
  errors: ImportRowError[]
}

/** Finds (and optionally creates) the category for a "Parent > Child" path. Cached per call. */
async function resolveCategory(
  supabase: Supabase,
  storeId: string,
  path: string,
  create: boolean,
  cache: Map<string, string | null>,
): Promise<string | null> {
  const names = path.split(">").map((name) => name.trim()).filter(Boolean)
  if (names.length === 0) return null
  const key = names.join(" > ").toLowerCase()
  if (cache.has(key)) return cache.get(key) ?? null

  let parentId: string | null = null
  for (const name of names) {
    let lookup = supabase.from("shop_categories").select("id").eq("store_id", storeId).ilike("name", name)
    lookup = parentId ? lookup.eq("parent_id", parentId) : lookup.is("parent_id", null)
    const { data: found } = await lookup.limit(1).maybeSingle()
    if (found) {
      parentId = found.id
      continue
    }
    if (!create) {
      cache.set(key, null)
      return null
    }
    const parent: string | null = parentId
    let createdId: string | null = null
    let slug = slugify(name)
    for (let attempt = 0; attempt < 5 && !createdId; attempt += 1) {
      const { data } = await supabase
        .from("shop_categories")
        .insert({ store_id: storeId, parent_id: parent, name, slug })
        .select("id")
        .maybeSingle()
      createdId = data?.id ?? null
      slug = `${slugify(name)}-${attempt + 2}`
    }
    if (!createdId) {
      cache.set(key, null)
      return null
    }
    parentId = createdId
  }
  cache.set(key, parentId)
  return parentId
}

async function loadExisting(supabase: Supabase, storeId: string, source: string, externalIds: string[]) {
  const { data, error } = await supabase
    .from("shop_products")
    .select("id, external_id, title, description, brand, category_id, images, option_names, manual_fields, shop_variants(id, sku, option_values, price, rrp, weight_grams, price_is_manual)")
    .eq("store_id", storeId)
    .eq("source", source)
    .in("external_id", externalIds)
  if (error) throw new Error(error.message)
  return new Map((data as unknown as ExistingProduct[]).map((product) => [product.external_id ?? "", product]))
}

async function guard(options: ImportOptions, products: ImportProduct[]) {
  if (isDemoMode()) return DEMO_READ_ONLY
  const admin = await getFullAdmin()
  if (!admin) return NOT_ALLOWED
  if (!importOptionsSchema.safeParse(options).success) return failure("Those import settings aren't valid.")
  if (!importBatchSchema.safeParse(products).success) return failure("Part of the file couldn't be read. Check the column mapping.")
  return null
}

/** Dry run for one batch: counts what would be created, updated or left alone. */
export async function previewProductImport(options: ImportOptions, products: ImportProduct[]): Promise<ActionResult<ImportBatchResult>> {
  const blocked = await guard(options, products)
  if (blocked) return blocked

  const supabase = await createClient()
  const source = importStores[options.storeId]
  const existing = await loadExisting(supabase, options.storeId, source, products.map((product) => product.externalId))
  const counts: ImportCounts = { created: 0, updated: 0, unchanged: 0, failed: 0 }
  const categoryCache = new Map<string, string | null>()

  for (const product of products) {
    const current = existing.get(product.externalId)
    if (!current) {
      counts.created += 1
      continue
    }
    // Preview never creates categories: an unknown one just counts as no change.
    const categoryId = product.category ? await resolveCategory(supabase, options.storeId, product.category, false, categoryCache) : null
    if (diffProduct(product, current, categoryId, options.optionName).changed) counts.updated += 1
    else counts.unchanged += 1
  }
  return { ok: true, data: { counts, errors: [] } }
}

/** Applies one batch: creates new products, updates changed ones, never touches stock of existing options. */
export async function applyProductImport(options: ImportOptions, products: ImportProduct[]): Promise<ActionResult<ImportBatchResult>> {
  const blocked = await guard(options, products)
  if (blocked) return blocked

  const supabase = await createClient()
  const source = importStores[options.storeId]
  const existing = await loadExisting(supabase, options.storeId, source, products.map((product) => product.externalId))
  const counts: ImportCounts = { created: 0, updated: 0, unchanged: 0, failed: 0 }
  const errors: ImportRowError[] = []
  const categoryCache = new Map<string, string | null>()
  const optionNames = options.optionName ? [options.optionName] : []

  const optionValues = (variant: ImportProduct["variants"][number]) =>
    options.optionName && variant.optionValue ? { [options.optionName]: variant.optionValue } : {}

  /** Adds options to a product and returns how many were saved. */
  async function insertVariants(productId: string, variants: ImportProduct["variants"], startOrder: number): Promise<number> {
    let saved = 0
    for (const [index, variant] of variants.entries()) {
      const { data, error } = await supabase
        .from("shop_variants")
        .insert({
          product_id: productId,
          sku: variant.sku || null,
          option_values: optionValues(variant),
          price: variant.price,
          rrp: variant.price,
          weight_grams: variant.weightGrams,
          sort_order: startOrder + index * 10,
        })
        .select("id")
        .single()
      if (error) {
        errors.push({ row: variant.row, message: error.code === "23505" ? `Part number ${variant.sku} is already used by another product.` : error.message })
        continue
      }
      saved += 1
      if (variant.stock) {
        await supabase.rpc("set_variant_stock", { p_variant_id: data.id, p_quantity: variant.stock, p_note: "Opening stock from import" })
      }
    }
    return saved
  }

  for (const product of products) {
    try {
      const categoryId = product.category
        ? await resolveCategory(supabase, options.storeId, product.category, options.createCategories, categoryCache)
        : null
      const current = existing.get(product.externalId)

      if (!current) {
        let slug = slugify(product.title)
        let created: { id: string } | null = null
        for (let attempt = 0; attempt < 5 && !created; attempt += 1) {
          const { data, error } = await supabase
            .from("shop_products")
            .insert({
              store_id: options.storeId,
              source,
              external_id: product.externalId,
              slug,
              title: product.title,
              description: product.description,
              brand: product.brand,
              category_id: categoryId,
              images: product.images,
              option_names: optionNames,
              is_active: options.publishNew,
            })
            .select("id")
            .single()
          if (data) created = data
          else if (error?.code === "23505") slug = `${slugify(product.title)}-${slugify(product.externalId).slice(0, 20)}${attempt ? `-${attempt + 1}` : ""}`
          else throw new Error(error?.message ?? "Couldn't create the product.")
        }
        if (!created) throw new Error("Couldn't find a free web address for this product.")
        if ((await insertVariants(created.id, product.variants, 10)) === 0) {
          // None of its options could be saved, so don't leave an empty product behind.
          await supabase.from("shop_products").delete().eq("id", created.id)
          counts.failed += 1
          continue
        }
        counts.created += 1
        continue
      }

      const diff = diffProduct(product, current, categoryId, options.optionName)
      if (!diff.changed) {
        counts.unchanged += 1
        continue
      }
      if (Object.keys(diff.productChanges).length) {
        const { error } = await supabase.from("shop_products").update(diff.productChanges).eq("id", current.id)
        if (error) throw new Error(error.message)
      }
      for (const update of diff.variantUpdates) {
        const { error } = await supabase.from("shop_variants").update(update.changes).eq("id", update.id)
        if (error) throw new Error(error.message)
      }
      if (diff.newVariants.length) {
        if (optionNames.length && current.option_names.length === 0) {
          await supabase.from("shop_products").update({ option_names: optionNames }).eq("id", current.id)
        }
        await insertVariants(current.id, diff.newVariants, (current.shop_variants.length + 1) * 10)
      }
      counts.updated += 1
    } catch (error) {
      counts.failed += 1
      errors.push({ row: product.variants[0]?.row ?? 0, message: error instanceof Error ? error.message : "Couldn't import this product." })
    }
  }

  updateTag(cacheTags.shop)
  return { ok: true, data: { counts, errors } }
}

/**
 * Finishes an import: for a full catalogue, hides products that weren't in the file
 * (never deletes them, so old orders keep their links), then logs the run.
 */
export async function finishProductImport(
  options: ImportOptions,
  summary: { fileName: string; fullCatalogue: boolean; seenIds: string[]; counts: ImportCounts; errors: ImportRowError[] },
): Promise<ActionResult<{ hidden: number }>> {
  if (isDemoMode()) return DEMO_READ_ONLY
  const admin = await getFullAdmin()
  if (!admin) return NOT_ALLOWED
  if (!importOptionsSchema.safeParse(options).success) return failure("Those import settings aren't valid.")

  const supabase = await createClient()
  const source = importStores[options.storeId]
  let hidden = 0

  if (summary.fullCatalogue && summary.seenIds.length) {
    const seen = new Set(summary.seenIds)
    const { data } = await supabase
      .from("shop_products")
      .select("external_id")
      .eq("store_id", options.storeId)
      .eq("source", source)
      .eq("is_active", true)
      .not("external_id", "is", null)
      .limit(20000)
    const missing = (data ?? []).map((row) => row.external_id!).filter((id) => !seen.has(id))
    for (let index = 0; index < missing.length; index += 200) {
      const chunk = missing.slice(index, index + 200)
      const { error } = await supabase
        .from("shop_products")
        .update({ is_active: false })
        .eq("store_id", options.storeId)
        .eq("source", source)
        .in("external_id", chunk)
      if (!error) hidden += chunk.length
    }
  }

  await supabase.from("import_runs").insert({
    store_id: options.storeId,
    file_name: summary.fileName.slice(0, 200),
    full_catalogue: summary.fullCatalogue,
    counts: { ...summary.counts, hidden },
    errors: summary.errors.slice(0, 200) as unknown as Json,
    created_by: admin.id,
  })

  updateTag(cacheTags.shop)
  revalidatePath("/admin/shop")
  revalidatePath("/admin/shop/import")
  return { ok: true, data: { hidden } }
}
