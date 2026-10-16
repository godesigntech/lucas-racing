"use server"

import { revalidatePath, updateTag } from "next/cache"

import { databaseError, failure, validationError } from "@/lib/actions/result"
import { cacheTags } from "@/lib/data/cache-tags"
import { DEMO_READ_ONLY, isDemoMode } from "@/lib/demo/mode"
import { createClient } from "@/lib/supabase/server"
import {
  newShopProductSchema,
  productImagesSchema,
  shopCategorySchema,
  shopProductSchema,
  shopVariantSchema,
  stockCountSchema,
  type NewShopProductValues,
  type ShopCategoryValues,
  type ShopProductValues,
  type ShopVariantValues,
  type StockCountValues,
} from "@/lib/validations/shop"
import type { ActionResult } from "@/types/account"

import { getFullAdmin, NOT_ALLOWED } from "./guard"

/** Shop pages read categories from a tagged cache; product pages read live. */
function refreshShop(...paths: string[]) {
  updateTag(cacheTags.shop)
  revalidatePath("/admin/shop")
  for (const path of paths) revalidatePath(path)
}

const SLUG_TAKEN = "23505"

// Products ------------------------------------------------------------------

/** Creates a product with one variant at the given price, ready to fill in. */
export async function createShopProduct(values: NewShopProductValues): Promise<ActionResult<{ id: string }>> {
  if (isDemoMode()) return DEMO_READ_ONLY
  if (!(await getFullAdmin())) return NOT_ALLOWED
  const parsed = newShopProductSchema.safeParse(values)
  if (!parsed.success) return validationError(parsed.error)

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("shop_products")
    .insert({ store_id: parsed.data.storeId, title: parsed.data.title, slug: parsed.data.slug, is_active: false })
    .select("id")
    .single()
  if (error?.code === SLUG_TAKEN) return { ok: false, message: "Please check the highlighted fields.", fieldErrors: { slug: "Another product already uses this web address." } }
  if (error) return databaseError(error, "We couldn't create the product.")

  const { error: variantError } = await supabase.from("shop_variants").insert({ product_id: data.id, price: parsed.data.price })
  if (variantError) return databaseError(variantError, "The product was created, but its price wasn't saved.")

  refreshShop()
  return { ok: true, message: "Product created. Add photos, details and stock, then switch it on.", data: { id: data.id } }
}

export async function updateShopProduct(id: string, values: ShopProductValues): Promise<ActionResult> {
  if (isDemoMode()) return DEMO_READ_ONLY
  if (!(await getFullAdmin())) return NOT_ALLOWED
  const parsed = shopProductSchema.safeParse(values)
  if (!parsed.success) return validationError(parsed.error)
  const data = parsed.data

  const supabase = await createClient()
  const { error } = await supabase
    .from("shop_products")
    .update({
      store_id: data.storeId,
      category_id: data.categoryId,
      title: data.title,
      slug: data.slug,
      brand: data.brand,
      description: data.description,
      specs: data.specs,
      option_names: data.optionNames,
      external_url: data.externalUrl || null,
      is_active: data.isActive,
      featured: data.featured,
      customisable: data.customisable,
      sort_order: data.sortOrder,
    })
    .eq("id", id)
  if (error?.code === SLUG_TAKEN) return { ok: false, message: "Please check the highlighted fields.", fieldErrors: { slug: "Another product already uses this web address." } }
  if (error) return databaseError(error, "We couldn't save the product.")

  refreshShop(`/admin/shop/${id}`, `/shop/p/${data.slug}`)
  return { ok: true, message: "Product saved." }
}

/** Saves the photo list in display order; the first is the main photo. */
export async function setShopProductImages(id: string, images: string[]): Promise<ActionResult> {
  if (isDemoMode()) return DEMO_READ_ONLY
  if (!(await getFullAdmin())) return NOT_ALLOWED
  const parsed = productImagesSchema.safeParse(images)
  if (!parsed.success) return failure(parsed.error.issues[0]?.message ?? "Those photos aren't valid.")

  const supabase = await createClient()
  const { error } = await supabase.from("shop_products").update({ images: parsed.data }).eq("id", id)
  if (error) return databaseError(error, "We couldn't save the photos.")

  refreshShop(`/admin/shop/${id}`)
  return { ok: true, message: "Photos saved." }
}

/** Has any of these variants been ordered? Ordered products are hidden, not deleted, so orders keep their links. */
async function hasOrders(supabase: Awaited<ReturnType<typeof createClient>>, variantIds: string[]) {
  if (variantIds.length === 0) return false
  const { count } = await supabase.from("order_items").select("id", { count: "exact", head: true }).in("shop_variant_id", variantIds)
  return (count ?? 0) > 0
}

export async function deleteShopProduct(id: string): Promise<ActionResult> {
  if (isDemoMode()) return DEMO_READ_ONLY
  if (!(await getFullAdmin())) return NOT_ALLOWED

  const supabase = await createClient()
  const { data: variants } = await supabase.from("shop_variants").select("id").eq("product_id", id)
  if (await hasOrders(supabase, (variants ?? []).map((variant) => variant.id))) {
    return failure("This product has been ordered, so it can't be deleted. Switch it off to hide it instead.")
  }
  const { error } = await supabase.from("shop_products").delete().eq("id", id)
  if (error) return databaseError(error, "We couldn't delete the product.")

  refreshShop()
  return { ok: true, message: "Product deleted." }
}

// Variants --------------------------------------------------------------------

/** Adds a variant when `variantId` is null, otherwise updates it. New variants start with `initialStock`. */
export async function saveShopVariant(
  productId: string,
  variantId: string | null,
  values: ShopVariantValues,
  initialStock = 0,
): Promise<ActionResult> {
  if (isDemoMode()) return DEMO_READ_ONLY
  if (!(await getFullAdmin())) return NOT_ALLOWED
  const parsed = shopVariantSchema.safeParse(values)
  if (!parsed.success) return validationError(parsed.error)
  const data = parsed.data

  const row = {
    option_values: data.options,
    sku: data.sku || null,
    price: data.price,
    compare_at_price: data.compareAtPrice,
    track_stock: data.trackStock,
    allow_backorder: data.allowBackorder,
    weight_grams: data.weightGrams,
    is_active: data.isActive,
    sort_order: data.sortOrder,
  }

  const supabase = await createClient()
  if (variantId) {
    const { error } = await supabase.from("shop_variants").update(row).eq("id", variantId).eq("product_id", productId)
    if (error?.code === SLUG_TAKEN) return { ok: false, message: "Please check the highlighted fields.", fieldErrors: { sku: "Another product already uses this part number." } }
    if (error) return databaseError(error, "We couldn't save that option.")
  } else {
    const { data: created, error } = await supabase.from("shop_variants").insert({ ...row, product_id: productId }).select("id").single()
    if (error?.code === SLUG_TAKEN) return { ok: false, message: "Please check the highlighted fields.", fieldErrors: { sku: "Another product already uses this part number." } }
    if (error) return databaseError(error, "We couldn't add that option.")
    if (initialStock !== 0) {
      const { error: stockError } = await supabase.rpc("set_variant_stock", { p_variant_id: created.id, p_quantity: initialStock, p_note: "Opening stock" })
      if (stockError) return databaseError(stockError, "The option was added, but its stock wasn't set.")
    }
  }

  refreshShop(`/admin/shop/${productId}`)
  return { ok: true, message: variantId ? "Option saved." : "Option added." }
}

export async function deleteShopVariant(productId: string, variantId: string): Promise<ActionResult> {
  if (isDemoMode()) return DEMO_READ_ONLY
  if (!(await getFullAdmin())) return NOT_ALLOWED

  const supabase = await createClient()
  if (await hasOrders(supabase, [variantId])) {
    return failure("This option has been ordered, so it can't be deleted. Switch it off instead.")
  }
  const { count } = await supabase.from("shop_variants").select("id", { count: "exact", head: true }).eq("product_id", productId)
  if ((count ?? 0) <= 1) return failure("A product needs at least one option. Delete the product instead.")

  const { error } = await supabase.from("shop_variants").delete().eq("id", variantId).eq("product_id", productId)
  if (error) return databaseError(error, "We couldn't delete that option.")

  refreshShop(`/admin/shop/${productId}`)
  return { ok: true, message: "Option deleted." }
}

/** Sets the counted stock level; the change is logged as a manual adjustment. */
export async function setVariantStock(productId: string, variantId: string, values: StockCountValues): Promise<ActionResult> {
  if (isDemoMode()) return DEMO_READ_ONLY
  if (!(await getFullAdmin())) return NOT_ALLOWED
  const parsed = stockCountSchema.safeParse(values)
  if (!parsed.success) return validationError(parsed.error)

  const supabase = await createClient()
  const { error } = await supabase.rpc("set_variant_stock", {
    p_variant_id: variantId,
    p_quantity: parsed.data.quantity,
    p_note: parsed.data.note,
  })
  if (error) return databaseError(error, "We couldn't update the stock.")

  refreshShop(`/admin/shop/${productId}`)
  return { ok: true, message: "Stock updated." }
}

// Categories ------------------------------------------------------------------

export async function saveShopCategory(id: string | null, values: ShopCategoryValues): Promise<ActionResult> {
  if (isDemoMode()) return DEMO_READ_ONLY
  if (!(await getFullAdmin())) return NOT_ALLOWED
  const parsed = shopCategorySchema.safeParse(values)
  if (!parsed.success) return validationError(parsed.error)
  const data = parsed.data

  const row = {
    store_id: data.storeId,
    name: data.name,
    slug: data.slug,
    description: data.description,
    is_active: data.isActive,
    sort_order: data.sortOrder,
  }
  const supabase = await createClient()
  const { error } = id
    ? await supabase.from("shop_categories").update(row).eq("id", id)
    : await supabase.from("shop_categories").insert(row)
  if (error?.code === SLUG_TAKEN) return { ok: false, message: "Please check the highlighted fields.", fieldErrors: { slug: "This shop already has a category with that web address." } }
  if (error) return databaseError(error, "We couldn't save the category.")

  refreshShop("/admin/shop/categories")
  return { ok: true, message: id ? "Category saved." : "Category added." }
}

export async function deleteShopCategory(id: string): Promise<ActionResult> {
  if (isDemoMode()) return DEMO_READ_ONLY
  if (!(await getFullAdmin())) return NOT_ALLOWED

  const supabase = await createClient()
  const { error } = await supabase.from("shop_categories").delete().eq("id", id)
  if (error) return databaseError(error, "We couldn't delete the category.")

  refreshShop("/admin/shop/categories")
  return { ok: true, message: "Category deleted. Its products are now uncategorised." }
}
