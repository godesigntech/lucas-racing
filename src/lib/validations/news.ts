import { z } from "zod"

const slug = z
  .string()
  .trim()
  .min(2, "Use at least 2 characters")
  .max(100, "Keep it under 100 characters")
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Use lowercase letters, numbers and dashes only")
  .refine((value) => value !== "category", { error: "That web address is reserved" })

export const newNewsPostSchema = z.object({
  title: z.string().trim().min(3, "Enter a title").max(160),
})
export type NewNewsPostValues = z.infer<typeof newNewsPostSchema>

export const newsPostSchema = z
  .object({
    title: z.string().trim().min(3, "Enter a title").max(160, "Keep the title under 160 characters"),
    slug,
    excerpt: z.string().trim().max(320, "Keep the summary under 320 characters"),
    body: z.string().max(60000, "That article is too long"),
    // An uploaded photo, or one of the site's own photos in /images.
    coverUrl: z.string().regex(/^(https:\/\/\S+|\/images\/[\w./-]+)$/, "Upload the photo again").nullable(),
    coverAlt: z.string().trim().max(200),
    categoryId: z.uuid().nullable(),
    status: z.enum(["draft", "published"]),
    /** ISO date-time; required when published (a future time schedules the post). */
    publishedAt: z.string().nullable(),
    featured: z.boolean(),
    authorName: z.string().trim().min(2, "Enter an author").max(80),
    seoTitle: z.string().trim().max(70, "Search engines show about 60 characters"),
    seoDescription: z.string().trim().max(170, "Search engines show about 155 characters"),
  })
  .refine((values) => values.status === "draft" || (values.publishedAt && !Number.isNaN(Date.parse(values.publishedAt))), {
    error: "Choose when to publish",
    path: ["publishedAt"],
  })
  .refine((values) => values.status === "draft" || values.body.trim().length > 0, {
    error: "Write the article before publishing",
    path: ["body"],
  })
export type NewsPostValues = z.infer<typeof newsPostSchema>

export const newsCategorySchema = z.object({
  name: z.string().trim().min(2, "Enter a name").max(60),
  slug: z
    .string()
    .trim()
    .min(2, "Use at least 2 characters")
    .max(80)
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Use lowercase letters, numbers and dashes only"),
  description: z.string().trim().max(300, "Keep it under 300 characters"),
  sortOrder: z.number({ error: "Enter a number" }).int().min(0).max(100000),
})
export type NewsCategoryValues = z.infer<typeof newsCategorySchema>
