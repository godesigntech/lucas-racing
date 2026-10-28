"use client"

import { Controller, useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"

import { AdminCard } from "@/components/admin/admin-card"
import { OptionPriceInput } from "@/components/admin/money-input"
import { FormField, fieldA11y } from "@/components/forms/form-field"
import { runAction } from "@/components/forms/use-action-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { saveRushTier } from "@/lib/actions/admin/production"
import { cn } from "@/lib/utils"
import { rushTierSchema, type RushTierValues } from "@/lib/validations/production"
import type { RushTier } from "@/types/production"

/**
 * One turnaround. The fees the client suggested are marked as drafts until they confirm
 * them, and a tier with no fee can't be switched on — the action refuses it, and so does
 * place_order().
 */
export function RushTierForm({ tier, rushEnabled }: { tier: RushTier; rushEnabled: boolean }) {
  const isStandard = tier.key === "standard"
  const {
    register,
    control,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<RushTierValues>({
    resolver: zodResolver(rushTierSchema),
    defaultValues: {
      key: tier.key,
      label: tier.label,
      leadWeeks: tier.leadWeeks,
      fee: tier.fee,
      maxPerWeek: tier.maxPerWeek,
      isDraft: tier.isDraft,
      isActive: tier.isActive,
    },
  })

  const isDraft = useWatch({ control, name: "isDraft" })
  const isActive = useWatch({ control, name: "isActive" })

  async function onSubmit(values: RushTierValues) {
    const result = await runAction(() => saveRushTier(values), setError)
    if (result?.ok) reset(values)
  }

  const live = isActive && (isStandard || rushEnabled)

  return (
    <AdminCard
      title={tier.label}
      description={`${tier.leadWeeks} ${tier.leadWeeks === 1 ? "week" : "weeks"} from the start date`}
      action={
        <span
          className={cn(
            "rounded-full px-2.5 py-1 text-xs font-medium ring-1",
            live ? "bg-accent text-brand-ink ring-brand-ink/25" : "bg-carbon/8 text-carbon ring-carbon/15",
          )}
        >
          {live ? "Offered" : "Not offered"}
        </span>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-4">
        {isDraft && (
          <p className="rounded-xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
            This price came from the client as a suggestion and hasn&apos;t been approved. Clear the draft mark once
            it&apos;s agreed.
          </p>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField id={`${tier.key}-label`} label="Name" error={errors.label?.message}>
            <Input {...register("label")} {...fieldA11y(`${tier.key}-label`, errors.label?.message)} />
          </FormField>
          <FormField id={`${tier.key}-weeks`} label="Weeks" error={errors.leadWeeks?.message}>
            <Input type="number" min={1} max={52} {...register("leadWeeks", { valueAsNumber: true })} {...fieldA11y(`${tier.key}-weeks`, errors.leadWeeks?.message)} />
          </FormField>
          <FormField id={`${tier.key}-fee`} label="Fee" hint="Blank means not agreed yet." error={errors.fee?.message} optional>
            <Controller
              control={control}
              name="fee"
              render={({ field }) => (
                <OptionPriceInput value={field.value} onChange={field.onChange} onBlur={field.onBlur} {...fieldA11y(`${tier.key}-fee`, errors.fee?.message, true)} />
              )}
            />
          </FormField>
          <FormField id={`${tier.key}-max`} label="Max a week" hint="How many of these may start in one week." error={errors.maxPerWeek?.message}>
            <Input type="number" min={0} {...register("maxPerWeek", { valueAsNumber: true })} {...fieldA11y(`${tier.key}-max`, errors.maxPerWeek?.message, true)} />
          </FormField>
        </div>

        <div className="grid gap-2">
          <label className="flex items-center justify-between gap-4 rounded-xl bg-paddock/40 px-4 py-2.5 text-sm">
            <span className="font-semibold">Offer this turnaround</span>
            <Controller
              control={control}
              name="isActive"
              render={({ field }) => (
                <Switch checked={field.value} onCheckedChange={field.onChange} disabled={isStandard} aria-label={`Offer ${tier.label}`} />
              )}
            />
          </label>
          {!isStandard && (
            <label className="flex items-center justify-between gap-4 rounded-xl bg-paddock/40 px-4 py-2.5 text-sm">
              <span className="font-semibold">Price is a draft</span>
              <Controller control={control} name="isDraft" render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} aria-label="Price is a draft" />} />
            </label>
          )}
          {!isStandard && isActive && !rushEnabled && (
            <p className="text-xs text-muted-foreground">
              Rush orders are switched off above, so customers won&apos;t see this yet.
            </p>
          )}
        </div>

        <div className="flex justify-end">
          <Button type="submit" size="sm" disabled={isSubmitting || !isDirty}>
            {isSubmitting && <Loader2 className="animate-spin" aria-hidden />}
            Save
          </Button>
        </div>
      </form>
    </AdminCard>
  )
}
