import { NextResponse, type NextRequest } from "next/server"

import { staffShop } from "@/lib/auth/roles"
import { getCurrentUser } from "@/lib/auth/session"
import { productsCsv, type ExportProduct } from "@/lib/shop/csv-export"
import { createClient } from "@/lib/supabase/server"
import { storeIds } from "@/lib/validations/shop"
import type { StoreId } from "@/types/shop"

/**
 * Admin > Shop products > Export CSV: the products in one shop (or every shop), in the same
 * columns as Import CSV, so a file can be exported, edited in Excel and imported again.
 * A product with options (sizes, colours) is one row per option, grouped by its part number.
 */
export async function GET(request: NextRequest) {
  const user = await getCurrentUser()
  const ownShop = staffShop(user?.role)
  if (!user || (user.role !== "admin" && !ownShop)) return new NextResponse("Not allowed", { status: 403 })

  const asked = request.nextUrl.searchParams.get("store") ?? ""
  // Shop staff only ever get their own shop.
  const store = ownShop ?? ((storeIds as readonly string[]).includes(asked) ? (asked as StoreId) : null)

  const supabase = await createClient()
  const { data: categories, error: categoryError } = await supabase.from("shop_categories").select("id, name, parent_id")
  if (categoryError) return new NextResponse("Couldn't load categories", { status: 500 })

  const products: ExportProduct[] = []
  for (let from = 0; ; from += 1000) {
    let query = supabase
      .from("shop_products")
      .select("store_id, external_id, slug, title, brand, description, images, is_active, category_id, option_names, shop_variants(sku, option_values, price, stock_quantity, track_stock, weight_grams, is_active, sort_order)")
      .order("store_id")
      .order("sort_order")
      .order("title")
      .range(from, from + 999)
    if (store) query = query.eq("store_id", store)
    const { data, error } = await query
    if (error) return new NextResponse("Couldn't load products", { status: 500 })
    products.push(...((data ?? []) as unknown as ExportProduct[]))
    if (!data || data.length < 1000) break
  }

  const csv = productsCsv(products, categories ?? [])
  const date = new Date().toISOString().slice(0, 10)
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="lucas-racing-${store ?? "all-shops"}-products-${date}.csv"`,
      "Cache-Control": "no-store",
    },
  })
}
