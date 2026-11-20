import Papa from "papaparse"

// Shop products as a CSV in the same columns as Import CSV (src/lib/shop/csv-import.ts),
// so an exported file can be edited and imported again. Kept free of server-only code.

export type ExportVariant = { sku: string | null; option_values: unknown; price: number; stock_quantity: number; track_stock: boolean; weight_grams: number | null; is_active: boolean; sort_order: number }
export type ExportProduct = {
  store_id: string
  external_id: string | null
  slug: string
  title: string
  brand: string
  description: string
  images: string[]
  is_active: boolean
  category_id: string | null
  option_names: string[]
  shop_variants: ExportVariant[]
}

export type ExportCategory = { id: string; name: string; parent_id: string | null }

/** One row per option; a product with several options is grouped by its part number. */
export function productsCsv(products: ExportProduct[], categories: ExportCategory[]): string {
  const categoryById = new Map(categories.map((category) => [category.id, category]))
  const rows = products.flatMap((product) => {
    const category = product.category_id ? categoryById.get(product.category_id) : undefined
    const parent = category?.parent_id ? categoryById.get(category.parent_id) : undefined
    const [main, sub] = parent ? [parent.name, category!.name] : [category?.name ?? "", ""]
    const partNumber = product.external_id || product.slug
    const variants = [...product.shop_variants].sort((a, b) => a.sort_order - b.sort_order)
    const several = variants.length > 1

    return variants.map((variant) => {
      const values = variant.option_values && typeof variant.option_values === "object" ? Object.values(variant.option_values as Record<string, unknown>) : []
      return {
        "Part number": several ? variant.sku || `${partNumber}-${values.join("-")}` : partNumber,
        // The option's own part number, which is how Import CSV matches it next time.
        "Variant SKU": variant.sku ?? "",
        Name: product.title,
        Price: Number(variant.price).toFixed(2),
        Brand: product.brand,
        Category: main,
        Subcategory: sub,
        Description: product.description,
        "Image links": product.images.join(" | "),
        Group: several ? partNumber : "",
        // Two options (e.g. size and colour) share one cell: "M / Black".
        Option: several ? values.map(String).join(" / ") : "",
        "Option name": several ? product.option_names.join(" / ") : "",
        Stock: variant.track_stock ? String(variant.stock_quantity) : "",
        "Weight (grams)": variant.weight_grams === null ? "" : String(variant.weight_grams),
        "On the website": product.is_active && variant.is_active ? "Yes" : "No",
        Shop: product.store_id,
      }
    })
  })

  // The byte-order mark makes Excel read £ and other characters correctly.
  return "﻿" + Papa.unparse(rows, { newline: "\r\n" })
}
