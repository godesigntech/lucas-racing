"use client"

import { useId, useState } from "react"
import Link from "next/link"
import { Controller, useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Check, CheckCircle2, ImagePlus, Loader2, Plus, Send, X } from "lucide-react"
import { toast } from "react-toastify"

import { LogoUpload } from "@/components/builder/logo-upload"
import { AddressFields } from "@/components/forms/address-fields"
import { fieldA11y, FormField } from "@/components/forms/form-field"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { submitOwnHelmetRequest } from "@/lib/actions/own-helmet"
import { DESIGN_PHOTO_ACCEPT, prepareDesignPhoto, uploadDesignPhoto, validateDesignPhoto } from "@/lib/design-assistant/photo"
import { cn } from "@/lib/utils"
import {
  ownHelmetFinishes,
  ownHelmetFinishLabels,
  ownHelmetLacquerLabels,
  ownHelmetLacquers,
  ownHelmetSchema,
  type OwnHelmetValues,
} from "@/lib/validations/own-helmet"
import type { Profile } from "@/types/account"
import type { Film } from "@/types/catalog"

const MAX_PHOTOS = 6
const MAX_LOGOS = 6
const RETURN_TO = "/helmet-builder/own-helmet"

const finishHints: Record<(typeof ownHelmetFinishes)[number], string> = {
  standard: "Clean, solid colours",
  metallic: "Shimmering depth and sparkle",
  chrome: "Mirror-like, premium",
}

function Section({ step, title, description, children }: { step: number; title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-carbon/10 bg-card p-5 sm:p-7">
      <div className="mb-5 flex items-start gap-3">
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-carbon font-display text-sm font-bold text-paper">{step}</span>
        <div>
          <h2 className="font-display text-xl font-bold uppercase leading-tight">{title}</h2>
          {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
        </div>
      </div>
      {children}
    </section>
  )
}

/** Photos of the customer's own helmet: uploaded straight away to the private design-uploads bucket. */
function PhotoPicker({ paths, onChange, error }: { paths: string[]; onChange: (paths: string[]) => void; error?: string }) {
  const inputId = useId()
  const [previews, setPreviews] = useState<Record<string, string>>({})
  const [uploading, setUploading] = useState(0)

  async function add(files: FileList | null) {
    const room = MAX_PHOTOS - paths.length
    const chosen = Array.from(files ?? []).slice(0, room)
    if (chosen.length === 0) return
    setUploading((count) => count + chosen.length)
    const added: string[] = []
    for (const file of chosen) {
      try {
        const problem = validateDesignPhoto(file)
        if (problem) {
          toast.error(problem)
          continue
        }
        const prepared = await prepareDesignPhoto(file)
        const path = await uploadDesignPhoto(prepared.blob)
        setPreviews((current) => ({ ...current, [path]: prepared.previewUrl }))
        added.push(path)
      } catch {
        toast.error(`${file.name} didn't upload. Please try again.`)
      } finally {
        setUploading((count) => count - 1)
      }
    }
    if (added.length) onChange([...paths, ...added])
  }

  return (
    <div className="space-y-3">
      <ul className="grid grid-cols-3 gap-3 sm:grid-cols-6">
        {paths.map((path, index) => (
          <li key={path} className="relative aspect-square overflow-hidden rounded-2xl bg-carbon/5 ring-1 ring-carbon/10">
            {/* eslint-disable-next-line @next/next/no-img-element -- local preview of an upload */}
            {previews[path] && <img src={previews[path]} alt={`Photo ${index + 1} of your helmet`} className="size-full object-cover" />}
            <button
              type="button"
              onClick={() => onChange(paths.filter((item) => item !== path))}
              aria-label={`Remove photo ${index + 1}`}
              className="absolute right-1.5 top-1.5 grid size-7 place-items-center rounded-full bg-carbon/80 text-paper hover:bg-carbon"
            >
              <X className="size-4" aria-hidden />
            </button>
          </li>
        ))}
        {paths.length + uploading < MAX_PHOTOS && (
          <li>
            <label
              htmlFor={inputId}
              className="relative flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-carbon/20 text-center text-xs text-muted-foreground transition-colors hover:border-carbon/40 focus-within:ring-3 focus-within:ring-ring/50"
            >
              {uploading ? <Loader2 className="size-5 animate-spin" aria-hidden /> : <ImagePlus className="size-5" aria-hidden />}
              <span className="font-semibold text-carbon">{uploading ? "Uploading…" : "Add photos"}</span>
              <input
                id={inputId}
                type="file"
                accept={DESIGN_PHOTO_ACCEPT}
                multiple
                className="sr-only"
                onChange={(event) => {
                  void add(event.target.files)
                  event.target.value = ""
                }}
              />
            </label>
          </li>
        )}
      </ul>
      <p className="text-xs text-muted-foreground">Front, both sides, back and top help us most. Up to {MAX_PHOTOS} photos, JPG, PNG or WebP.</p>
      {error && <p role="alert" className="text-xs font-medium text-destructive">{error}</p>}
    </div>
  )
}

/** Hydro-dip films from the workshop's library; the customer can pick several. */
function FilmPicker({ films, value, onChange, error }: { films: Film[]; value: string[]; onChange: (ids: string[]) => void; error?: string }) {
  if (films.length === 0) return <p className="text-sm text-muted-foreground">Our film library is being updated. Mention any film you&apos;d like in your description.</p>
  return (
    <div className="space-y-3">
      <ul className="grid grid-cols-3 gap-3 sm:grid-cols-5">
        {films.map((film) => {
          const selected = value.includes(film.id)
          return (
            <li key={film.id}>
              <button
                type="button"
                aria-pressed={selected}
                onClick={() => onChange(selected ? value.filter((id) => id !== film.id) : [...value, film.id])}
                className={cn(
                  "group relative block w-full overflow-hidden rounded-2xl text-left ring-1 transition",
                  selected ? "ring-2 ring-carbon" : "ring-carbon/10 hover:ring-carbon/40",
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- small film swatch */}
                <img src={film.thumbUrl ?? film.textureUrl ?? ""} alt="" className="aspect-square w-full object-cover" loading="lazy" />
                <span className="block truncate px-2 py-1.5 text-xs font-medium">{film.name}</span>
                {selected && (
                  <span className="absolute right-1.5 top-1.5 grid size-6 place-items-center rounded-full bg-carbon text-paper">
                    <Check className="size-3.5" aria-hidden />
                  </span>
                )}
              </button>
            </li>
          )
        })}
      </ul>
      <p className="text-xs text-muted-foreground">{value.length ? `${value.length} chosen.` : "Optional."} Tell us in your description where each film should go.</p>
      {error && <p role="alert" className="text-xs font-medium text-destructive">{error}</p>}
    </div>
  )
}

/**
 * "Send my own helmet": no 3D builder. The customer sends photos of their helmet,
 * describes the design and their choices, and the workshop replies with a quote.
 * Their contact details are required in full and saved to their account.
 */
export function OwnHelmetForm({ profile, films }: { profile: Profile; films: Film[] }) {
  const [sent, setSent] = useState<string | null>(null)
  const [logoSlots, setLogoSlots] = useState(1)
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<OwnHelmetValues>({
    resolver: zodResolver(ownHelmetSchema),
    defaultValues: {
      makeModel: "",
      size: "",
      photos: [],
      notes: "",
      finishes: ["standard"],
      lacquer: "gloss",
      films: [],
      racingName: "",
      racingNumber: "",
      extraText: "",
      logos: [],
      name: profile.fullName,
      phone: profile.phone,
      address: {
        line1: profile.addressLine1,
        line2: profile.addressLine2,
        city: profile.city,
        county: profile.county,
        postcode: profile.postcode,
        country: profile.country || "United Kingdom",
      },
    },
  })
  const finishes = useWatch({ control, name: "finishes" })
  const glossOnly = finishes.some((finish) => finish !== "standard")

  async function onSubmit(values: OwnHelmetValues) {
    const result = await submitOwnHelmetRequest(values)
    if (!result.ok) {
      for (const [field, message] of Object.entries(result.fieldErrors ?? {})) setError(field as keyof OwnHelmetValues, { message })
      toast.error(result.message)
      return
    }
    setSent(result.data?.reference ?? "")
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  if (sent !== null) {
    return (
      <div role="status" className="flex flex-col items-center gap-4 rounded-3xl border border-carbon/10 bg-card px-6 py-12 text-center">
        <CheckCircle2 className="size-10 text-brand-ink" aria-hidden />
        <h2 className="font-display text-3xl font-bold uppercase">Request sent</h2>
        <p className="max-w-md text-sm text-muted-foreground">
          Thanks! Your reference is <span className="font-semibold text-carbon">{sent}</span>. We&apos;ll look at your photos and come back to you with a quote and
          how to send us your helmet.
        </p>
        <Button asChild>
          <Link href="/account/quotes">View my requests</Link>
        </Button>
      </div>
    )
  }

  const addressErrors = {
    line1: errors.address?.line1?.message,
    city: errors.address?.city?.message,
    postcode: errors.address?.postcode?.message,
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      <Section step={1} title="Your helmet" description="Which helmet you'll be sending us.">
        <div className="grid gap-5 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <FormField id="own-make" label="Make and model" error={errors.makeModel?.message}>
            <Input {...register("makeModel")} {...fieldA11y("own-make", errors.makeModel?.message)} placeholder="e.g. Arai SK-6 or Bell KC7" />
          </FormField>
          <FormField id="own-size" label="Size" optional error={errors.size?.message}>
            <Input {...register("size")} {...fieldA11y("own-size", errors.size?.message)} placeholder="e.g. M" />
          </FormField>
        </div>
      </Section>

      <Section step={2} title="Photos of your helmet" description="So we can see its shape, condition and any existing paint.">
        <Controller control={control} name="photos" render={({ field }) => <PhotoPicker paths={field.value} onChange={field.onChange} error={errors.photos?.message} />} />
      </Section>

      <Section step={3} title="Your design" description="Describe what you'd like: colours, layout, style, anything you love. Rough ideas are fine.">
        <FormField id="own-notes" label="Design description" error={errors.notes?.message}>
          <Textarea
            {...register("notes")}
            {...fieldA11y("own-notes", errors.notes?.message)}
            rows={5}
            placeholder="e.g. Matte black base with lime green flames from the chin bar, carbon film on the top, white pinstripes."
          />
        </FormField>
      </Section>

      <Section step={4} title="Paint finishes" description="Choose every finish you'd like somewhere on the helmet, then the overall lacquer.">
        <Controller
          control={control}
          name="finishes"
          render={({ field }) => (
            <fieldset className="grid gap-3 sm:grid-cols-3">
              <legend className="sr-only">Paint finishes</legend>
              {ownHelmetFinishes.map((finish) => {
                const selected = field.value.includes(finish)
                return (
                  <button
                    key={finish}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => field.onChange(selected ? field.value.filter((item) => item !== finish) : [...field.value, finish])}
                    className={cn(
                      "flex flex-col items-start rounded-2xl border px-4 py-3 text-left transition-colors",
                      selected ? "border-carbon bg-carbon text-paper" : "border-carbon/15 hover:border-carbon/40",
                    )}
                  >
                    <span className="font-semibold">{ownHelmetFinishLabels[finish]}</span>
                    <span className={cn("text-xs", selected ? "text-paper/70" : "text-muted-foreground")}>{finishHints[finish]}</span>
                  </button>
                )
              })}
            </fieldset>
          )}
        />
        <Controller
          control={control}
          name="lacquer"
          render={({ field }) => (
            <fieldset className="mt-5 space-y-2">
              <legend className="mb-2 text-sm font-semibold">Overall lacquer</legend>
              <div className="flex flex-wrap gap-2">
                {ownHelmetLacquers.map((lacquer) => {
                  const disabled = lacquer === "matt" && glossOnly
                  return (
                    <button
                      key={lacquer}
                      type="button"
                      disabled={disabled}
                      aria-pressed={field.value === lacquer}
                      onClick={() => field.onChange(lacquer)}
                      className={cn(
                        "h-10 rounded-full border px-5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40",
                        field.value === lacquer ? "border-carbon bg-carbon text-paper" : "border-carbon/15 hover:border-carbon/40",
                      )}
                    >
                      {ownHelmetLacquerLabels[lacquer]}
                    </button>
                  )
                })}
              </div>
              {glossOnly && <p className="text-xs text-muted-foreground">Metallic and chrome need a gloss lacquer.</p>}
              {errors.lacquer?.message && <p role="alert" className="text-xs font-medium text-destructive">{errors.lacquer.message}</p>}
            </fieldset>
          )}
        />
      </Section>

      <Section step={5} title="Hydrographic films" description="Pick any films you'd like used on your helmet.">
        <Controller control={control} name="films" render={({ field }) => <FilmPicker films={films} value={field.value} onChange={field.onChange} error={errors.films?.message} />} />
      </Section>

      <Section step={6} title="Name, number and logos" description="Optional. We place them on your proof for you to approve.">
        <div className="grid gap-5 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <FormField id="own-name-on" label="Name on the helmet" optional error={errors.racingName?.message}>
            <Input {...register("racingName")} {...fieldA11y("own-name-on", errors.racingName?.message)} />
          </FormField>
          <FormField id="own-number" label="Race number" optional error={errors.racingNumber?.message}>
            <Input {...register("racingNumber")} {...fieldA11y("own-number", errors.racingNumber?.message)} inputMode="numeric" />
          </FormField>
          <FormField id="own-text" label="Any other text" optional error={errors.extraText?.message} className="sm:col-span-2">
            <Input {...register("extraText")} {...fieldA11y("own-text", errors.extraText?.message)} placeholder="e.g. initials, a flag or a team name" />
          </FormField>
        </div>
        <Controller
          control={control}
          name="logos"
          render={({ field }) => (
            <div className="mt-5 space-y-3">
              {Array.from({ length: Math.max(logoSlots, field.value.length) }, (_, index) => (
                <LogoUpload
                  key={index}
                  path={field.value[index]}
                  returnTo={RETURN_TO}
                  onChange={(path) => {
                    const next = [...field.value]
                    if (path) next[index] = path
                    else next.splice(index, 1)
                    field.onChange(next.filter(Boolean))
                    if (!path) setLogoSlots((count) => Math.max(1, count - 1))
                  }}
                />
              ))}
              {field.value.length >= logoSlots && logoSlots < MAX_LOGOS && (
                <Button type="button" variant="outline" size="sm" onClick={() => setLogoSlots((count) => count + 1)}>
                  <Plus /> Add another logo
                </Button>
              )}
              {errors.logos?.message && <p role="alert" className="text-xs font-medium text-destructive">{errors.logos.message}</p>}
            </div>
          )}
        />
      </Section>

      <Section step={7} title="Your details" description="We need these to quote and arrange your helmet. They're saved to your account.">
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField id="own-full-name" label="Full name" error={errors.name?.message}>
            <Input {...register("name")} {...fieldA11y("own-full-name", errors.name?.message)} autoComplete="name" />
          </FormField>
          <FormField id="own-phone" label="Phone" error={errors.phone?.message}>
            <Input {...register("phone")} {...fieldA11y("own-phone", errors.phone?.message)} type="tel" autoComplete="tel" />
          </FormField>
          <p className="text-sm text-muted-foreground sm:col-span-2">
            Email: <span className="font-medium text-carbon">{profile.email}</span>
          </p>
        </div>
        <div className="mt-6 border-t border-carbon/10 pt-6">
          <h3 className="mb-4 text-sm font-semibold">Your address</h3>
          <AddressFields
            register={register}
            idPrefix="own-address"
            errors={addressErrors}
            names={{
              line1: "address.line1",
              line2: "address.line2",
              city: "address.city",
              county: "address.county",
              postcode: "address.postcode",
              country: "address.country",
            }}
          />
        </div>
      </Section>

      <div className="flex flex-col items-start gap-3 rounded-3xl border border-brand-ink/20 bg-accent p-5 text-accent-foreground sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm">No payment today. We&apos;ll check your photos and send you a quote.</p>
        <Button type="submit" size="lg" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="animate-spin" /> : <Send />} Send request
        </Button>
      </div>
    </form>
  )
}
