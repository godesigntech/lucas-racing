"use client"

import { Controller, useFieldArray, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Plus, Trash2 } from "lucide-react"

import { runAction } from "@/components/forms/use-action-form"
import { SocialIcon } from "@/components/shared/social-icon"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { updateSocialLinks } from "@/lib/actions/admin/settings"
import { socialLinksSchema, type SocialLinksValues } from "@/lib/validations/admin"
import { socialIcons, type SocialLink } from "@/types/settings"

import { AdminCard } from "../admin-card"

const platformLabels: Record<(typeof socialIcons)[number], string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  youtube: "YouTube",
  tiktok: "TikTok",
}

export function SocialLinksForm({ links }: { links: SocialLink[] }) {
  const {
    register,
    control,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<SocialLinksValues>({
    resolver: zodResolver(socialLinksSchema),
    defaultValues: { links: links.map(({ icon, href }) => ({ icon, href })) },
  })
  const { fields, append, remove } = useFieldArray({ control, name: "links" })

  async function onSubmit(values: SocialLinksValues) {
    const result = await runAction(() => updateSocialLinks(values), setError)
    if (result?.ok) reset(values)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <AdminCard title="Social links" description="Icons in the footer and on the Contact page. Remove a row to hide it.">
        <ul className="space-y-3">
          {fields.map((field, index) => (
            <li key={field.id} className="space-y-1">
              <div className="grid grid-cols-[10rem_minmax(0,1fr)_auto] gap-2">
                <Controller
                  control={control}
                  name={`links.${index}.icon`}
                  render={({ field: icon }) => (
                    <Select value={icon.value} onValueChange={icon.onChange}>
                      <SelectTrigger aria-label={`Platform for link ${index + 1}`} className="w-full">
                        <SelectValue>
                          <SocialIcon name={icon.value} className="size-4" /> {platformLabels[icon.value]}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {socialIcons.map((value) => (
                          <SelectItem key={value} value={value}>
                            <SocialIcon name={value} className="size-4" /> {platformLabels[value]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                <Input
                  {...register(`links.${index}.href`)}
                  aria-label={`URL for link ${index + 1}`}
                  aria-invalid={errors.links?.[index]?.href ? true : undefined}
                  placeholder="https://www.instagram.com/lucasracing"
                  inputMode="url"
                />
                <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} aria-label={`Remove link ${index + 1}`}>
                  <Trash2 />
                </Button>
              </div>
              {errors.links?.[index]?.href && (
                <p className="text-xs font-medium text-destructive">{errors.links[index]?.href?.message}</p>
              )}
            </li>
          ))}
          {fields.length === 0 && <li className="text-sm text-muted-foreground">No social links. The icons are hidden.</li>}
        </ul>
        <div className="mt-5 flex flex-wrap justify-between gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ icon: "instagram", href: "" })}
            disabled={fields.length >= 8}
          >
            <Plus /> Add link
          </Button>
          <Button type="submit" disabled={isSubmitting || !isDirty}>
            {isSubmitting && <Loader2 className="animate-spin" aria-hidden />}
            Save links
          </Button>
        </div>
      </AdminCard>
    </form>
  )
}
