import { z } from "zod"

export const contactTopics = [
  { value: "helmet-design", label: "A helmet design" },
  { value: "send-my-helmet", label: "Sending in my own helmet" },
  { value: "existing-order", label: "An existing order" },
  { value: "partnership", label: "Sponsorship or trade" },
  { value: "other", label: "Something else" },
] as const

const topicValues: readonly string[] = contactTopics.map((topic) => topic.value)

export const contactSchema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(80, "Name is too long"),
  email: z.email("Enter a valid email address").trim(),
  phone: z
    .string()
    .trim()
    .refine((value) => value === "" || /^[+\d][\d\s()-]{6,}$/.test(value), { error: "Enter a valid phone number" }),
  topic: z.string().refine((value) => topicValues.includes(value), { error: "Choose what your message is about" }),
  design: z.string(),
  message: z.string().trim().min(20, "Tell us a bit more (20 characters or more)").max(2000, "Keep it under 2,000 characters"),
  consent: z.boolean().refine((value) => value, { error: "Please agree so we can reply to you" }),
})

export type ContactFormValues = z.infer<typeof contactSchema>
