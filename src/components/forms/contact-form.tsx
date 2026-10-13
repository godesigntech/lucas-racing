"use client"

import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Send } from "lucide-react"
import { toast } from "react-toastify"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { sendContactMessage } from "@/lib/services/contact"
import { contactSchema, contactTopics, type ContactFormValues } from "@/lib/validations/contact"

import { fieldA11y, FormField } from "./form-field"

const NO_DESIGN = "none"

export interface DesignOption {
  slug: string
  name: string
}

interface ContactFormProps {
  designs: DesignOption[]
  initialDesign?: string
  initialMessage?: string
}

export function ContactForm({ designs, initialDesign, initialMessage }: ContactFormProps) {
  const hasDesign = designs.some((design) => design.slug === initialDesign)
  const defaultValues: ContactFormValues = {
    name: "",
    email: "",
    phone: "",
    topic: hasDesign ? "helmet-design" : "",
    design: hasDesign && initialDesign ? initialDesign : NO_DESIGN,
    message: initialMessage ?? "",
    consent: false,
  }

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues,
  })

  async function onSubmit(values: ContactFormValues) {
    try {
      const result = await sendContactMessage(values)
      toast.success(result.message)
      reset({ ...defaultValues, message: "", design: NO_DESIGN })
    } catch {
      toast.error("Your message couldn't be sent. Please try again, or email us directly.")
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <FormField id="contact-name" label="Name" error={errors.name?.message}>
          <Input {...register("name")} {...fieldA11y("contact-name", errors.name?.message)} autoComplete="name" placeholder="Your name" />
        </FormField>
        <FormField id="contact-email" label="Email" error={errors.email?.message}>
          <Input
            {...register("email")}
            {...fieldA11y("contact-email", errors.email?.message)}
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
          />
        </FormField>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <FormField id="contact-phone" label="Phone" optional error={errors.phone?.message}>
          <Input
            {...register("phone")}
            {...fieldA11y("contact-phone", errors.phone?.message)}
            type="tel"
            autoComplete="tel"
            placeholder="07700 900000"
          />
        </FormField>

        <Controller
          control={control}
          name="topic"
          render={({ field }) => (
            <FormField id="contact-topic" label="What's it about?" error={errors.topic?.message}>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger {...fieldA11y("contact-topic", errors.topic?.message)} className="w-full" onBlur={field.onBlur}>
                  <SelectValue placeholder="Choose a topic">
                    {contactTopics.find((topic) => topic.value === field.value)?.label}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {contactTopics.map((topic) => (
                    <SelectItem key={topic.value} value={topic.value}>
                      {topic.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          )}
        />
      </div>

      <Controller
        control={control}
        name="design"
        render={({ field }) => (
          <FormField id="contact-design" label="Design you're interested in" optional>
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id="contact-design" className="w-full">
                <SelectValue>
                  {designs.find((design) => design.slug === field.value)?.name ?? "No particular design"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_DESIGN}>No particular design</SelectItem>
                {designs.map((design) => (
                  <SelectItem key={design.slug} value={design.slug}>
                    {design.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
        )}
      />

      <FormField id="contact-message" label="Message" error={errors.message?.message}>
        <Textarea
          {...register("message")}
          {...fieldA11y("contact-message", errors.message?.message)}
          rows={6}
          placeholder="Tell us about your helmet, your colours and when you need it."
        />
      </FormField>

      <Controller
        control={control}
        name="consent"
        render={({ field, fieldState }) => (
          <div className="space-y-2">
            <div className="flex items-start gap-3">
              <Checkbox
                id="contact-consent"
                checked={field.value}
                onCheckedChange={(checked) => field.onChange(checked === true)}
                aria-invalid={fieldState.error ? true : undefined}
                aria-describedby={fieldState.error ? "contact-consent-error" : undefined}
                className="mt-0.5"
              />
              <Label htmlFor="contact-consent" className="block text-sm font-normal leading-relaxed">
                I’m happy for Lucas Racing to use these details to reply to my enquiry.
              </Label>
            </div>
            {fieldState.error && (
              <p id="contact-consent-error" role="alert" className="text-xs font-medium text-destructive">
                {fieldState.error.message}
              </p>
            )}
          </div>
        )}
      />

      <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={isSubmitting}>
        {isSubmitting ? <Loader2 className="animate-spin" aria-hidden /> : <Send aria-hidden />}
        {isSubmitting ? "Sending…" : "Send message"}
      </Button>
    </form>
  )
}
