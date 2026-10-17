"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Plus } from "lucide-react"

import { fieldA11y, FormField } from "@/components/forms/form-field"
import { runAction } from "@/components/forms/use-action-form"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { createAlbum } from "@/lib/actions/admin/gallery"
import { newAlbumSchema, type NewAlbumValues } from "@/lib/validations/gallery"

/** Starts an album from a title, then opens it to add photos. */
export function NewAlbumDialog() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<NewAlbumValues>({ resolver: zodResolver(newAlbumSchema), defaultValues: { title: "" } })

  async function onSubmit(values: NewAlbumValues) {
    const result = await runAction(() => createAlbum(values), setError)
    if (result?.ok && result.data) {
      setOpen(false)
      reset()
      router.push(`/admin/gallery/${result.data.id}`)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) reset()
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <Plus /> New album
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New album</DialogTitle>
          <DialogDescription>It starts hidden. Add photos, then publish it.</DialogDescription>
        </DialogHeader>
        <form id="new-album" onSubmit={handleSubmit(onSubmit)} noValidate>
          <FormField id="album-new-title" label="Title" error={errors.title?.message}>
            <Input {...register("title")} {...fieldA11y("album-new-title", errors.title?.message)} placeholder="e.g. Whilton Mill, round 4" autoFocus />
          </FormField>
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" form="new-album" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="animate-spin" aria-hidden />}
            Create album
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
