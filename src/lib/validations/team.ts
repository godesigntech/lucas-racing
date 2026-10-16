import { z } from "zod"

// Photos are either the client's files in /public/images or uploads in the team-photos bucket.
const photoUrl = z
  .string()
  .trim()
  .refine((value) => value.startsWith("/images/") || /^https:\/\/[^/]+\/storage\/v1\/object\/public\/team-photos\//.test(value), {
    error: "Upload a photo",
  })
  .nullable()

export const teamMemberSchema = z.object({
  name: z.string().trim().min(2, "Enter their name").max(80, "Keep the name under 80 characters"),
  role: z.string().trim().max(80, "Keep the role under 80 characters"),
  tagline: z.string().trim().max(140, "Keep this under 140 characters"),
  bio: z.string().trim().max(4000, "Keep the introduction under 4,000 characters"),
  photoUrl,
  photoAlt: z.string().trim().max(200, "Keep this under 200 characters"),
  featured: z.boolean(),
  isActive: z.boolean(),
  sortOrder: z.number({ error: "Enter a number" }).int().min(0).max(10000),
})
export type TeamMemberValues = z.infer<typeof teamMemberSchema>
