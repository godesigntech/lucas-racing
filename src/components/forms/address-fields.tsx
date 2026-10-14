"use client"

import type { FieldValues, Path, UseFormRegister } from "react-hook-form"

import { Input } from "@/components/ui/input"

import { fieldA11y, FormField } from "./form-field"

export type AddressField = "line1" | "line2" | "city" | "county" | "postcode" | "country"

interface AddressFieldsProps<T extends FieldValues> {
  register: UseFormRegister<T>
  /** Form path for each address field, e.g. { line1: "address.line1" }. */
  names: Record<AddressField, Path<T>>
  errors?: Partial<Record<AddressField, string>>
  idPrefix: string
}

/** UK address inputs shared by checkout and the profile page. */
export function AddressFields<T extends FieldValues>({ register, names, errors = {}, idPrefix }: AddressFieldsProps<T>) {
  const id = (field: AddressField) => `${idPrefix}-${field}`

  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <FormField id={id("line1")} label="Address line 1" error={errors.line1} className="sm:col-span-2">
        <Input {...register(names.line1)} {...fieldA11y(id("line1"), errors.line1)} autoComplete="address-line1" />
      </FormField>
      <FormField id={id("line2")} label="Address line 2" optional className="sm:col-span-2">
        <Input {...register(names.line2)} id={id("line2")} autoComplete="address-line2" />
      </FormField>
      <FormField id={id("city")} label="Town or city" error={errors.city}>
        <Input {...register(names.city)} {...fieldA11y(id("city"), errors.city)} autoComplete="address-level2" />
      </FormField>
      <FormField id={id("county")} label="County" optional>
        <Input {...register(names.county)} id={id("county")} autoComplete="address-level1" />
      </FormField>
      <FormField id={id("postcode")} label="Postcode" error={errors.postcode}>
        <Input
          {...register(names.postcode)}
          {...fieldA11y(id("postcode"), errors.postcode)}
          autoComplete="postal-code"
          className="uppercase"
        />
      </FormField>
      <FormField id={id("country")} label="Country">
        <Input {...register(names.country)} id={id("country")} autoComplete="country-name" />
      </FormField>
    </div>
  )
}
