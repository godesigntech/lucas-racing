"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"

import { AddressFields } from "@/components/forms/address-fields"
import { fieldA11y, FormField } from "@/components/forms/form-field"
import { runAction } from "@/components/forms/use-action-form"
import { InfoCard } from "@/components/orders/info-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { updateProfile } from "@/lib/actions/account"
import { profileSchema, type ProfileValues } from "@/lib/validations/account"
import type { Profile } from "@/types/account"

export function ProfileForm({ profile }: { profile: Profile }) {
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: profile.fullName,
      phone: profile.phone,
      address: {
        line1: profile.addressLine1,
        line2: profile.addressLine2,
        city: profile.city,
        county: profile.county,
        postcode: profile.postcode,
        country: profile.country,
      },
    },
  })

  async function onSubmit(values: ProfileValues) {
    const result = await runAction(() => updateProfile(values), setError)
    if (result?.ok) reset(values)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
      <InfoCard title="Personal details">
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField id="profile-name" label="Full name" error={errors.fullName?.message}>
            <Input {...register("fullName")} {...fieldA11y("profile-name", errors.fullName?.message)} autoComplete="name" />
          </FormField>
          <FormField id="profile-phone" label="Phone" optional error={errors.phone?.message}>
            <Input
              {...register("phone")}
              {...fieldA11y("profile-phone", errors.phone?.message)}
              type="tel"
              autoComplete="tel"
            />
          </FormField>
          <FormField id="profile-email" label="Email" hint="Contact us to change the email on your account." className="sm:col-span-2">
            <Input id="profile-email" value={profile.email} readOnly disabled aria-describedby="profile-email-hint" />
          </FormField>
        </div>
      </InfoCard>

      <InfoCard title="Delivery address">
        <AddressFields
          register={register}
          idPrefix="profile-address"
          errors={{ postcode: errors.address?.postcode?.message }}
          names={{
            line1: "address.line1",
            line2: "address.line2",
            city: "address.city",
            county: "address.county",
            postcode: "address.postcode",
            country: "address.country",
          }}
        />
      </InfoCard>

      <div className="flex justify-end">
        <Button type="submit" size="lg" disabled={isSubmitting || !isDirty}>
          {isSubmitting && <Loader2 className="animate-spin" aria-hidden />}
          {isSubmitting ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </form>
  )
}
