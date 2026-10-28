import { z } from "zod"

import { optionGroupKeys } from "@/types/catalog"
import { filmPatterns, helmetFinishes, helmetLayouts } from "@/types/helmet"
import { orderStatuses, paymentStatuses } from "@/types/order"
import { productBadges, productCategoryIds } from "@/types/product"
import { socialIcons } from "@/types/settings"

const price = z.number({ error: "Enter a price" }).min(0, "Price can't be negative").max(100000, "That price looks too high")
const hexColour = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Use a colour like #1f5bd8")
const slug = z
  .string()
  .trim()
  .min(2, "Use at least 2 characters")
  .max(60)
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Use lowercase letters, numbers and dashes only")

// Orders --------------------------------------------------------------------

export const orderStatusUpdateSchema = z.object({
  status: z.enum(orderStatuses),
  paymentStatus: z.enum(paymentStatuses),
  note: z.string().trim().max(500, "Keep the note under 500 characters"),
})
export type OrderStatusUpdateValues = z.infer<typeof orderStatusUpdateSchema>

export const adminNotesSchema = z.object({
  adminNotes: z.string().trim().max(4000, "Keep notes under 4,000 characters"),
})
export type AdminNotesValues = z.infer<typeof adminNotesSchema>

// Products ------------------------------------------------------------------

export const productSchema = z
  .object({
    name: z.string().trim().min(2, "Enter a name").max(60),
    tagline: z.string().trim().max(120),
    description: z.string().trim().max(2000),
    category: z.enum(productCategoryIds),
    models: z.array(z.string()).min(1, "Choose at least one helmet"),
    priceOnRequest: z.boolean(),
    basePrice: price,
    badge: z.enum([...productBadges, "none"]),
    features: z.string().max(2000),
    specs: z.array(z.object({ label: z.string().trim().max(40), value: z.string().trim().max(120) })).max(12),
    look: z.object({
      layout: z.enum(helmetLayouts),
      finish: z.enum(helmetFinishes),
      base: hexColour,
      graphic: hexColour,
      accent: hexColour,
      trim: hexColour,
      film: z.enum(filmPatterns),
      spoiler: z.boolean(),
      number: z.string().trim().max(3),
    }),
    isActive: z.boolean(),
    sortOrder: z.number().int().min(0).max(999),
  })
export type ProductValues = z.infer<typeof productSchema>

export const newProductSchema = z.object({
  name: z.string().trim().min(2, "Enter a name").max(60),
  category: z.enum(productCategoryIds),
})
export type NewProductValues = z.infer<typeof newProductSchema>

// Films ---------------------------------------------------------------------

export const filmSchema = z.object({
  id: slug,
  name: z.string().trim().min(2, "Enter a name").max(60),
  category: z.string().trim().min(2, "Enter a category").max(40),
  code: z.string().trim().max(30),
  pattern: z.enum(filmPatterns),
  textureUrl: z.url().nullable(),
  thumbUrl: z.url().nullable(),
  price,
  isActive: z.boolean(),
  sortOrder: z.number().int().min(0).max(999),
})
export type FilmValues = z.infer<typeof filmSchema>

export const filmCategoryPriceSchema = z.object({
  category: z.string().trim().min(1).max(40),
  price,
})
export type FilmCategoryPriceValues = z.infer<typeof filmCategoryPriceSchema>

// Pricing -------------------------------------------------------------------

export const helmetModelSchema = z.object({
  name: z.string().trim().min(2).max(60),
  summary: z.string().trim().max(200),
  newHelmetPrice: price,
  sizes: z.array(z.string()).min(1, "Choose at least one size"),
  isActive: z.boolean(),
})
export type HelmetModelValues = z.infer<typeof helmetModelSchema>

export const optionGroupSchema = z.object({
  group: z.enum(optionGroupKeys),
  options: z
    .array(
      z.object({
        value: z.string(),
        label: z.string().trim().min(1, "Enter a label").max(60),
        // Blank means the price is still to be agreed with the client. The option stays
        // visible in the builder but checkout refuses it, so nothing is undercharged.
        price: price.nullable(),
        isActive: z.boolean(),
      }),
    )
    .min(1),
})
export type OptionGroupValues = z.infer<typeof optionGroupSchema>

// Settings ------------------------------------------------------------------

const optionalEmail = z.union([z.literal(""), z.email("Enter a valid email address")])

export const businessSchema = z.object({
  businessName: z.string().trim().min(2, "Enter the business name").max(80),
  partnerName: z.string().trim().max(80),
  contactEmail: optionalEmail,
  contactPhone: z.string().trim().max(40),
  location: z.string().trim().max(120),
  addressNote: z.string().trim().max(200),
  openingHours: z.string().trim().max(120),
  eventName: z.string().trim().max(80),
  eventDates: z.string().trim().max(80),
  showEventBanner: z.boolean(),
})
export type BusinessValues = z.infer<typeof businessSchema>

export const socialLinksSchema = z.object({
  links: z
    .array(
      z.object({
        icon: z.enum(socialIcons),
        href: z.url({ protocol: /^https$/, error: "Enter a full https:// link" }),
      }),
    )
    .max(8),
})
export type SocialLinksValues = z.infer<typeof socialLinksSchema>

export const deliveryMethodsSchema = z.object({
  methods: z
    .array(
      z.object({
        id: z.string(),
        label: z.string().trim().min(2, "Enter a name").max(60),
        description: z.string().trim().max(160),
        price,
        requiresAddress: z.boolean(),
        active: z.boolean(),
      }),
    )
    .min(1, "Keep at least one delivery option")
    .max(8),
})
export type DeliveryMethodsValues = z.infer<typeof deliveryMethodsSchema>

export const staffRoles = ["admin", "sales", "teamwear"] as const

export const adminEmailSchema = z.object({
  email: z.email("Enter a valid email address").trim().toLowerCase(),
  role: z.enum(staffRoles),
})
export type AdminEmailValues = z.infer<typeof adminEmailSchema>
