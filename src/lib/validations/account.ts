import { z } from "zod"

import { addressSchema } from "./checkout"

export const profileSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name").max(80, "Name is too long"),
  phone: z
    .string()
    .trim()
    .refine((value) => value === "" || /^[+\d][\d\s()-]{6,}$/.test(value), { error: "Enter a valid phone number" }),
  address: addressSchema,
})

export type ProfileValues = z.infer<typeof profileSchema>
