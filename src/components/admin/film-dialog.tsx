"use client"

import { useState } from "react"
import { Controller, useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ImagePlus, Loader2 } from "lucide-react"
import { toast } from "react-toastify"

import { fieldA11y, FormField } from "@/components/forms/form-field"
import { runAction } from "@/components/forms/use-action-form"
import { FilmSwatch } from "@/components/helmet/film-swatch"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { saveFilm } from "@/lib/actions/admin/catalog"
import { uploadFilmImage } from "@/lib/films/film-image"
import { cn } from "@/lib/utils"
import { filmSchema, type FilmValues } from "@/lib/validations/admin"
import type { Film } from "@/types/catalog"
import { filmPatterns } from "@/types/helmet"

import { MoneyInput } from "./money-input"

const patternLabels: Record<(typeof filmPatterns)[number], string> = {
  none: "Solid",
  carbon: "Carbon",
  forged: "Forged",
  hex: "Hex",
  camo: "Camo",
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60)
}

interface FilmDialogProps {
  film?: Film
  trigger: React.ReactNode
}

/** Add or edit a hydro-dip film. The ID is set once, from the name, and can't change afterwards. */
export function FilmDialog({ film, trigger }: FilmDialogProps) {
  const [open, setOpen] = useState(false)
  const mode = film ? "update" : "create"
  const defaults: FilmValues = film
    ? {
        id: film.id,
        name: film.name,
        code: film.code,
        category: film.category,
        pattern: film.pattern,
        textureUrl: film.textureUrl,
        thumbUrl: film.thumbUrl,
        price: film.price,
        isActive: film.isActive,
        sortOrder: film.sortOrder,
      }
    : { id: "", name: "", code: "", category: "", pattern: "none", textureUrl: null, thumbUrl: null, price: 45, isActive: true, sortOrder: 900 }

  const {
    register,
    control,
    handleSubmit,
    setError,
    setValue,
    reset,
    formState: { errors, isSubmitting, dirtyFields },
  } = useForm<FilmValues>({ resolver: zodResolver(filmSchema), defaultValues: defaults })
  const [pattern, filmId, thumbUrl] = useWatch({ control, name: ["pattern", "id", "thumbUrl"] })
  const [uploading, setUploading] = useState(false)

  async function pickImage(file: File | undefined) {
    if (!file) return
    if (!filmId) {
      toast.error("Enter the film's name or ID first.")
      return
    }
    setUploading(true)
    try {
      const urls = await uploadFilmImage(filmId, file)
      setValue("textureUrl", urls.textureUrl, { shouldDirty: true })
      setValue("thumbUrl", urls.thumbUrl, { shouldDirty: true })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The image didn't upload.")
    } finally {
      setUploading(false)
    }
  }

  async function onSubmit(values: FilmValues) {
    const result = await runAction(() => saveFilm(values, mode), setError)
    if (result?.ok) {
      setOpen(false)
      if (mode === "create") reset(defaults)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) reset(defaults)
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{film ? `Edit ${film.name}` : "Add a film"}</DialogTitle>
          <DialogDescription>Films appear as options in the helmet configurator.</DialogDescription>
        </DialogHeader>

        <form id="film-form" onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField id="film-name" label="Name" error={errors.name?.message}>
              <Input
                {...register("name", {
                  onChange: (event) => {
                    if (mode === "create" && !dirtyFields.id) setValue("id", slugify(event.target.value))
                  },
                })}
                {...fieldA11y("film-name", errors.name?.message)}
                placeholder="e.g. Blue carbon"
              />
            </FormField>
            <FormField id="film-category" label="Category" error={errors.category?.message}>
              <Input {...register("category")} {...fieldA11y("film-category", errors.category?.message)} placeholder="e.g. Carbon" />
            </FormField>
          </div>

          <div className="grid gap-5 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-end">
            <div className="space-y-2">
              <p className="text-sm font-medium">Film photo</p>
              <label className="grid size-24 cursor-pointer place-items-center overflow-hidden rounded-xl border border-dashed border-carbon/25 bg-paper/60 transition-colors hover:border-carbon/50 focus-within:ring-3 focus-within:ring-ring/50">
                {uploading ? (
                  <Loader2 className="size-5 animate-spin text-muted-foreground" aria-hidden />
                ) : thumbUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- uploaded swatch
                  <img src={thumbUrl} alt="Film photo" className="size-full object-cover" />
                ) : (
                  <ImagePlus className="size-5 text-muted-foreground" aria-hidden />
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  aria-label="Upload a film photo"
                  onChange={(event) => {
                    void pickImage(event.target.files?.[0])
                    event.target.value = ""
                  }}
                />
              </label>
            </div>
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                A square photo of the film works best. It&apos;s cropped to the centre and used on the 3D helmet and in the
                film picker.
              </p>
              <FormField id="film-code" label="Film code" optional error={errors.code?.message}>
                <Input {...register("code")} {...fieldA11y("film-code", errors.code?.message)} placeholder="e.g. TSWD2232" />
              </FormField>
            </div>
          </div>

          <FormField
            id="film-id"
            label="ID"
            hint={mode === "create" ? "Used in order records. Can't be changed later." : "Can't be changed."}
            error={errors.id?.message}
          >
            <Input
              {...register("id")}
              {...fieldA11y("film-id", errors.id?.message, true)}
              readOnly={mode === "update"}
              className={cn(mode === "update" && "bg-muted text-muted-foreground")}
            />
          </FormField>

          <Controller
            control={control}
            name="pattern"
            render={({ field }) => (
              <fieldset className="space-y-2">
                <legend className="text-sm font-medium">Fallback pattern</legend>
                <div className="grid grid-cols-5 gap-2">
                  {filmPatterns.map((value) => (
                    <label key={value} className="cursor-pointer text-center">
                      <input
                        type="radio"
                        name="film-pattern"
                        value={value}
                        checked={field.value === value}
                        onChange={() => field.onChange(value)}
                        className="peer sr-only"
                      />
                      <span
                        className={cn(
                          "block aspect-square overflow-hidden rounded-xl ring-1 ring-carbon/15 peer-focus-visible:ring-3 peer-focus-visible:ring-ring/50",
                          field.value === value && "ring-2 ring-carbon ring-offset-2",
                        )}
                      >
                        {value === "none" ? (
                          <span className="block size-full bg-gradient-to-br from-zinc-200 to-zinc-400" />
                        ) : (
                          <FilmSwatch film={value} tint="#6b7280" />
                        )}
                      </span>
                      <span className="mt-1 block text-xs">{patternLabels[value]}</span>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Drawn instead of the photo if it can&apos;t load ({patternLabels[pattern].toLowerCase()}).
                </p>
              </fieldset>
            )}
          />

          <div className="grid gap-5 sm:grid-cols-2">
            <Controller
              control={control}
              name="price"
              render={({ field }) => (
                <FormField id="film-price" label="Price" hint="Added to the helmet price." error={errors.price?.message}>
                  <MoneyInput
                    id="film-price"
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    aria-invalid={errors.price ? true : undefined}
                  />
                </FormField>
              )}
            />
            <FormField id="film-sort" label="Sort order" error={errors.sortOrder?.message}>
              <Input {...register("sortOrder", { valueAsNumber: true })} id="film-sort" type="number" min={0} />
            </FormField>
          </div>

          <Controller
            control={control}
            name="isActive"
            render={({ field }) => (
              <div className="flex items-center justify-between gap-3 rounded-xl border border-carbon/10 p-4">
                <Label htmlFor="film-active" className="block">
                  <span className="font-semibold">Available to customers</span>
                  <span className="block text-xs font-normal text-muted-foreground">Turn off to hide it without deleting.</span>
                </Label>
                <Switch id="film-active" checked={field.value} onCheckedChange={field.onChange} />
              </div>
            )}
          />
        </form>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" form="film-form" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="animate-spin" aria-hidden />}
            {film ? "Save film" : "Add film"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
