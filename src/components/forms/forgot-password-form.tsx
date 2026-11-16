"use client"

import { useState } from "react"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, MailCheck } from "lucide-react"
import { toast } from "react-toastify"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { requestPasswordReset } from "@/lib/actions/auth"
import { forgotPasswordSchema, type ForgotPasswordValues } from "@/lib/validations/auth"

import { fieldA11y, FormField } from "./form-field"

export function ForgotPasswordForm() {
  const [sentTo, setSentTo] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    setError,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  })

  async function send(values: ForgotPasswordValues) {
    try {
      const result = await requestPasswordReset(values)
      if (!result.ok) {
        for (const [field, message] of Object.entries(result.fieldErrors ?? {})) {
          setError(field as keyof ForgotPasswordValues, { message })
        }
        toast.error(result.message)
        return
      }
      if (sentTo) toast.success("We've sent another link.")
      setSentTo(values.email)
    } catch {
      toast.error("We couldn't reach the server. Check your connection and try again.")
    }
  }

  if (sentTo) {
    return (
      <div className="space-y-4 rounded-3xl border border-carbon/10 bg-card p-6 text-center" role="status">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-accent text-brand-ink">
          <MailCheck className="size-6" aria-hidden />
        </span>
        <h2 className="font-display text-3xl font-bold uppercase">Check your inbox</h2>
        <p className="text-sm text-muted-foreground">
          If <strong className="text-carbon">{sentTo}</strong> has an account, we&apos;ve sent it a link to choose a new
          password. The link works once and expires after an hour. Check your spam folder if it hasn&apos;t arrived.
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          <Button type="button" variant="outline" disabled={isSubmitting} onClick={() => send(getValues())}>
            {isSubmitting && <Loader2 className="animate-spin" aria-hidden />}
            Send it again
          </Button>
          <Button asChild variant="ghost">
            <Link href="/login">Back to login</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(send)} noValidate className="space-y-5">
      <FormField id="forgot-email" label="Email" error={errors.email?.message}>
        <Input
          {...register("email")}
          {...fieldA11y("forgot-email", errors.email?.message)}
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
        />
      </FormField>

      <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="animate-spin" aria-hidden />}
        {isSubmitting ? "Sending…" : "Send reset link"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Remembered it?{" "}
        <Link href="/login" className="font-semibold text-carbon underline-offset-4 hover:underline">
          Back to login
        </Link>
      </p>
    </form>
  )
}
