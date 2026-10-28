"use client"

import { useState } from "react"
import { Controller, useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Plus, Trash2 } from "lucide-react"

import { AdminCard } from "@/components/admin/admin-card"
import { ConfirmDialog } from "@/components/admin/confirm-dialog"
import { FormField, fieldA11y } from "@/components/forms/form-field"
import { runAction } from "@/components/forms/use-action-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { deleteTemplateRegion, updateDesignTemplate } from "@/lib/actions/admin/builder-catalog"
import { cn } from "@/lib/utils"
import { designTemplateSchema, type DesignTemplateValues } from "@/lib/validations/builder-admin"
import type { ArtworkStatus, DesignTemplate } from "@/types/templates"

import { RegionDialog } from "./region-dialog"

const statusMeta: Record<ArtworkStatus, { label: string; hint: string; tone: string }> = {
  ready: { label: "Ready", hint: "Artwork is in place and shows in 3D.", tone: "bg-accent text-brand-ink ring-brand-ink/25" },
  pending: { label: "Awaiting artwork", hint: "The builder falls back to the illustration.", tone: "bg-amber-100 text-amber-900 ring-amber-300/60" },
  placeholder: { label: "Placeholder", hint: "Stand-in artwork, clearly temporary.", tone: "bg-sky-100 text-sky-900 ring-sky-300/60" },
}

const statuses: ArtworkStatus[] = ["ready", "pending", "placeholder"]

/** One design's artwork on one helmet: where the files are, and its editable regions. */
export function TemplateCard({ template, modelName }: { template: DesignTemplate; modelName: string }) {
  const [editing, setEditing] = useState<DesignTemplate["regions"][number] | null>(null)
  const [adding, setAdding] = useState(false)

  const {
    register,
    control,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<DesignTemplateValues>({
    resolver: zodResolver(designTemplateSchema),
    defaultValues: {
      svgUrl: template.svgUrl ?? "",
      graphicMaskUrl: template.graphicMaskUrl ?? "",
      accentMaskUrl: template.accentMaskUrl ?? "",
      thumbnailUrl: template.thumbnailUrl ?? "",
      artworkStatus: template.artworkStatus,
      isActive: template.isActive,
      sortOrder: template.sortOrder,
    },
  })

  const status = useWatch({ control, name: "artworkStatus" })

  async function onSubmit(values: DesignTemplateValues) {
    const result = await runAction(() => updateDesignTemplate(template.id, values), setError)
    if (result?.ok) reset(values)
  }

  const nextSortOrder = template.regions.reduce((highest, region) => Math.max(highest, region.sortOrder), 0) + 1

  return (
    <AdminCard
      title={modelName}
      description={`${template.regions.length} editable ${template.regions.length === 1 ? "area" : "areas"}`}
      action={
        <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium ring-1", statusMeta[status].tone)}>
          {statusMeta[status].label}
        </span>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-4">
        <fieldset className="space-y-2">
          <legend className="text-sm font-semibold">Artwork status</legend>
          <Controller
            control={control}
            name="artworkStatus"
            render={({ field }) => (
              <div className="flex flex-wrap gap-2">
                {statuses.map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => field.onChange(value)}
                    aria-pressed={field.value === value}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-sm transition",
                      field.value === value ? "border-brand-ink bg-brand-ink text-white" : "border-carbon/15 hover:border-carbon/35",
                    )}
                  >
                    {statusMeta[value].label}
                  </button>
                ))}
              </div>
            )}
          />
          <p className="text-xs text-muted-foreground">{statusMeta[status].hint}</p>
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField id={`${template.id}-graphic`} label="Graphic mask" hint="Greyscale PNG in the model's UVs." error={errors.graphicMaskUrl?.message} optional>
            <Input {...register("graphicMaskUrl")} {...fieldA11y(`${template.id}-graphic`, errors.graphicMaskUrl?.message)} placeholder="/models/templates/…" />
          </FormField>
          <FormField id={`${template.id}-accent`} label="Pinstripe mask" error={errors.accentMaskUrl?.message} optional>
            <Input {...register("accentMaskUrl")} {...fieldA11y(`${template.id}-accent`, errors.accentMaskUrl?.message)} placeholder="/models/templates/…" />
          </FormField>
          <FormField id={`${template.id}-svg`} label="SVG source" hint="For templates supplied as vector artwork." error={errors.svgUrl?.message} optional>
            <Input {...register("svgUrl")} {...fieldA11y(`${template.id}-svg`, errors.svgUrl?.message)} placeholder="/models/templates/…" />
          </FormField>
          <FormField id={`${template.id}-thumb`} label="Thumbnail" error={errors.thumbnailUrl?.message} optional>
            <Input {...register("thumbnailUrl")} {...fieldA11y(`${template.id}-thumb`, errors.thumbnailUrl?.message)} placeholder="/models/templates/…" />
          </FormField>
        </div>

        <div className="flex items-center justify-between gap-4 rounded-2xl bg-paddock/40 px-4 py-3">
          <span className="text-sm">
            <span className="font-semibold">Offer this template</span>
            <span className="block text-xs text-muted-foreground">Hidden templates stay out of the builder.</span>
          </span>
          <Controller
            control={control}
            name="isActive"
            render={({ field }) => (
              <Switch checked={field.value} onCheckedChange={field.onChange} aria-label={`Offer ${modelName} template`} />
            )}
          />
        </div>

        <div className="flex justify-end">
          <Button type="submit" size="sm" disabled={isSubmitting || !isDirty}>
            {isSubmitting && <Loader2 className="animate-spin" aria-hidden />}
            Save template
          </Button>
        </div>
      </form>

      <div className="mt-6 border-t border-carbon/10 pt-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold">Editable areas</h3>
          <Button type="button" variant="outline" size="sm" onClick={() => setAdding(true)}>
            <Plus /> Add an area
          </Button>
        </div>

        <ul className="mt-3 divide-y divide-carbon/10">
          {template.regions.map((region) => (
            <li key={region.id} className="flex items-center gap-3 py-2.5">
              <span aria-hidden className="size-6 shrink-0 rounded-full ring-1 ring-carbon/20" style={{ backgroundColor: region.defaultColour }} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{region.label}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  {region.key} · {region.kind === "pinstripe" ? "pinstripe" : region.kind}
                  {region.allowsFilm ? " · films" : ""}
                  {region.allowsMetallic ? " · metallic" : ""}
                  {region.allowsChrome ? " · chrome" : ""}
                </span>
              </span>
              <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(region)}>
                Edit
              </Button>
              <ConfirmDialog
                title={`Remove ${region.label}?`}
                description="Builds already saved keep their colours, but customers can't choose this area any more."
                confirmLabel="Remove area"
                onConfirm={async () => (await deleteTemplateRegion(region.id)).ok}
                trigger={
                  <Button type="button" variant="ghost" size="icon" aria-label={`Remove ${region.label}`}>
                    <Trash2 />
                  </Button>
                }
              />
            </li>
          ))}
          {template.regions.length === 0 && (
            <li className="py-3 text-sm text-muted-foreground">
              No areas yet. Without them the builder offers the shell, graphic and pinstripe it has always had.
            </li>
          )}
        </ul>
      </div>

      {(adding || editing) && (
        <RegionDialog
          templateId={template.id}
          region={editing}
          nextSortOrder={nextSortOrder}
          open
          onClose={() => {
            setAdding(false)
            setEditing(null)
          }}
        />
      )}
    </AdminCard>
  )
}
