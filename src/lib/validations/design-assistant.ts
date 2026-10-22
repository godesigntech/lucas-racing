import { z } from "zod"

import { filmPatterns } from "@/types/helmet"
import { quoteHelmets, quoteStatuses } from "@/types/design-assistant"

const hex = z.string().regex(/^#[0-9a-f]{6}$/i)

/** A resized photo sent for the AI to look at (about 500px JPEG). Never stored. */
const photoDataUrl = z
  .string()
  .max(1_500_000, "That photo is too large")
  .regex(/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/, "That photo couldn't be read")

export const designBriefSchema = z
  .object({
    palette: z.array(hex).max(6),
    note: z.string().trim().max(500, "Keep it under 500 characters"),
    photo: photoDataUrl.optional(),
  })
  .refine((value) => value.palette.length > 0 || value.note.length > 0, {
    message: "Add a photo or describe the design you'd like.",
    path: ["note"],
  })

const phone = z
  .string()
  .trim()
  .refine((value) => value === "" || /^[+\d][\d\s()-]{6,}$/.test(value), { error: "Enter a valid phone number" })

/** The form the customer fills in. */
export const quoteFormSchema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(80, "Name is too long"),
  email: z.email("Enter a valid email address").trim(),
  phone,
  helmet: z.enum(quoteHelmets, { error: "Choose a helmet" }),
  notes: z.string().trim().max(2000, "Keep it under 2,000 characters"),
  consent: z.boolean().refine((value) => value, { error: "Please agree so we can reply to you" }),
})
export type QuoteFormValues = z.infer<typeof quoteFormSchema>

const look = z.object({
  layout: z.enum(["apex", "twin", "split", "shard", "halo", "flow", "blank"]),
  finish: z.enum(["gloss", "satin", "matte", "chrome"]),
  base: hex,
  graphic: hex,
  accent: hex,
  film: z.enum(filmPatterns),
  trim: hex,
  spoiler: z.boolean(),
  number: z.string().max(3).optional(),
})

/** Everything sent with a quote request: the form plus what the assistant produced. */
export const quoteRequestSchema = quoteFormSchema.extend({
  imagePath: z
    .string()
    .regex(/^quotes\/[0-9a-f-]{36}\.(jpg|png|webp)$/)
    .nullable(),
  /** The AI concept image, uploaded like the photo. */
  aiImagePath: z
    .string()
    .regex(/^quotes\/[0-9a-f-]{36}\.(jpg|png|webp)$/)
    .nullable()
    .optional(),
  palette: z.array(hex).max(6),
  concept: z
    .object({ look, summary: z.string().max(600), basedOn: z.string().max(60) })
    .nullable(),
  suggestedProducts: z.array(z.string().max(60)).max(4),
})
export type QuoteRequestValues = z.infer<typeof quoteRequestSchema>

export const quoteUpdateSchema = z.object({
  status: z.enum(quoteStatuses),
  adminNotes: z.string().trim().max(4000, "Keep notes under 4,000 characters"),
})
export type QuoteUpdateValues = z.infer<typeof quoteUpdateSchema>

/** Starting an AI concept image. */
export const conceptImageSchema = z.object({
  photo: photoDataUrl.optional(),
  note: z.string().trim().max(500),
  summary: z.string().trim().max(600),
  number: z.string().trim().max(3).optional(),
  /** The concept the assistant chose, so the picture uses the same colours and layout. */
  concept: look.optional(),
})
export type ConceptImageValues = z.infer<typeof conceptImageSchema>
