import { z } from "zod"

const phone = z
  .string()
  .trim()
  .refine((value) => value === "" || /^[+\d][\d\s()-]{6,}$/.test(value), { error: "Enter a valid phone number" })

export const addressSchema = z.object({
  line1: z.string().trim().max(120),
  line2: z.string().trim().max(120),
  city: z.string().trim().max(80),
  county: z.string().trim().max(80),
  postcode: z.string().trim().max(12),
  country: z.string().trim().max(60),
})

export const checkoutSchema = z
  .object({
    name: z.string().trim().min(2, "Enter your full name").max(80),
    email: z.email("Enter a valid email address").trim(),
    phone,
    deliveryMethod: z.string().min(1, "Choose a delivery option"),
    requiresAddress: z.boolean(),
    address: addressSchema,
    notes: z.string().trim().max(2000, "Keep notes under 2,000 characters"),
    saveDetails: z.boolean(),
  })
  .superRefine((values, ctx) => {
    if (!values.requiresAddress) return
    const required: [keyof typeof values.address, string][] = [
      ["line1", "Enter the first line of your address"],
      ["city", "Enter your town or city"],
      ["postcode", "Enter your postcode"],
    ]
    for (const [field, message] of required) {
      if (!values.address[field]) ctx.addIssue({ code: "custom", path: ["address", field], message })
    }
  })

export type CheckoutValues = z.infer<typeof checkoutSchema>

const placement = z.enum(["sides", "left", "right", "front", "back", "top"])

export const basketItemSchema = z.object({
  slug: z.string().min(1),
  quantity: z.number().int().min(1).max(10),
  config: z.object({
    model: z.string(),
    size: z.string(),
    template: z.string(),
    finish: z.enum(["gloss", "satin", "matte"]),
    baseKind: z.enum(["colour", "film", "chrome"]),
    base: z.string(),
    graphicKind: z.enum(["colour", "film", "chrome"]).optional(),
    graphic: z.string().optional(),
    accentKind: z.enum(["colour", "film", "chrome"]).optional(),
    accent: z.string().optional(),
    trim: z.string(),
    spoiler: z.enum(["yes", "no"]),
    namePosition: placement.optional(),
    numberPosition: placement.optional(),
    logoPosition: placement.optional(),
    riderName: z.string().trim().max(24, "Names on helmets can be up to 24 characters").optional(),
    raceNumber: z
      .string()
      .trim()
      .regex(/^[0-9A-Za-z]{0,3}$/, "Race numbers can be up to 3 letters or digits")
      .optional(),
    logo: z
      .string()
      .regex(/^[0-9a-f-]{36}\/[0-9a-f-]{36}\.(png|jpg|webp)$/, "That logo isn't valid")
      .optional(),
  }),
})

export const placeOrderSchema = z.object({
  items: z.array(basketItemSchema).min(1, "Your basket is empty").max(20),
  checkout: checkoutSchema,
})

export type PlaceOrderInput = z.infer<typeof placeOrderSchema>
