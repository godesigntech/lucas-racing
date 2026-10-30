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
    // Production scheduling. Only asked for when the basket holds a helmet, and only
    // trusted as far as the dates the workshop published — place_order() re-checks the
    // week's capacity, the blackouts and the turnaround before it books anything.
    productionStartDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a production start week")
      .optional(),
    rushTier: z.string().trim().max(60).optional(),
    /** True when the basket holds a helmet, so a start week has to be chosen. */
    needsProduction: z.boolean().optional(),
    /**
     * True when the basket holds a custom helmet. Helmet orders need a complete
     * profile (phone and full address) whatever the delivery method, so the
     * workshop can always reach the customer. The server works this out from the
     * basket itself rather than trusting the browser.
     */
    hasHelmet: z.boolean().optional(),
  })
  .superRefine((values, ctx) => {
    if (values.needsProduction && !values.productionStartDate) {
      ctx.addIssue({ code: "custom", path: ["productionStartDate"], message: "Choose which week we should start" })
    }
    if (values.hasHelmet && !values.phone) {
      ctx.addIssue({ code: "custom", path: ["phone"], message: "Enter a phone number so we can reach you about your helmet" })
    }
    if (!values.requiresAddress && !values.hasHelmet) return
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
const partKind = z.enum(["colour", "film", "chrome", "metallic"])
const hex = z.string().regex(/^#[0-9a-f]{6}$/i)
const logoPath = z.string().regex(/^[0-9a-f-]{36}\/[0-9a-f-]{36}\.(png|jpg|webp)$/, "That logo isn't valid")

/** A treatment on one editable region. The server re-checks it against the template. */
const regionTreatment = z.object({ kind: partKind, value: z.string().trim().min(1).max(80) })

const personalItem = z.object({
  kind: z.enum(["name", "number", "initials", "flag", "text"]),
  value: z.string().trim().max(24, "Text on a helmet can be up to 24 characters"),
  position: placement,
  colour: hex.optional(),
  font: z.string().trim().max(20).optional(),
  scale: z.number().min(0.5).max(2).optional(),
  rotation: z.number().min(-45).max(45).optional(),
})

const logoItem = z.object({
  path: logoPath,
  position: placement,
  scale: z.number().min(0.2).max(2).optional(),
  rotation: z.number().min(-180).max(180).optional(),
})

export const helmetItemSchema = z.object({
  kind: z.literal("helmet"),
  slug: z.string().min(1),
  quantity: z.number().int().min(1).max(10),
  config: z.object({
    v: z.literal("2").optional(),
    model: z.string(),
    size: z.string(),
    route: z.enum(["new", "own"]).optional(),
    template: z.string(),
    finish: z.enum(["gloss", "satin", "matte"]),
    baseKind: partKind,
    base: z.string(),
    graphicKind: partKind.optional(),
    graphic: z.string().optional(),
    accentKind: partKind.optional(),
    accent: z.string().optional(),
    trim: z.string(),

    aero: z.string().trim().max(60).optional(),
    visor: z.string().trim().max(60).optional(),
    visorStrip: z
      .object({
        enabled: z.boolean(),
        colour: hex,
        text: z.string().trim().max(40, "Visor strip text can be up to 40 characters"),
        textColour: hex.optional(),
        font: z.string().trim().max(20).optional(),
      })
      .optional(),
    regions: z.record(z.string().max(40), regionTreatment).optional(),
    personalisation: z.array(personalItem).max(6, "You can add up to 6 pieces of personalisation").optional(),
    logos: z.array(logoItem).max(4, "You can add up to 4 logos").optional(),
    eyeportTrim: z.string().regex(/^#[0-9a-f]{6}$/i).optional(),
    baseTrim: z.string().regex(/^#[0-9a-f]{6}$/i).optional(),
    grille1: z.string().regex(/^#[0-9a-f]{6}$/i).optional(),
    grille2: z.string().regex(/^#[0-9a-f]{6}$/i).optional(),
    visorScrewLeft: z.string().regex(/^#[0-9a-f]{6}$/i).optional(),
    visorScrewRight: z.string().regex(/^#[0-9a-f]{6}$/i).optional(),

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

export const partFinishSchema = z.object({
  type: z.enum(["paint", "film", "chrome"]),
  value: z.string().trim().min(1).max(80),
  lacquer: z.string().trim().max(40),
})

export const productItemSchema = z.object({
  kind: z.literal("product"),
  variantId: z.uuid(),
  quantity: z.number().int().min(1).max(99),
  finish: partFinishSchema.optional(),
})

export const basketItemSchema = z.discriminatedUnion("kind", [helmetItemSchema, productItemSchema])

export const placeOrderSchema = z.object({
  items: z.array(basketItemSchema).min(1, "Your basket is empty").max(50),
  checkout: checkoutSchema,
})

export type PlaceOrderInput = z.infer<typeof placeOrderSchema>
