import { z } from "zod"

import { addressSchema } from "./checkout"

/** Paint finishes the customer would like on their own helmet (any mix). */
export const ownHelmetFinishes = ["standard", "metallic", "chrome"] as const
export type OwnHelmetFinish = (typeof ownHelmetFinishes)[number]
export const ownHelmetFinishLabels: Record<OwnHelmetFinish, string> = { standard: "Standard", metallic: "Metallic", chrome: "Chrome" }

export const ownHelmetLacquers = ["gloss", "matt"] as const
export type OwnHelmetLacquer = (typeof ownHelmetLacquers)[number]
export const ownHelmetLacquerLabels: Record<OwnHelmetLacquer, string> = { gloss: "Gloss", matt: "Matt" }

const photoPath = z.string().regex(/^quotes\/[0-9a-f-]{36}\.(jpg|png|webp)$/, "That photo isn't valid")
const logoPath = z.string().regex(/^[0-9a-f-]{36}\/[0-9a-f-]{36}\.(png|jpg|webp)$/, "That logo isn't valid")

/**
 * "Send my own helmet": instead of the 3D builder, the customer sends photos of their
 * helmet and their choices, and the workshop replies with a quote. Contact details are
 * required in full (a proper profile) and saved to their account.
 */
export const ownHelmetSchema = z
  .object({
    makeModel: z.string().trim().min(2, "Tell us the make and model of your helmet").max(120),
    size: z.string().trim().max(20),
    photos: z.array(photoPath).min(1, "Add at least one photo of your helmet").max(6, "Add up to 6 photos"),
    notes: z.string().trim().min(10, "Describe the design you'd like, even roughly").max(2000, "Keep this under 2,000 characters"),
    finishes: z.array(z.enum(ownHelmetFinishes)).max(3),
    lacquer: z.enum(ownHelmetLacquers),
    films: z.array(z.string().trim().min(1).max(80)).max(10, "Choose up to 10 films"),
    racingName: z.string().trim().max(40),
    racingNumber: z.string().trim().max(4),
    extraText: z.string().trim().max(200),
    logos: z.array(logoPath).max(6, "Add up to 6 logos"),
    name: z.string().trim().min(2, "Enter your full name").max(80),
    phone: z
      .string()
      .trim()
      .min(1, "Enter a phone number so we can reach you")
      .refine((value) => /^[+\d][\d\s()-]{6,}$/.test(value), { error: "Enter a valid phone number" }),
    address: addressSchema,
  })
  .superRefine((values, ctx) => {
    // Metallic and chrome are lacquered gloss; the builder applies the same rule.
    if (values.lacquer === "matt" && values.finishes.some((finish) => finish !== "standard")) {
      ctx.addIssue({ code: "custom", path: ["lacquer"], message: "Metallic and chrome need a gloss lacquer. Choose gloss, or standard paint only." })
    }
    const required: [keyof typeof values.address, string][] = [
      ["line1", "Enter the first line of your address"],
      ["city", "Enter your town or city"],
      ["postcode", "Enter your postcode"],
    ]
    for (const [field, message] of required) {
      if (!values.address[field]) ctx.addIssue({ code: "custom", path: ["address", field], message })
    }
  })

export type OwnHelmetValues = z.infer<typeof ownHelmetSchema>
