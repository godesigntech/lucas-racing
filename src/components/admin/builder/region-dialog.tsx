"use client"

import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"

import { FormField, fieldA11y } from "@/components/forms/form-field"
import { runAction } from "@/components/forms/use-action-form"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { saveTemplateRegion } from "@/lib/actions/admin/builder-catalog"
import { cn } from "@/lib/utils"
import { templateRegionSchema, type TemplateRegionValues } from "@/lib/validations/builder-admin"
import type { RegionKind, TemplateRegion } from "@/types/templates"

const kinds: { value: RegionKind; label: string; hint: string }[] = [
  { value: "fill", label: "Shape", hint: "An area the customer colours." },
  { value: "pinstripe", label: "Pinstripe", hint: "A racing line, edited at its own step." },
  { value: "trim", label: "Trim", hint: "A painted edge." },
]

interface RegionDialogProps {
  templateId: string
  /** Null when adding a new area. */
  region: TemplateRegion | null
  nextSortOrder: number
  open: boolean
  onClose: () => void
}

/** Add or edit one editable area of a template. */
export function RegionDialog({ templateId, region, nextSortOrder, open, onClose }: RegionDialogProps) {
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<TemplateRegionValues>({
    resolver: zodResolver(templateRegionSchema),
    defaultValues: {
      key: region?.key ?? "",
      label: region?.label ?? "",
      kind: region?.kind ?? "fill",
      maskUrl: region?.maskUrl ?? "",
      svgElementId: region?.svgElementId ?? "",
      defaultColour: region?.defaultColour ?? "#ffffff",
      allowsFilm: region?.allowsFilm ?? true,
      allowsChrome: region?.allowsChrome ?? false,
      allowsMetallic: region?.allowsMetallic ?? true,
      sortOrder: region?.sortOrder ?? nextSortOrder,
    },
  })

  async function onSubmit(values: TemplateRegionValues) {
    const result = await runAction(() => saveTemplateRegion(templateId, region?.id ?? null, values), setError)
    if (result?.ok) onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{region ? `Edit ${region.label}` : "Add an editable area"}</DialogTitle>
          <DialogDescription>
            Each area can carry its own colour, paint finish and hydro-dip film in the builder.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField id="region-label" label="Name" hint="What customers see, e.g. Shell." error={errors.label?.message}>
              <Input {...register("label")} {...fieldA11y("region-label", errors.label?.message, true)} />
            </FormField>
            <FormField id="region-key" label="Id" hint="Lowercase, no spaces." error={errors.key?.message}>
              <Input {...register("key")} {...fieldA11y("region-key", errors.key?.message, true)} placeholder="base" />
            </FormField>
          </div>

          <fieldset className="space-y-2">
            <legend className="text-sm font-semibold">Type</legend>
            <Controller
              control={control}
              name="kind"
              render={({ field }) => (
                <div className="grid gap-2 sm:grid-cols-3">
                  {kinds.map((kind) => (
                    <button
                      key={kind.value}
                      type="button"
                      onClick={() => field.onChange(kind.value)}
                      aria-pressed={field.value === kind.value}
                      className={cn(
                        "rounded-2xl border p-3 text-left transition",
                        field.value === kind.value ? "border-brand-ink ring-2 ring-brand-ink/20" : "border-carbon/15 hover:border-carbon/35",
                      )}
                    >
                      <span className="block text-sm font-semibold">{kind.label}</span>
                      <span className="block text-xs text-muted-foreground">{kind.hint}</span>
                    </button>
                  ))}
                </div>
              )}
            />
          </fieldset>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField id="region-mask" label="Mask" hint="Greyscale PNG. Leave blank for the shell." error={errors.maskUrl?.message} optional>
              <Input {...register("maskUrl")} {...fieldA11y("region-mask", errors.maskUrl?.message, true)} placeholder="/models/templates/…" />
            </FormField>
            <FormField id="region-colour" label="Default colour" error={errors.defaultColour?.message}>
              <Input {...register("defaultColour")} {...fieldA11y("region-colour", errors.defaultColour?.message)} placeholder="#ffffff" />
            </FormField>
            <FormField id="region-svg" label="SVG element id" hint="For vector templates." error={errors.svgElementId?.message} optional>
              <Input {...register("svgElementId")} {...fieldA11y("region-svg", errors.svgElementId?.message, true)} />
            </FormField>
            <FormField id="region-sort" label="Order" error={errors.sortOrder?.message}>
              <Input type="number" min={0} {...register("sortOrder", { valueAsNumber: true })} {...fieldA11y("region-sort", errors.sortOrder?.message)} />
            </FormField>
          </div>

          <fieldset className="space-y-2">
            <legend className="text-sm font-semibold">What this area accepts</legend>
            {([
              ["allowsFilm", "Hydro-dip films"],
              ["allowsMetallic", "Metallic paint"],
              ["allowsChrome", "Chrome"],
            ] as const).map(([name, label]) => (
              <label key={name} className="flex items-center justify-between gap-4 rounded-xl bg-paddock/40 px-4 py-2.5 text-sm">
                <span>{label}</span>
                <Controller
                  control={control}
                  name={name}
                  render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} aria-label={label} />}
                />
              </label>
            ))}
            <p className="text-xs text-muted-foreground">
              Only offer what the artwork can carry. Chrome and metallic also force a gloss lacquer.
            </p>
          </fieldset>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="animate-spin" aria-hidden />}
              {region ? "Save area" : "Add area"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
