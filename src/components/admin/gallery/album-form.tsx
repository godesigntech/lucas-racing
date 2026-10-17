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
import { Textarea } from "@/components/ui/textarea"
import { updateAlbum } from "@/lib/actions/admin/gallery"
import { albumSchema, type AlbumValues } from "@/lib/validations/gallery"
import type { GalleryAlbum } from "@/types/gallery"

/** Title, web address, event, date, description and whether the album is on the website. */
export function AlbumForm({ album }: { album: GalleryAlbum }) {
  const defaults: AlbumValues = {
    title: album.title,
    slug: album.slug,
    event: album.event,
    albumDate: album.albumDate ?? "",
    description: album.description,
    isPublished: album.isPublished,
  }
  const {
    register,
    control,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<AlbumValues>({ resolver: zodResolver(albumSchema), defaultValues: defaults })

  async function onSubmit(values: AlbumValues) {
    const result = await runAction(() => updateAlbum(album.id, values), setError)
    if (result?.ok) reset(values)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <FormField id="album-title" label="Title" error={errors.title?.message}>
          <Input {...register("title")} {...fieldA11y("album-title", errors.title?.message)} />
        </FormField>
        <FormField id="album-slug" label="Web address" hint="gallery/…" error={errors.slug?.message}>
          <Input {...register("slug")} {...fieldA11y("album-slug", errors.slug?.message, true)} />
        </FormField>
        <FormField id="album-event" label="Event" optional error={errors.event?.message}>
          <Input {...register("event")} {...fieldA11y("album-event", errors.event?.message)} placeholder="e.g. Club championship, round 4" />
        </FormField>
        <FormField id="album-date" label="Date" optional error={errors.albumDate?.message}>
          <Input {...register("albumDate")} {...fieldA11y("album-date", errors.albumDate?.message)} type="date" />
        </FormField>
      </div>
      <FormField id="album-description" label="Description" optional error={errors.description?.message}>
        <Textarea {...register("description")} {...fieldA11y("album-description", errors.description?.message)} rows={3} className="min-h-20" />
      </FormField>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Controller
          control={control}
          name="isPublished"
          render={({ field }) => (
            <div className="flex items-center gap-3">
              <Switch id="album-published" checked={field.value} onCheckedChange={field.onChange} />
              <Label htmlFor="album-published">On the website</Label>
            </div>
          )}
        />
        <Button type="submit" disabled={isSubmitting || !isDirty}>
          {isSubmitting && <Loader2 className="animate-spin" aria-hidden />}
          Save album
        </Button>
      </div>
    </form>
  )
}
