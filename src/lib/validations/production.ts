import { z } from "zod"

// Admin forms for production scheduling. Rush fees are the client's provisional figures
// and stay switched off until they approve them, so "live" is a deliberate, separate act
// from editing the numbers.

const isoDate = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use a date like 2026-11-16")

export const productionSettingsSchema = z.object({
  standardLeadWeeks: z.number().int().min(1, "At least a week").max(52, "At most a year"),
  weeklyCapacity: z.number().int().min(0, "Can't be negative").max(999),
  bookingLeadDays: z.number().int().min(0, "Can't be negative").max(365),
  horizonWeeks: z.number().int().min(1, "At least a week").max(104, "At most two years"),
  rushEnabled: z.boolean(),
})
export type ProductionSettingsValues = z.infer<typeof productionSettingsSchema>

export const rushTierSchema = z.object({
  key: z.string().trim().min(1).max(60),
  label: z.string().trim().min(1, "Enter a name").max(60),
  leadWeeks: z.number().int().min(1, "At least a week").max(52),
  // Blank means the fee hasn't been agreed; the tier can't be sold until it is.
  fee: z.number({ error: "Enter a fee" }).min(0, "Can't be negative").max(100000).nullable(),
  maxPerWeek: z.number().int().min(0, "Can't be negative").max(999),
  isDraft: z.boolean(),
  isActive: z.boolean(),
})
export type RushTierValues = z.infer<typeof rushTierSchema>

export const capacitySchema = z.object({
  weekStart: isoDate,
  slots: z.number().int().min(0, "Can't be negative").max(999),
  note: z.string().trim().max(200),
})
export type CapacityValues = z.infer<typeof capacitySchema>

export const blackoutSchema = z
  .object({
    startsOn: isoDate,
    endsOn: isoDate,
    reason: z.string().trim().max(200),
  })
  .refine((value) => value.endsOn >= value.startsOn, {
    message: "The last day can't be before the first",
    path: ["endsOn"],
  })
export type BlackoutValues = z.infer<typeof blackoutSchema>
