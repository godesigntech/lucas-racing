import { z } from "zod"

export const storeIds = ["ms-kart", "teamwear", "hydrokarts-parts", "delta"] as const

const slug = z
  .string()
  .trim()
  .min(2, "Use at least 2 characters")
  .max(80, "Keep it under 80 characters")
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Use lowercase letters, numbers and dashes only")

const money = z.number({ error: "Enter a price" }).min(0, "Price can't be negative").max(100000, "That price looks too high")

export const newShopProductSchema = z.object({
  storeId: z.enum(storeIds, { error: "Choose a shop" }),
  title: z.string().trim().min(2, "Enter the product name").max(160),
  slug,
  price: money,
})
export type NewShopProductValues = z.infer<typeof newShopProductSchema>

export const shopProductSchema = z.object({
  storeId: z.enum(storeIds, { error: "Choose a shop" }),
  categoryId: z.uuid().nullable(),
  title: z.string().trim().min(2, "Enter the product name").max(160),
  slug,
  brand: z.string().trim().max(80),
  description: z.string().trim().max(8000, "Keep the description under 8,000 characters"),
  specs: z
    .array(z.object({ label: z.string().trim().min(1, "Add a label").max(60), value: z.string().trim().min(1, "Add a value").max(200) }))
    .max(30, "Up to 30 specifications"),
  optionNames: z.array(z.string().trim().min(1).max(30)).max(3, "Up to 3 options, e.g. Size, Colour"),
  externalUrl: z
    .string()
    .trim()
    .refine((value) => value === "" || /^https:\/\//.test(value), { error: "Use a full https:// link" }),
  isActive: z.boolean(),
  featured: z.boolean(),
  customisable: z.boolean(),
  /** Finishes a customisable part can be ordered in (priced from the helmet price list). */
  customFinishes: z.array(z.enum(["paint", "film", "chrome"])).max(3),
  customFee: money,
  sortOrder: z.number({ error: "Enter a number" }).int().min(0).max(100000),
}).refine((values) => !values.customisable || values.customFinishes.length > 0, {
  error: "Choose at least one finish",
  path: ["customFinishes"],
})
export type ShopProductValues = z.infer<typeof shopProductSchema>

// Uploaded photos (our storage) or imported ones (the supplier's site).
const imageUrl = z.string().regex(/^https:\/\/\S+$/, "Photos must be https links")
export const productImagesSchema = z.array(imageUrl).max(12, "Up to 12 photos")

export const shopVariantSchema = z.object({
  options: z.record(z.string(), z.string().trim().max(60)),
  sku: z.string().trim().max(60),
  price: money,
  compareAtPrice: money.nullable(),
  trackStock: z.boolean(),
  allowBackorder: z.boolean(),
  weightGrams: z.number().int().min(0).max(1000000).nullable(),
  isActive: z.boolean(),
  sortOrder: z.number().int().min(0).max(100000),
})
export type ShopVariantValues = z.infer<typeof shopVariantSchema>

export const stockCountSchema = z.object({
  quantity: z.number({ error: "Enter a number" }).int("Whole numbers only").min(-100000).max(100000),
  note: z.string().trim().max(500),
})
export type StockCountValues = z.infer<typeof stockCountSchema>

export const shopCategorySchema = z.object({
  storeId: z.enum(storeIds, { error: "Choose a shop" }),
  name: z.string().trim().min(1, "Enter a name").max(80),
  slug,
  description: z.string().trim().max(500),
  isActive: z.boolean(),
  sortOrder: z.number({ error: "Enter a number" }).int().min(0).max(100000),
})
export type ShopCategoryValues = z.infer<typeof shopCategorySchema>
