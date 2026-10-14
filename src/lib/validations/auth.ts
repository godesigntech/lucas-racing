import { z } from "zod"

const email = z.email("Enter a valid email address").trim()

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Enter your password"),
})

export type LoginFormValues = z.infer<typeof loginSchema>

export const passwordRules = [
  { test: (value: string) => value.length >= 8, label: "At least 8 characters" },
  { test: (value: string) => /[A-Z]/.test(value), label: "One capital letter" },
  { test: (value: string) => /\d/.test(value), label: "One number" },
] as const

export const newPasswordSchema = z
  .string()
  .min(8, "Use at least 8 characters")
  .regex(/[A-Z]/, "Include at least one capital letter")
  .regex(/\d/, "Include at least one number")

export const signupSchema = z
  .object({
    fullName: z.string().trim().min(2, "Enter your full name").max(80, "Name is too long"),
    email,
    password: newPasswordSchema,
    confirmPassword: z.string().min(1, "Confirm your password"),
    acceptTerms: z.boolean().refine((value) => value, { error: "Please accept the terms to continue" }),
  })
  .refine((values) => values.password === values.confirmPassword, {
    error: "Passwords don't match",
    path: ["confirmPassword"],
  })

export type SignupFormValues = z.infer<typeof signupSchema>

export const changePasswordSchema = z
  .object({
    password: newPasswordSchema,
    confirmPassword: z.string().min(1, "Confirm your new password"),
  })
  .refine((values) => values.password === values.confirmPassword, {
    error: "Passwords don't match",
    path: ["confirmPassword"],
  })

export type ChangePasswordValues = z.infer<typeof changePasswordSchema>
