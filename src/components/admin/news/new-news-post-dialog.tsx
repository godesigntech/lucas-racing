"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Plus } from "lucide-react"

import { fieldA11y, FormField } from "@/components/forms/form-field"
import { runAction } from "@/components/forms/use-action-form"
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
import { createNewsPost } from "@/lib/actions/admin/news"
import { newNewsPostSchema, type NewNewsPostValues } from "@/lib/validations/news"

/** Starts a draft from a title, then opens the editor. */
export function NewNewsPostDialog() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<NewNewsPostValues>({ resolver: zodResolver(newNewsPostSchema), defaultValues: { title: "" } })

  async function onSubmit(values: NewNewsPostValues) {
    const result = await runAction(() => createNewsPost(values), setError)
    if (result?.ok && result.data) {
      setOpen(false)
      reset()
      router.push(`/admin/news/${result.data.id}`)
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
          <Plus /> New post
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New post</DialogTitle>
          <DialogDescription>It starts as a draft. Write it, add a photo, then publish when it&apos;s ready.</DialogDescription>
        </DialogHeader>
        <form id="new-news-post" onSubmit={handleSubmit(onSubmit)} noValidate>
          <FormField id="news-new-title" label="Title" error={errors.title?.message}>
            <Input {...register("title")} {...fieldA11y("news-new-title", errors.title?.message)} placeholder="e.g. Podium double at Whilton Mill" autoFocus />
          </FormField>
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" form="new-news-post" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="animate-spin" aria-hidden />}
            Create draft
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
