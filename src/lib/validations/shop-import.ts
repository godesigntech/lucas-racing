import { z } from "zod"

/** Shops that can be filled from a CSV file, and the source their products are tagged with. */
export const importStores = {
  "ms-kart": "ms_kart_feed",
  delta: "delta_feed",
} as const
export type ImportStoreId = keyof typeof importStores

/** One option (variant) of an imported product, from one CSV row. */
export const importVariantSchema = z.object({
  row: z.number().int(),
  sku: z.string().trim().max(60),
  optionValue: z.string().trim().max(60),
  price: z.number().min(0).max(100000),
  stock: z.number().int().min(0).max(100000).nullable(),
  weightGrams: z.number().int().min(0).max(1000000).nullable(),
})

/** A product built from one or more CSV rows (rows sharing a group become its options). */
export const importProductSchema = z.object({
  externalId: z.string().trim().min(1).max(120),
  title: z.string().trim().min(2).max(160),
  description: z.string().trim().max(8000),
  brand: z.string().trim().max(80),
  /** "Chassis" or "Chassis > Steering" for a subcategory. */
  category: z.string().trim().max(160),
  images: z.array(z.string().regex(/^https?:\/\/\S+$/)).max(12),
  variants: z.array(importVariantSchema).min(1).max(100),
})
export type ImportProduct = z.infer<typeof importProductSchema>

export const importOptionsSchema = z.object({
  storeId: z.enum(Object.keys(importStores) as [ImportStoreId, ...ImportStoreId[]]),
  /** Name of the option grouped rows differ by, e.g. "Size". Empty for one product per row. */
  optionName: z.string().trim().max(30),
  createCategories: z.boolean(),
  /** New products go on sale straight away instead of starting hidden. */
  publishNew: z.boolean(),
})
export type ImportOptions = z.infer<typeof importOptionsSchema>

export const IMPORT_BATCH = 50
export const importBatchSchema = z.array(importProductSchema).min(1).max(IMPORT_BATCH)

export interface ImportCounts {
  created: number
  updated: number
  unchanged: number
  failed: number
}

export interface ImportRowError {
  row: number
  message: string
}
