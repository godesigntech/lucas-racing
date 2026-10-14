"use client"

import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"

import { fieldA11y, FormField } from "@/components/forms/form-field"
import { runAction } from "@/components/forms/use-action-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { updateBusinessDetails } from "@/lib/actions/admin/settings"
import { businessSchema, type BusinessValues } from "@/lib/validations/admin"
import type { SiteSettings } from "@/types/settings"

import { AdminCard } from "../admin-card"

type TextField = Exclude<keyof BusinessValues, "showEventBanner">

const contactFields: { name: TextField; label: string; hint?: string; type?: string; wide?: boolean }[] = [
  { name: "businessName", label: "Business name" },
  { name: "partnerName", label: "Partner name", hint: "Shown as “× Hydro Karts”." },
  { name: "contactEmail", label: "Contact email", type: "email" },
  { name: "contactPhone", label: "Phone", type: "tel" },
  { name: "location", label: "Location", hint: "e.g. North East England" },
  { name: "openingHours", label: "Opening hours" },
  { name: "addressNote", label: "Address or directions", wide: true },
]

export function BusinessForm({ settings }: { settings: SiteSettings }) {
  const defaults: BusinessValues = {
    businessName: settings.businessName,
    partnerName: settings.partnerName,
    contactEmail: settings.contactEmail,
    contactPhone: settings.contactPhone,
    location: settings.location,
    addressNote: settings.addressNote,
    openingHours: settings.openingHours,
    eventName: settings.eventName,
    eventDates: settings.eventDates,
    showEventBanner: settings.showEventBanner,
  }
  const {
    register,
    control,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<BusinessValues>({ resolver: zodResolver(businessSchema), defaultValues: defaults })

  async function onSubmit(values: BusinessValues) {
    const result = await runAction(() => updateBusinessDetails(values), setError)
    if (result?.ok) reset(values)
  }

  const textField = ({ name, label, hint, type, wide }: (typeof contactFields)[number]) => (
    <FormField key={name} id={`settings-${name}`} label={label} hint={hint} error={errors[name]?.message} className={wide ? "sm:col-span-2" : undefined}>
      <Input {...register(name)} {...fieldA11y(`settings-${name}`, errors[name]?.message, Boolean(hint))} type={type} />
    </FormField>
  )

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
      <AdminCard title="Business and contact details" description="Shown in the footer and on the Contact page.">
        <div className="grid gap-5 sm:grid-cols-2">{contactFields.map(textField)}</div>
      </AdminCard>

      <AdminCard title="Event banner" description="The strip at the top of every page, e.g. for Kartmania.">
        <div className="grid gap-5 sm:grid-cols-2">
          {textField({ name: "eventName", label: "Event name" })}
          {textField({ name: "eventDates", label: "Dates", hint: "e.g. 14–15 November 2026" })}
          <Controller
            control={control}
            name="showEventBanner"
            render={({ field }) => (
              <div className="flex items-center justify-between gap-3 rounded-xl border border-carbon/10 p-4 sm:col-span-2">
                <Label htmlFor="settings-banner" className="block">
                  <span className="font-semibold">Show the event banner</span>
                  <span className="block text-xs font-normal text-muted-foreground">Turn off after the event.</span>
                </Label>
                <Switch id="settings-banner" checked={field.value} onCheckedChange={field.onChange} />
              </div>
            )}
          />
        </div>
      </AdminCard>

      <div className="flex justify-end">
        <Button type="submit" size="lg" disabled={isSubmitting || !isDirty}>
          {isSubmitting && <Loader2 className="animate-spin" aria-hidden />}
          {isSubmitting ? "Saving…" : "Save details"}
        </Button>
      </div>
    </form>
  )
}
