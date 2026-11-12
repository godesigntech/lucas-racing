import { z } from "zod"

import { kartFinishes, MAX_KART_LOGOS, readyKartLayouts } from "@/lib/kart-stickers/options"

const logoPath = z.string().regex(/^[0-9a-f-]{36}\/[0-9a-f-]{36}\.(png|jpg|webp)$/, "That logo isn't valid")

/** What the customer asks the AI to design. */
export const kartDesignSchema = z.object({
  // Only layouts with a blank picture can be designed on.
  layout: z.enum(readyKartLayouts.map((layout) => layout.id) as [string, ...string[]], { message: "Choose a layout" }),
  kartModel: z.string().trim().min(2, "Tell us your kart's make and model").max(80),
  prompt: z.string().trim().min(10, "Describe the design you'd like, even roughly").max(1000, "Keep the description under 1,000 characters"),
  raceNumber: z
    .string()
    .trim()
    .max(4, "Up to 4 characters")
    .regex(/^[0-9A-Za-z]*$/, "Letters and numbers only"),
  driverName: z.string().trim().max(40, "Keep the name under 40 characters"),
  finish: z.enum(kartFinishes),
  logos: z.array(logoPath).max(MAX_KART_LOGOS, `Add up to ${MAX_KART_LOGOS} logos`),
})

export type KartDesignValues = z.infer<typeof kartDesignSchema>

export const kartRequestSchema = z.object({
  designId: z.uuid(),
  notes: z.string().trim().max(2000, "Keep this under 2,000 characters"),
})
