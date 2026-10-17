"use client"

import { useEffect } from "react"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowLeft, Loader2, Send } from "lucide-react"
import { toast } from "react-toastify"

import { fieldA11y, FormField } from "@/components/forms/form-field"
import { runAction } from "@/components/forms/use-action-form"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { submitQuoteRequest } from "@/lib/actions/design-assistant"
import { dataUrlToBlob, uploadDesignPhoto, type PreparedPhoto } from "@/lib/design-assistant/photo"
import { useSignedInContact } from "@/lib/design-assistant/use-signed-in-contact"
import { cn } from "@/lib/utils"
import { quoteFormSchema, type QuoteFormValues } from "@/lib/validations/design-assistant"
import { quoteHelmetLabels, quoteHelmets, type DesignAnalysis } from "@/types/design-assistant"

interface QuoteFormProps {
  photo: PreparedPhoto | null
  note: string
  analysis: DesignAnalysis
  /** The AI concept image (a data URL), sent with the request when there is one. */
  aiImage?: string | null
  onSent: (reference: string) => void
  onBack: () => void
}

/** Step three: contact details and helmet choice, sent with the photo and concept. */
export function QuoteForm({ photo, note, analysis, aiImage, onSent, onBack }: QuoteFormProps) {
  const {
    register,
    control,
    handleSubmit,
    setError,
    reset,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<QuoteFormValues>({
    resolver: zodResolver(quoteFormSchema),
    defaultValues: { name: "", email: "", phone: "", helmet: undefined, notes: note, consent: false },
  })

  // Signed-in customers get their details filled in, without overwriting anything already typed.
  const contact = useSignedInContact()
  useEffect(() => {
    if (contact) reset({ ...getValues(), ...contact }, { keepDirtyValues: true })
  }, [contact, reset, getValues])

  async function onSubmit(values: QuoteFormValues) {
    let imagePath: string | null = null
    if (photo) {
      try {
        imagePath = await uploadDesignPhoto(photo.blob)
      } catch {
        toast.error("Your photo didn't upload. Check your connection and try again.")
        return
      }
    }
    let aiImagePath: string | null = null
    if (aiImage) {
      try {
        aiImagePath = await uploadDesignPhoto(await dataUrlToBlob(aiImage))
      } catch {
        toast.error("Your AI concept didn't upload. Check your connection and try again.")
        return
      }
    }

    const result = await runAction(
      () =>
        submitQuoteRequest({
          ...values,
          imagePath,
          aiImagePath,
          palette: analysis.palette.map((colour) => colour.hex),
          concept: { look: analysis.concept, summary: analysis.summary, basedOn: analysis.basedOn },
          suggestedProducts: analysis.suggestions.map((suggestion) => suggestion.slug),
        }),
      setError,
    )
    if (result?.ok && result.data) onSent(result.data.reference)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4 rounded-3xl border border-carbon/10 bg-card p-4">
      <div className="flex items-center gap-2">
        <Button type="button" variant="ghost" size="icon-sm" onClick={onBack} aria-label="Back to the concept">
          <ArrowLeft />
        </Button>
        <div>
          <h3 className="font-display text-xl font-bold uppercase leading-none">Get a quote</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">We&apos;ll reply with a price and a proof.</p>
        </div>
      </div>

      <FormField id="quote-name" label="Name" error={errors.name?.message}>
        <Input {...register("name")} {...fieldA11y("quote-name", errors.name?.message)} autoComplete="name" />
      </FormField>
      <FormField id="quote-email" label="Email" error={errors.email?.message}>
        <Input
          {...register("email")}
          {...fieldA11y("quote-email", errors.email?.message)}
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
        />
      </FormField>
      <FormField id="quote-phone" label="Phone" optional error={errors.phone?.message}>
        <Input {...register("phone")} {...fieldA11y("quote-phone", errors.phone?.message)} type="tel" autoComplete="tel" />
      </FormField>

      <Controller
        control={control}
        name="helmet"
        render={({ field, fieldState }) => (
          <fieldset className="space-y-2" aria-describedby={fieldState.error ? "quote-helmet-error" : undefined}>
            <legend className="text-sm font-medium">Which helmet?</legend>
            <div className="grid grid-cols-2 gap-2">
              {quoteHelmets.map((value) => (
                <label
                  key={value}
                  className={cn(
                    "flex cursor-pointer items-center rounded-2xl border px-3 py-2.5 text-sm transition-colors has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50",
                    field.value === value
                      ? "border-carbon bg-carbon text-paper"
                      : "border-carbon/15 hover:border-carbon/40",
                  )}
                >
                  <input
                    type="radio"
                    name={field.name}
                    value={value}
                    checked={field.value === value}
                    onChange={() => field.onChange(value)}
                    onBlur={field.onBlur}
                    className="sr-only"
                  />
                  {quoteHelmetLabels[value]}
                </label>
              ))}
            </div>
            {fieldState.error && (
              <p id="quote-helmet-error" role="alert" className="text-xs font-medium text-destructive">
                {fieldState.error.message}
              </p>
            )}
          </fieldset>
        )}
      />

      <FormField id="quote-notes" label="Anything else?" optional error={errors.notes?.message}>
        <Textarea
          {...register("notes")}
          {...fieldA11y("quote-notes", errors.notes?.message)}
          rows={3}
          className="min-h-20"
          placeholder="Size, deadline, sponsor logos…"
        />
      </FormField>

      <Controller
        control={control}
        name="consent"
        render={({ field, fieldState }) => (
          <div className="space-y-1.5">
            <div className="flex items-start gap-3">
              <Checkbox
                id="quote-consent"
                checked={field.value}
                onCheckedChange={(checked) => field.onChange(checked === true)}
                aria-invalid={fieldState.error ? true : undefined}
                aria-describedby={fieldState.error ? "quote-consent-error" : undefined}
                className="mt-0.5"
              />
              <Label htmlFor="quote-consent" className="block text-xs font-normal leading-relaxed">
                I&apos;m happy for Lucas Racing to use these details and my photo to prepare a quote.
              </Label>
            </div>
            {fieldState.error && (
              <p id="quote-consent-error" role="alert" className="text-xs font-medium text-destructive">
                {fieldState.error.message}
              </p>
            )}
          </div>
        )}
      />

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? <Loader2 className="animate-spin" aria-hidden /> : <Send aria-hidden />}
        {isSubmitting ? "Sending…" : "Send quote request"}
      </Button>
    </form>
  )
}
