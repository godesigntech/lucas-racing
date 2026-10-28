import { z } from "zod"

// Admin forms for the 16-step builder's catalogue: design templates and their editable
// regions, aero kits, visors and per-size pricing. Every price may be left blank, which
// means "not agreed yet" — the option still shows in the builder, but place_order()
// refuses to sell it.

const slug = z
  .string()
  .trim()
  .min(1, "Enter an id")
  .max(60)
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Use lowercase letters, numbers and hyphens")

const optionalPrice = z
  .number({ error: "Enter a price" })
  .min(0, "Price can't be negative")
  .max(100000, "That price looks too high")
  .nullable()

const hex = z
  .string()
  .trim()
  .regex(/^#[0-9a-f]{6}$/i, "Use a hex colour like #1f5bd8")

// Optional text stays a plain string in the form — blank, not null — so react-hook-form
// sees the same shape going in and coming out. The actions turn "" into null.
const url = z.string().trim().max(400)

export const templateRegionSchema = z.object({
  key: slug,
  label: z.string().trim().min(1, "Enter a name").max(60),
  kind: z.enum(["fill", "pinstripe", "trim"]),
  maskUrl: url,
  svgElementId: z.string().trim().max(120),
  defaultColour: hex,
  allowsFilm: z.boolean(),
  allowsChrome: z.boolean(),
  allowsMetallic: z.boolean(),
  sortOrder: z.number().int().min(0).max(9999),
})
export type TemplateRegionValues = z.infer<typeof templateRegionSchema>

export const designTemplateSchema = z.object({
  svgUrl: url,
  graphicMaskUrl: url,
  accentMaskUrl: url,
  thumbnailUrl: url,
  artworkStatus: z.enum(["ready", "pending", "placeholder"]),
  isActive: z.boolean(),
  sortOrder: z.number().int().min(0).max(9999),
})
export type DesignTemplateValues = z.infer<typeof designTemplateSchema>

export const aeroKitSchema = z.object({
  id: slug,
  modelId: z.string().trim().min(1, "Choose a helmet"),
  name: z.string().trim().min(1, "Enter a name").max(80),
  summary: z.string().trim().max(200),
  // The mesh in the model's .glb this kit shows; blank means the standard shell.
  meshName: z.string().trim().max(80),
  price: optionalPrice,
  isActive: z.boolean(),
  sortOrder: z.number().int().min(0).max(9999),
})
export type AeroKitValues = z.infer<typeof aeroKitSchema>

export const visorSchema = z.object({
  id: slug,
  modelId: z.string().trim().min(1, "Choose a helmet"),
  name: z.string().trim().min(1, "Enter a name").max(80),
  kind: z.enum(["clear", "smoked", "coloured", "iridium"]),
  tint: hex,
  opacity: z.number().min(0, "0 to 1").max(1, "0 to 1"),
  metalness: z.number().min(0, "0 to 1").max(1, "0 to 1"),
  price: optionalPrice,
  isActive: z.boolean(),
  sortOrder: z.number().int().min(0).max(9999),
})
export type VisorValues = z.infer<typeof visorSchema>

export const helmetSizesSchema = z.object({
  modelId: z.string().trim().min(1),
  sizes: z
    .array(
      z.object({
        size: z.string().trim().min(1, "Enter a size").max(10),
        price: optionalPrice,
        isActive: z.boolean(),
        sortOrder: z.number().int().min(0).max(9999),
      }),
    )
    .min(1, "A helmet needs at least one size"),
})
export type HelmetSizesValues = z.infer<typeof helmetSizesSchema>
