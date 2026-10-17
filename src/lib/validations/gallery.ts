import { z } from "zod"

const slug = z
  .string()
  .trim()
  .min(2, "Use at least 2 characters")
  .max(100)
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Use lowercase letters, numbers and dashes only")

export const newAlbumSchema = z.object({ title: z.string().trim().min(2, "Enter a title").max(120) })
export type NewAlbumValues = z.infer<typeof newAlbumSchema>

export const albumSchema = z.object({
  title: z.string().trim().min(2, "Enter a title").max(120),
  slug,
  event: z.string().trim().max(120),
  albumDate: z
    .string()
    .trim()
    .refine((value) => value === "" || /^\d{4}-\d{2}-\d{2}$/.test(value), { error: "Choose a date" }),
  description: z.string().trim().max(1000, "Keep it under 1,000 characters"),
  isPublished: z.boolean(),
})
export type AlbumValues = z.infer<typeof albumSchema>

const photoUrl = z.string().regex(/^https:\/\/\S+$/, "Upload the photo again")

export const newPhotosSchema = z
  .array(z.object({ url: photoUrl, width: z.number().int().positive().max(10000), height: z.number().int().positive().max(10000) }))
  .min(1)
  .max(100)

export const captionSchema = z.string().trim().max(300, "Keep captions under 300 characters")
