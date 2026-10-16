"use client"

import { useState } from "react"
import { Controller, useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ImagePlus, Loader2 } from "lucide-react"
import { toast } from "react-toastify"

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
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { saveTeamMember } from "@/lib/actions/admin/team"
import { uploadTeamPhoto } from "@/lib/team/team-photo"
import { teamMemberSchema, type TeamMemberValues } from "@/lib/validations/team"
import type { TeamMember } from "@/types/team"

interface TeamMemberDialogProps {
  member?: TeamMember
  /** Order for a new member: after everyone already on the team. */
  nextSortOrder?: number
  trigger: React.ReactNode
}

function toValues(member: TeamMember | undefined, nextSortOrder: number): TeamMemberValues {
  return member
    ? {
        name: member.name,
        role: member.role,
        tagline: member.tagline,
        bio: member.bio.join("\n\n"),
        photoUrl: member.photoUrl,
        photoAlt: member.photoAlt,
        featured: member.featured,
        isActive: member.isActive,
        sortOrder: member.sortOrder,
      }
    : { name: "", role: "", tagline: "", bio: "", photoUrl: null, photoAlt: "", featured: false, isActive: true, sortOrder: nextSortOrder }
}

/** Add or edit someone on Meet the Team. */
export function TeamMemberDialog({ member, nextSortOrder = 100, trigger }: TeamMemberDialogProps) {
  const [open, setOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const defaults = toValues(member, nextSortOrder)

  const {
    register,
    control,
    handleSubmit,
    setError,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TeamMemberValues>({ resolver: zodResolver(teamMemberSchema), defaultValues: defaults })
  const photoUrl = useWatch({ control, name: "photoUrl" })

  async function pickPhoto(file: File | undefined) {
    if (!file) return
    setUploading(true)
    try {
      setValue("photoUrl", await uploadTeamPhoto(file), { shouldDirty: true })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The photo didn't upload.")
    } finally {
      setUploading(false)
    }
  }

  async function onSubmit(values: TeamMemberValues) {
    const result = await runAction(() => saveTeamMember(member?.id ?? null, values), setError)
    if (result?.ok) {
      setOpen(false)
      if (!member) reset(defaults)
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
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{member ? `Edit ${member.name}` : "Add a team member"}</DialogTitle>
          <DialogDescription>Shown on Meet the Team, and on the homepage if you choose.</DialogDescription>
        </DialogHeader>

        <form id="team-member-form" onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-5">
          <div className="grid gap-5 sm:grid-cols-[auto_minmax(0,1fr)]">
            <div className="space-y-2">
              <p className="text-sm font-medium">Photo</p>
              <label className="grid aspect-[4/5] w-32 cursor-pointer place-items-center overflow-hidden rounded-2xl border border-dashed border-carbon/25 bg-paper/60 transition-colors hover:border-carbon/50 focus-within:ring-3 focus-within:ring-ring/50">
                {uploading ? (
                  <Loader2 className="size-5 animate-spin text-muted-foreground" aria-hidden />
                ) : photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- preview of the chosen photo
                  <img src={photoUrl} alt="" className="size-full object-cover" />
                ) : (
                  <ImagePlus className="size-5 text-muted-foreground" aria-hidden />
                )}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  aria-label="Upload a photo"
                  onChange={(event) => {
                    void pickPhoto(event.target.files?.[0])
                    event.target.value = ""
                  }}
                />
              </label>
              {errors.photoUrl && <p className="text-xs font-medium text-destructive">{errors.photoUrl.message}</p>}
            </div>
            <div className="grid content-start gap-4">
              <FormField id="team-name" label="Name" error={errors.name?.message}>
                <Input {...register("name")} {...fieldA11y("team-name", errors.name?.message)} placeholder="e.g. Howard Lucas" />
              </FormField>
              <FormField id="team-role" label="Role" error={errors.role?.message}>
                <Input {...register("role")} {...fieldA11y("team-role", errors.role?.message)} placeholder="e.g. Founder" />
              </FormField>
            </div>
          </div>

          <FormField id="team-tagline" label="One-line introduction" hint="Shown under the name on cards." error={errors.tagline?.message}>
            <Input {...register("tagline")} {...fieldA11y("team-tagline", errors.tagline?.message, true)} />
          </FormField>

          <FormField id="team-bio" label="Full introduction" hint="Leave a blank line between paragraphs." error={errors.bio?.message}>
            <Textarea {...register("bio")} {...fieldA11y("team-bio", errors.bio?.message, true)} rows={7} />
          </FormField>

          <FormField id="team-alt" label="Photo description" optional hint="For screen readers, e.g. what they're doing in the photo." error={errors.photoAlt?.message}>
            <Input {...register("photoAlt")} {...fieldA11y("team-alt", errors.photoAlt?.message, true)} />
          </FormField>

          <div className="grid gap-3 sm:grid-cols-2">
            <Controller
              control={control}
              name="featured"
              render={({ field }) => (
                <div className="flex items-center justify-between gap-3 rounded-xl border border-carbon/10 p-4">
                  <Label htmlFor="team-featured" className="block">
                    <span className="font-semibold">On the homepage</span>
                    <span className="block text-xs font-normal text-muted-foreground">In the team section.</span>
                  </Label>
                  <Switch id="team-featured" checked={field.value} onCheckedChange={field.onChange} />
                </div>
              )}
            />
            <Controller
              control={control}
              name="isActive"
              render={({ field }) => (
                <div className="flex items-center justify-between gap-3 rounded-xl border border-carbon/10 p-4">
                  <Label htmlFor="team-active" className="block">
                    <span className="font-semibold">Visible</span>
                    <span className="block text-xs font-normal text-muted-foreground">Turn off to hide.</span>
                  </Label>
                  <Switch id="team-active" checked={field.value} onCheckedChange={field.onChange} />
                </div>
              )}
            />
          </div>

          <FormField id="team-sort" label="Order" hint="Lower numbers come first." error={errors.sortOrder?.message}>
            <Input
              {...register("sortOrder", { valueAsNumber: true })}
              {...fieldA11y("team-sort", errors.sortOrder?.message, true)}
              type="number"
              min={0}
              className="max-w-32"
            />
          </FormField>
        </form>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" form="team-member-form" disabled={isSubmitting || uploading}>
            {isSubmitting && <Loader2 className="animate-spin" aria-hidden />}
            {member ? "Save changes" : "Add to the team"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
